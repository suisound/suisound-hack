module suisound::suisound {
    // ======== Imports ========
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::balance::{Self, Balance};
    use sui::types;
    use sui::sui::SUI;
    use sui::event;
    use std::option;

    // ======== Errors ========
    const EInvalidWitness: u64 = 0;
    const EInsufficientStake: u64 = 1;
    const EStakeNotFound: u64 = 2;
    const EInsufficientRewards: u64 = 4;
    const ETreasuryInsufficient: u64 = 5;

    // ======== Constants ========
    /// Initial supply of SUISOUND tokens (1 billion with 9 decimals)
    const INITIAL_SUPPLY: u64 = 1_000_000_000_000_000_000;
    /// Minimum stake amount (1 SUI = 1,000,000,000 MIST)
    const MIN_STAKE_AMOUNT: u64 = 1_000_000_000;
    /// Pro tier threshold (100 SUI)
    const PRO_TIER_THRESHOLD: u64 = 100_000_000_000;
    /// Base reward rate (1 SUISOUND per day per SUI)
    const REWARD_RATE: u64 = 1;
    /// Cooldown period in milliseconds (24 hours)
    const COOLDOWN_PERIOD: u64 = 86400_000;

    // ======== Event Structs ========
    struct StakeEvent has copy, drop, store {
        staker: address,
        amount: u64,
        new_total: u64,
        timestamp: u64,
    }

    struct ClaimRewardsEvent has copy, drop, store {
        staker: address,
        reward: u64,
        timestamp: u64,
    }

    struct UnstakeEvent has copy, drop, store {
        staker: address,
        amount: u64,
        timestamp: u64,
    }

    // ======== Structs ========
    /// The SUISOUND token type (also used as the one‑time witness)
    struct SUISOUND has drop {}

    /// A user’s stake record. (Note we no longer store an “is_pro” flag –
    /// the multiplier is computed on the current total stake.)
    struct Stake has store {
        amount: u64,
        // Track the last time rewards were claimed so that
        // rewards only accrue after that moment.
        last_claim_time: u64,
    }

    /// The treasury holds the SUISOUND tokens and SUI deposits, and tracks stakes.
    struct Treasury has key {
        id: UID,
        suisound_balance: Balance<SUISOUND>,
        sui_balance: Balance<SUI>,
        stakes: Table<address, Stake>,
        total_staked: u64,
        total_rewards_distributed: u64,
    }

    // ======== Initialization ========
    /// Module initializer – creates the SUISOUND currency and treasury.
    public fun init(otw: SUISOUND, ctx: &mut TxContext) {
        // Verify one-time witness.
        assert!(types::is_one_time_witness(&otw), EInvalidWitness);

        let (treasury_cap, metadata) = coin::create_currency(
            otw,
            9,                          // decimals
            b"SUISOUND",                // symbol
            b"SUISOUND",                // name
            b"SuiSound Platform Token", // description
            option::none(),             // no icon url
            ctx
        );

        // Mint the initial supply.
        let treasury_balance = coin::mint_balance(&mut treasury_cap, INITIAL_SUPPLY);

        // Create the treasury.
        let treasury = Treasury {
            id: object::new(ctx),
            suisound_balance: treasury_balance,
            sui_balance: balance::zero(),
            stakes: table::new(ctx),
            total_staked: 0,
            total_rewards_distributed: 0,
        };

        transfer::share_object(treasury);
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);
    }

    // ======== Helper Functions ========
    /// Compute the reward multiplier based on a given total stake.
    public fun get_reward_multiplier(total_amount: u64): u64 {
        if (total_amount >= PRO_TIER_THRESHOLD) {
            5
        } else {
            1
        }
    }

    /// Calculate rewards for a stake based on time elapsed since last claim.
    public fun calculate_rewards(stake: &Stake, current_time: u64): u64 {
        let time_elapsed = current_time - stake.last_claim_time;
        let days_elapsed = time_elapsed / COOLDOWN_PERIOD;
        let multiplier = get_reward_multiplier(stake.amount);
        // Note: stake.amount is denominated in MIST. We scale down by 1_000_000_000.
        (stake.amount * REWARD_RATE * days_elapsed * multiplier) / 1_000_000_000
    }

    // ======== Entry Functions ========
    /// Stake SUI tokens.
    ///
    /// If the staker already has a stake, any accrued rewards are first auto‑claimed
    /// (so that reward accrual for the new deposit starts fresh), and then the new amount is merged.
    public entry fun stake(
        treasury: &mut Treasury,
        payment: Coin<SUI>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // Verify the minimum stake and that the payment covers the amount.
        assert!(amount >= MIN_STAKE_AMOUNT, EInsufficientStake);
        let coin_value = coin::value(&payment);
        assert!(coin_value >= amount, EInsufficientStake);

        // Convert the payment coin to a balance and add it to the treasury’s SUI balance.
        let sui_balance = coin::into_balance(payment);
        balance::join(&mut treasury.sui_balance, sui_balance);

        let current_time = tx_context::epoch_timestamp_ms(ctx);
        let staker = tx_context::sender(ctx);

        if (table::contains(&treasury.stakes, staker)) {
            // Auto-claim any rewards accrued so far before merging.
            let stake_ref = table::borrow_mut(&mut treasury.stakes, staker);
            let pending_rewards = calculate_rewards(stake_ref, current_time);
            if (pending_rewards > 0) {
                let treasury_token_value = balance::value(&treasury.suisound_balance);
                assert!(treasury_token_value >= pending_rewards, ETreasuryInsufficient);
                let reward_coin = coin::from_balance(
                    balance::split(&mut treasury.suisound_balance, pending_rewards),
                    ctx
                );
                transfer::public_transfer(reward_coin, staker);
                treasury.total_rewards_distributed = treasury.total_rewards_distributed + pending_rewards;
                event::emit_event(
                    ClaimRewardsEvent { staker, reward: pending_rewards, timestamp: current_time },
                    ctx
                );
            }
            // Merge the new deposit with the existing stake.
            stake_ref.amount = stake_ref.amount + amount;
            stake_ref.last_claim_time = current_time;
        } else {
            // Create a new stake record.
            let new_stake = Stake {
                amount,
                last_claim_time: current_time,
            };
            table::add(&mut treasury.stakes, staker, new_stake);
        }
        treasury.total_staked = treasury.total_staked + amount;
        event::emit_event(
            StakeEvent { staker, amount, new_total: get_stake_amount(treasury, staker), timestamp: current_time },
            ctx
        );
    }

    /// Claim staking rewards.
    ///
    /// This computes the rewards based on the elapsed time since the last claim,
    /// mints the corresponding SUISOUND tokens from the treasury, and transfers them.
    public entry fun claim_rewards(
        treasury: &mut Treasury,
        ctx: &mut TxContext
    ) {
        let staker = tx_context::sender(ctx);
        assert!(table::contains(&treasury.stakes, staker), EStakeNotFound);
        let stake_ref = table::borrow_mut(&mut treasury.stakes, staker);
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        let reward_amount = calculate_rewards(stake_ref, current_time);
        assert!(reward_amount > 0, EInsufficientRewards);

        let treasury_token_value = balance::value(&treasury.suisound_balance);
        assert!(treasury_token_value >= reward_amount, ETreasuryInsufficient);

        let reward_coin = coin::from_balance(
            balance::split(&mut treasury.suisound_balance, reward_amount),
            ctx
        );
        transfer::public_transfer(reward_coin, staker);
        treasury.total_rewards_distributed = treasury.total_rewards_distributed + reward_amount;
        stake_ref.last_claim_time = current_time;
        event::emit_event(
            ClaimRewardsEvent { staker, reward: reward_amount, timestamp: current_time },
            ctx
        );
    }

    /// Unstake SUI tokens.
    ///
    /// Before returning the SUI deposit, any pending rewards are auto‑claimed.
    public entry fun unstake(
        treasury: &mut Treasury,
        ctx: &mut TxContext
    ) {
        let staker = tx_context::sender(ctx);
        assert!(table::contains(&treasury.stakes, staker), EStakeNotFound);
        let stake_data = table::remove(&mut treasury.stakes, staker);
        let current_time = tx_context::epoch_timestamp_ms(ctx);

        // Auto-claim any pending rewards.
        let pending_rewards = calculate_rewards(&stake_data, current_time);
        if (pending_rewards > 0) {
            let treasury_token_value = balance::value(&treasury.suisound_balance);
            assert!(treasury_token_value >= pending_rewards, ETreasuryInsufficient);
            let reward_coin = coin::from_balance(
                balance::split(&mut treasury.suisound_balance, pending_rewards),
                ctx
            );
            transfer::public_transfer(reward_coin, staker);
            treasury.total_rewards_distributed = treasury.total_rewards_distributed + pending_rewards;
            event::emit_event(
                ClaimRewardsEvent { staker, reward: pending_rewards, timestamp: current_time },
                ctx
            );
        }

        // Return the staked SUI.
        let sui_coin = coin::from_balance(
            balance::split(&mut treasury.sui_balance, stake_data.amount),
            ctx
        );
        transfer::public_transfer(sui_coin, staker);
        treasury.total_staked = treasury.total_staked - stake_data.amount;
        event::emit_event(
            UnstakeEvent { staker, amount: stake_data.amount, timestamp: current_time },
            ctx
        );
    }

    // ======== View Functions ========
    /// Get the current staked amount for a given address.
    public fun get_stake_amount(treasury: &Treasury, staker: address): u64 {
        if (table::contains(&treasury.stakes, staker)) {
            table::borrow(&treasury.stakes, staker).amount
        } else {
            0
        }
    }

    /// Get the total amount staked.
    public fun get_total_staked(treasury: &Treasury): u64 {
        treasury.total_staked
    }

    /// Get the total rewards that have been distributed.
    public fun get_total_rewards_distributed(treasury: &Treasury): u64 {
        treasury.total_rewards_distributed
    }
}
