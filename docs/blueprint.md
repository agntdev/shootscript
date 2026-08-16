# PhotoStyler Bot — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot for photographers that analyzes a submitted model or location photo and returns a detailed, no-nonsense styling and shoot scenario tailored to current trends. The bot provides text-only outputs and is free to use.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- professional photographers
- photography enthusiasts

## Success criteria

- User receives a detailed styling plan with actionable steps for a full shoot within 30 seconds of photo submission

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu with instructions and examples
- **/help** (command, actor: user, command: /help) — Show help documentation and usage examples
- **/examples** (command, actor: user, command: /examples) — Show example photos and expected outputs
- **/reset** (command, actor: user, command: /reset) — Clear current session and start fresh
- **Submit photo** (button, actor: user) — Send a model or location photo for analysis

## Flows

### Photo submission and analysis
_Trigger:_ photo

1. User sends photo
2. Bot analyzes photo
3. Bot requests optional context tag
4. User provides optional context tag
5. Bot generates styling plan
6. Bot sends detailed text plan

_Data touched:_ Submitted image, Styling plan

### Help and examples
_Trigger:_ /help or /examples

1. User requests help/examples
2. Bot sends instructions and examples
3. User receives guidance

### Session reset
_Trigger:_ /reset

1. User sends /reset
2. Bot clears session data
3. User receives confirmation

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Submitted image** _(retention: session)_ — User-submitted model or location photo for analysis
  - fields: image_data, context_tag, timestamp
- **Styling plan** _(retention: none)_ — Generated detailed shoot scenario based on analysis
  - fields: concept_summary, mood_keywords, color_palette, wardrobe_props, hair_makeup, poses, lighting_setup, camera_angles, shot_list, timeline_checklist, social_caption_hooks

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Permissions & privacy

- Images are processed transiently and discarded after analysis
- Minimal usage records stored for rate-limiting and analytics

## Edge cases

- Low-quality image submission
- Multiple image submissions
- Failed image analysis

## Required tests

- End-to-end test of photo submission to styling plan generation
- Rate-limiting test with 10 requests/day
- Multilingual response test with Russian input

## Assumptions

- Trend awareness is implemented via internal rules without external APIs
- Users will provide clear, single photos for analysis
- Text outputs will be concise but sufficiently detailed for a full shoot
