# SuiSound Smart Contracts

Core staking contract for the SuiSound platform.

## Deployment

Current deployment on Testnet:
- Package ID: `0x1d05c21f6e45dd55a168c4b1ffce534d1584ac557f6188730ec48e332e37f8ab`
- Treasury ID: `0x1b7bbd392fa41d0f035e7f7840896721574e751e31e9930eb81152900e1527b1`

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