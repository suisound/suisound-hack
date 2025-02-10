# SuiSound Tier System

## Overview
SuiSound uses a simple two-tier system to provide content generation capabilities while maintaining platform quality and preventing abuse. Each tier requires staking SUI tokens, which can be unstaked after a 24-hour cooldown period.

## Basic Tier (1 SUI Stake)
- **Access Level**: Manual content generation
- **Generation Limits**: 15 generations per day (enforced by backend)
- **Features**:
  - Basic audio generation
  - Simple video visualization
  - Standard quality outputs
  - Manual posting only
- **Commands**:
  - `/generate <prompt>` - Generate audio content with visualization
  - `/post <content_id>` - Post generated content
  - `/stake` - Stake SUI tokens
  - `/unstake` - Request to unstake (24-hour cooldown)

## Pro Tier (100 SUI Stake)
- **Access Level**: Manual + Autonomous generation
- **Generation Limits**: Unlimited
- **Features**:
  - High-quality audio generation
  - Enhanced video visualization
  - Autonomous posting (1 post every 2-4 hours)
  - Priority processing
- **Additional Commands**:
  - `/auto_post <on/off>` - Enable/disable autonomous posting
  - `/schedule <prompt> <time>` - Schedule content generation
  - `/customize_style` - Set preferred generation style

## Autonomous Mode (Pro Tier Only)
When enabled, the autonomous mode will:
1. Generate content every 2-4 hours
2. Post to connected platforms automatically
3. Engage with user comments and reactions
4. Maintain consistent branding and style

## Best Practices
1. **Content Quality**
   - Use clear, descriptive prompts
   - Test different styles to find what works best
   - Monitor engagement metrics

2. **Posting Strategy**
   - Basic Tier: Spread out your 15 daily generations
   - Pro Tier: Balance automated and manual posts
   - Maintain consistent posting schedule

3. **Platform Growth**
   - Engage with community feedback
   - Build a recognizable style
   - Use analytics to optimize content

## Technical Implementation
- Generation limits are enforced by the backend service
- Tier status is checked on-chain via stake amount
- Autonomous posting uses a randomized schedule
- Quality settings are tied to stake amount
- Unstaking has a 24-hour cooldown period

Remember: The tier system is designed to be simple while providing clear value progression. Pro tier users get more capabilities and automation, while Basic tier users can still create quality content manually with a reasonable daily limit. 