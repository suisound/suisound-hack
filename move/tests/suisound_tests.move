#[test_only]
module suisound::suisound_tests {
    use sui::test_scenario::{Self as test};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock;
    use suisound::suisound::{Self, Treasury, SUISOUND};
    use sui::package;
    use sui::tx_context;

    const ALICE: address = @0xA11CE;
    const BOB: address = @0xB0B;

    fun init_module(scenario: &mut test::Scenario) {
        test::next_tx(scenario, ALICE);
        {
            package::claim_and_keep<SUISOUND>(test::ctx(scenario), SUISOUND {});
        };
        test::next_tx(scenario, ALICE);
    }

    #[test]
    fun test_stake_and_rewards() {
        let scenario = test::begin(ALICE);
        
        // Setup: Create test SUI coins
        let test_sui = coin::mint_for_testing<SUI>(200_000_000_000, test::ctx(&mut scenario));
        
        // Initialize module
        init_module(&mut scenario);

        // Get Treasury after initialization
        {
            let treasury = test::take_shared<Treasury>(&scenario);
            
            // Stake 100 SUI (Pro tier)
            suisound::stake(
                &mut treasury,
                test_sui,
                test::ctx(&mut scenario)
            );

            // Verify stake amount
            assert!(suisound::get_stake_amount(&treasury, ALICE) == 200_000_000_000, 0);
            assert!(suisound::is_pro_staker(&treasury, ALICE), 1);

            test::return_shared(treasury);
        };

        // Advance time by 24 hours (1 day)
        test::next_tx(&mut scenario, ALICE);
        {
            let clock = clock::create_for_testing(test::ctx(&mut scenario));
            clock::increment_for_testing(&mut clock, 86400_000);
            clock::share_for_testing(clock);
        };

        // Claim rewards
        test::next_tx(&mut scenario, ALICE);
        {
            let treasury = test::take_shared<Treasury>(&scenario);
            
            // Claim rewards
            suisound::claim_rewards(&mut treasury, test::ctx(&mut scenario));

            test::return_shared(treasury);
        };

        // Unstake
        test::next_tx(&mut scenario, ALICE);
        {
            let treasury = test::take_shared<Treasury>(&scenario);
            
            // Unstake
            suisound::unstake(&mut treasury, test::ctx(&mut scenario));

            // Verify stake is removed
            assert!(suisound::get_stake_amount(&treasury, ALICE) == 0, 2);
            assert!(!suisound::is_pro_staker(&treasury, ALICE), 3);

            test::return_shared(treasury);
        };

        test::end(scenario);
    }

    #[test]
    fun test_multiple_stakers() {
        let scenario = test::begin(ALICE);
        
        // Setup: Create test SUI coins
        let alice_sui = coin::mint_for_testing<SUI>(100_000_000_000, test::ctx(&mut scenario));
        
        // Initialize module
        init_module(&mut scenario);

        // Alice stakes
        {
            let treasury = test::take_shared<Treasury>(&scenario);
            
            suisound::stake(
                &mut treasury,
                alice_sui,
                test::ctx(&mut scenario)
            );

            test::return_shared(treasury);
        };

        // Bob stakes
        test::next_tx(&mut scenario, BOB);
        {
            let treasury = test::take_shared<Treasury>(&scenario);
            let bob_sui = coin::mint_for_testing<SUI>(2_000_000_000, test::ctx(&mut scenario));
            
            suisound::stake(
                &mut treasury,
                bob_sui,
                test::ctx(&mut scenario)
            );

            // Verify total staked
            assert!(suisound::get_total_staked(&treasury) == 102_000_000_000, 4);

            test::return_shared(treasury);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = suisound::suisound::EInsufficientStake)]
    fun test_stake_below_minimum() {
        let scenario = test::begin(ALICE);
        
        // Setup: Create test SUI coins (below minimum)
        let test_sui = coin::mint_for_testing<SUI>(500_000, test::ctx(&mut scenario));
        
        // Initialize module
        init_module(&mut scenario);

        // Try to stake below minimum
        {
            let treasury = test::take_shared<Treasury>(&scenario);
            
            // This should fail
            suisound::stake(
                &mut treasury,
                test_sui,
                test::ctx(&mut scenario)
            );

            test::return_shared(treasury);
        };

        test::end(scenario);
    }
} 