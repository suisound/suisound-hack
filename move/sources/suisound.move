/// @title SuiSound Staking Platform
/// @notice A staking platform for music producers on Sui
/// @dev Implements staking, rewards, and tier-based multipliers
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
    use std::option;

    // ======== Errors ========
    /// Invalid one-time witness
    const EInvalidWitness: u64 = 0;
    /// Insufficient stake amount
    const EInsufficientStake: u64 = 1;
    /// Stake not found
    const EStakeNotFound: u64 = 2;
    /// Insufficient rewards
    const EInsufficientRewards: u64 = 4;

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

    // ======== Structs ========
    /// The SUISOUND token type with required abilities for a coin
    /// This is also the one-time witness for the module
    struct SUISOUND has drop {}

    /// Stake information with store ability for table storage
    struct Stake has store {
        amount: u64,
        start_time: u64,
        last_claim_time: u64,
        is_pro: bool
    }

    /// Treasury to hold SUISOUND tokens and track stakes
    struct Treasury has key {
        id: UID,
        suisound_balance: Balance<SUISOUND>,
        sui_balance: Balance<SUI>,
        stakes: Table<address, Stake>,
        total_staked: u64,
        total_rewards_distributed: u64
    }

    // ======== Initialization ========
    /// Module initializer - creates the SUISOUND currency and treasury
    fun init(otw: SUISOUND, ctx: &mut TxContext) {
        // Verify one-time witness
        assert!(types::is_one_time_witness(&otw), EInvalidWitness);

        // Create the SUISOUND currency
        let (treasury_cap, metadata) = coin::create_currency(
            otw,
            9,                          // decimals
            b"SUISOUND",               // symbol
            b"SUISOUND",               // name
            b"SuiSound Platform Token", // description
            option::none(),            // no icon url
            ctx
        );

        // Create treasury with initial supply
        let treasury_balance = coin::mint_balance(&mut treasury_cap, INITIAL_SUPPLY);
        
        // Initialize treasury object
        let treasury = Treasury {
            id: object::new(ctx),
            suisound_balance: treasury_balance,
            sui_balance: balance::zero(),
            stakes: table::new(ctx),
            total_staked: 0,
            total_rewards_distributed: 0
        };

        // Share objects with proper visibility
        transfer::share_object(treasury);
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);
    }

    // ======== View Functions ========
    /// Get the reward multiplier based on stake amount
    public fun get_reward_multiplier(stake_amount: u64): u64 {
        if (stake_amount >= PRO_TIER_THRESHOLD) {
            5 // 5x multiplier for Pro tier
        } else {
            1 // 1x multiplier for Basic tier
        }
    }

    /// Calculate rewards for a stake
    public fun calculate_rewards(stake: &Stake, current_time: u64): u64 {
        let time_staked = current_time - stake.last_claim_time;
        let days_staked = time_staked / COOLDOWN_PERIOD;
        let multiplier = if (stake.is_pro) { 5 } else { 1 };
        (stake.amount * REWARD_RATE * days_staked * multiplier) / 1_000_000_000
    }

    // ======== Entry Functions ========
    /// Stake SUI tokens
    /// @param treasury - The treasury object
    /// @param payment - SUI coin to stake
    /// @param amount - Amount to stake in MIST
    public entry fun stake(
        treasury: &mut Treasury,
        payment: Coin<SUI>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // Verify stake amount meets minimum
        assert!(amount >= MIN_STAKE_AMOUNT, EInsufficientStake);
        
        // Verify payment has enough for stake
        let coin_value = coin::value(&payment);
        assert!(coin_value >= amount, EInsufficientStake);

        // Add stake to treasury balance
        let sui_balance = coin::into_balance(payment);
        balance::join(&mut treasury.sui_balance, sui_balance);

        let current_time = tx_context::epoch_timestamp_ms(ctx);
        let is_pro = amount >= PRO_TIER_THRESHOLD;

        let stake = Stake {
            amount,
            start_time: current_time,
            last_claim_time: current_time,
            is_pro
        };

        let staker = tx_context::sender(ctx);
        
        // Update or create stake
        if (table::contains(&treasury.stakes, staker)) {
            let existing_stake = table::remove(&mut treasury.stakes, staker);
            let Stake { amount: old_amount, start_time: _, last_claim_time: _, is_pro: _ } = existing_stake;
            stake.amount = stake.amount + old_amount;
        };
        
        table::add(&mut treasury.stakes, staker, stake);
        treasury.total_staked = treasury.total_staked + amount;
    }

    /// Claim staking rewards
    public entry fun claim_rewards(
        treasury: &mut Treasury,
        ctx: &mut TxContext
    ) {
        let staker = tx_context::sender(ctx);
        assert!(table::contains(&treasury.stakes, staker), EStakeNotFound);

        let stake = table::borrow_mut(&mut treasury.stakes, staker);
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        
        // Calculate and mint rewards
        let reward_amount = calculate_rewards(stake, current_time);
        assert!(reward_amount > 0, EInsufficientRewards);

        // Update last claim time
        stake.last_claim_time = current_time;
        
        // Mint and transfer rewards
        let reward_coin = coin::from_balance(
            balance::split(&mut treasury.suisound_balance, reward_amount),
            ctx
        );
        transfer::public_transfer(reward_coin, staker);
        treasury.total_rewards_distributed = treasury.total_rewards_distributed + reward_amount;
    }

    /// Unstake SUI tokens
    public entry fun unstake(
        treasury: &mut Treasury,
        ctx: &mut TxContext
    ) {
        let staker = tx_context::sender(ctx);
        assert!(table::contains(&treasury.stakes, staker), EStakeNotFound);

        let Stake { amount, start_time: _, last_claim_time: _, is_pro: _ } = table::remove(&mut treasury.stakes, staker);
        
        // Return staked SUI
        let sui_coin = coin::from_balance(balance::split(&mut treasury.sui_balance, amount), ctx);
        transfer::public_transfer(sui_coin, staker);

        treasury.total_staked = treasury.total_staked - amount;
    }

    /// Get stake amount for an address
    public fun get_stake_amount(treasury: &Treasury, staker: address): u64 {
        if (table::contains(&treasury.stakes, staker)) {
            let stake = table::borrow(&treasury.stakes, staker);
            stake.amount
        } else {
            0
        }
    }

    /// Check if address is a pro staker
    public fun is_pro_staker(treasury: &Treasury, staker: address): bool {
        if (table::contains(&treasury.stakes, staker)) {
            let stake = table::borrow(&treasury.stakes, staker);
            stake.is_pro
        } else {
            false
        }
    }

    /// Get total staked amount
    public fun get_total_staked(treasury: &Treasury): u64 {
        treasury.total_staked
    }

    /// Get total rewards distributed
    public fun get_total_rewards_distributed(treasury: &Treasury): u64 {
        treasury.total_rewards_distributed
    }
} 