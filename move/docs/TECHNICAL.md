# SuiSound Technical Documentation

## Contract Overview
SuiSound is a decentralized platform for AI-powered content generation, built on the Sui blockchain. The platform implements a stake-to-earn model where users stake SUI tokens to become content producers and earn SUISOUND rewards.

## Key Parameters

### Staking Tiers
- **Basic Tier** (1 SUI minimum)
  - Base reward rate (1x multiplier)
  - Basic platform access
  - Stake requirement: 1,000,000,000 MIST (1 SUI)

- **Pro Tier** (100 SUI minimum)
  - 5x reward multiplier
  - Advanced features and unlimited access
  - Stake requirement: 100,000,000,000 MIST (100 SUI)

### Time Parameters
- **Unstaking Cooldown**: 24 hours (86,400,000 milliseconds)
  - Required waiting period between requesting and completing unstake
  - Prevents rapid stake cycling and market manipulation

### Generation Limits
- Generation limits are enforced by the backend service
- Basic Tier: 15 generations per day
- Pro Tier: Unlimited generations
- Tier status is checked on-chain via stake amount

### Reward Parameters
- **Base Reward Rate**: 100 SUISOUND per day per 1 SUI staked
- **Reward Multipliers**:
  - Basic Tier: 1x (100 SUISOUND per SUI per day)
  - Pro Tier: 5x (500 SUISOUND per SUI per day)

## Core Functions

### Producer Management
```move
public entry fun join_as_producer(treasury: &mut Treasury, payment: Coin<SUI>, amount: u64, clock: &Clock, ctx: &mut TxContext)
```
- **Purpose**: Stake SUI and become a content producer
- **Requirements**:
  - Amount must be ≥ 1 SUI (1,000,000,000 MIST)
  - Valid SUI payment
- **Result**: Creates ProducerAccess object for the caller
- **Events**: Emits `StakeEvent`

### Reward System
```move
public entry fun claim_rewards(treasury: &mut Treasury, producer: &mut ProducerAccess, clock: &Clock, ctx: &mut TxContext)
```
- **Purpose**: Claim accumulated SUISOUND rewards
- **Requirements**:
  - Must be producer owner
- **Calculation**: `reward = (time_staked * stake_amount * REWARD_RATE * tier_multiplier) / (86400_000 * 1_000_000_000 * 100)`
- **Events**: Emits `RewardClaimEvent`

### Unstaking Process
```move
public entry fun request_unstake(producer: &mut ProducerAccess, clock: &Clock, ctx: &mut TxContext)
```
- **Purpose**: Initiate unstaking process
- **Requirements**:
  - Must be producer owner
  - Not already unstaking
- **Result**: Sets unstaking timestamp

```move
public entry fun complete_unstake(treasury: &mut Treasury, producer: &mut ProducerAccess, clock: &Clock, ctx: &mut TxContext)
```
- **Purpose**: Complete unstaking after cooldown
- **Requirements**:
  - Must be producer owner
  - 24 hours passed since request
- **Result**: Returns staked SUI to owner
- **Events**: Emits `UnstakeEvent`

### NFT Minting
```move
public entry fun mint_content_nft(
    producer: &mut ProducerAccess,
    name: vector<u8>,
    description: vector<u8>,
    url_string: vector<u8>,
    content_type: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
)
```
- **Purpose**: Create NFT for generated content
- **Requirements**:
  - Must be producer owner
  - Valid metadata (name, description, URL)
- **Result**: Mints NFT with tier information
- **Events**: Emits `NFTMintEvent`

## Error Codes
- `EInsufficientStake`: Stake amount below minimum (0)
- `EInvalidProducer`: Unauthorized access attempt (1)
- `EInsufficientCooldown`: Cooldown period not met (2)
- `EInvalidUnstakeAmount`: Invalid unstaking request (3)
- `EInvalidRewardClaim`: Invalid reward claim attempt (4)

## Events
- `StakeEvent`: Emitted when a producer stakes SUI
- `UnstakeEvent`: Emitted when a producer completes unstaking
- `RewardClaimEvent`: Emitted when rewards are claimed
- `NFTMintEvent`: Emitted when an NFT is minted

## Security Considerations
1. 24-hour unstaking cooldown prevents market manipulation
2. Tier-based access controls prevent abuse
3. All critical functions verify caller ownership
4. Events provide full transparency of platform activity 