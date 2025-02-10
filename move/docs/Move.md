# SuiSound Smart Contracts

Core staking contract for the SuiSound platform.

## Overview

The contract manages staking of SUI tokens and rewards in SUISOUND tokens. Pro staker status unlocks AI music production features in the frontend.

## Key Parameters

- Minimum Stake: 1 SUI
- Pro Tier Threshold: 100 SUI
- Base Reward Rate: 1 SUISOUND per day per SUI staked
- Pro Tier Multiplier: 5x rewards
- Reward Claim Cooldown: 24 hours

## Core Functions

### Staking
- `stake(treasury, payment, amount)`: Stake SUI tokens
- `unstake(treasury)`: Withdraw staked SUI tokens
- `claim_rewards(treasury)`: Claim accumulated SUISOUND rewards

### View Functions
- `get_stake_amount(treasury, staker)`: Get staked amount for address
- `is_pro_staker(treasury, staker)`: Check if address is pro staker
- `get_total_staked(treasury)`: Get total SUI staked
- `get_total_rewards_distributed(treasury)`: Get total SUISOUND distributed

## Objects

### Treasury
Shared object that holds:
- SUISOUND token balance
- SUI token balance
- Staking records
- Platform statistics

### Stake
Per-user stake info:
- Staked amount
- Start time
- Last claim time
- Pro status 