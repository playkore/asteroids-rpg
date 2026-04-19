# Asteroids Grid RPG

## 1. Overview

`Asteroids Grid RPG` is a mobile-first arcade game inspired by the classic `Asteroids`, extended with map traversal, persistent progression, and save slots.

The game world is a grid of cells. Each cell is a separate combat arena built around the core `Asteroids` loop: the player pilots a ship, shoots asteroids, avoids collisions, and clears the screen. Progression comes from moving upward through the grid, where higher rows contain higher-level cells with stronger enemies.

Primary goal:

- Reach cells with the highest possible level.

Secondary goals:

- Survive combat.
- Gain XP and level up.
- Clear cells and expand explored territory on the map.

## 2. Design Goals

- Preserve the feel of classic `Asteroids` inside each combat screen.
- Add long-term progression through player level, HP growth, and map advancement.
- Keep the rules simple and readable.
- Support short mobile play sessions with autosave and clear state transitions.

## 3. World Structure

### 3.1 Grid

The world is a 2D grid of cells.

- Each cell has coordinates `(x, y)`.
- Each cell is a separate combat field.
- The player starts near the bottom of the world.
- The starting cell has level `1`.
- Cell level increases as the player moves upward.

Base rule:

- The higher the cell on the map, the higher its level.

Working formula:

- `cellLevel = y + 1`, assuming the starting row is `y = 0`.

This formula is fixed for the first version.

### 3.2 Cell Generation

When a cell is generated for the first time:

- It is empty with probability `75%`.
- It contains asteroids with probability `25%`.

If the cell contains asteroids:

- Spawn `3` large asteroids.

Generation is deterministic per save and seed:

- The selected seed initializes world generation.
- A cell's generated content is determined by `(seed, x, y)`.
- The seed affects only world generation in the first version.
- It does not affect player stats, controls, or combat rules.

### 3.3 Movement Between Cells

- The player moves freely inside the current screen.
- There is no camera scrolling.
- When the player reaches the edge of the screen, the player leaves the current cell and enters the adjacent cell in that direction.

### 3.4 Wraparound Rules

- Asteroids use classic `Asteroids` wraparound.
- When an asteroid reaches one edge of the screen, it appears on the opposite edge.
- The combat arena behaves like a torus for asteroids.

Player movement does **not** wrap. Crossing an edge changes the current cell.

## 4. Core Combat Loop

Each cell contains a self-contained battle.

### 4.1 Initial Cell State

At the start of a fresh uncleared combat cell:

- Spawn `3` large asteroids.

### 4.2 Asteroid Splitting

Asteroids exist in three sizes:

- Large
- Medium
- Small

Split rules:

- A large asteroid splits into `3` medium asteroids.
- A medium asteroid splits into `3` small asteroids.
- A small asteroid is destroyed permanently.

### 4.3 Victory Condition

A cell is considered cleared when:

- All asteroids in the cell are destroyed.

## 5. Asteroid Stats

Each asteroid has:

- Size
- HP
- Attack
- Speed

### 5.1 Relative Stats by Size

#### Speed

- Small asteroids move `2x` faster than medium asteroids.
- Medium asteroids move `2x` faster than large asteroids.

Equivalent ratio:

- Large: `1`
- Medium: `2`
- Small: `4`

#### Collision Damage

Let `attack` be the base attack value for the current cell.

- Small asteroid collision damage: `1 * attack`
- Medium asteroid collision damage: `2 * attack`
- Large asteroid collision damage: `3 * attack`

#### HP

Asteroid HP depends on cell level and asteroid size.

Required ratio:

- Large HP = base HP
- Medium HP = large HP / 2
- Small HP = medium HP / 2

Equivalent ratio:

- Large: `1`
- Medium: `1/2`
- Small: `1/4`

### 5.2 Scaling by Cell Level

The first version uses simple linear scaling.

Base asteroid values by cell level:

- `baseAttack = cellLevel`
- `largeAsteroidHP = 12 + 4 * (cellLevel - 1)`
- `mediumAsteroidHP = largeAsteroidHP / 2`
- `smallAsteroidHP = largeAsteroidHP / 4`

Examples:

- Level 1 cell: large `12`, medium `6`, small `3`, base attack `1`
- Level 2 cell: large `16`, medium `8`, small `4`, base attack `2`
- Level 3 cell: large `20`, medium `10`, small `5`, base attack `3`

This keeps early progression readable and avoids sharp balance spikes.

## 6. Player Progression

The player has:

- Player level
- Current HP
- Maximum HP
- Damage
- XP

### 6.1 XP

- Destroying asteroids grants XP.
- When accumulated XP exceeds a threshold, the player levels up.

XP rewards:

- Small asteroid: `1 XP`
- Medium asteroid: `2 XP`
- Large asteroid: `4 XP`

### 6.2 Leveling

On level up:

- Player level increases.
- Maximum HP increases.
- Player damage increases.

Starting player values:

- Player level: `1`
- Max HP: `10`
- Current HP: `10`
- Shot damage: `2`
- Current XP: `0`

Level-up curve:

- `xpToNextLevel = 5 + 3 * (playerLevel - 1)`

Stat growth per level:

- `maxHP += 2`
- `shotDamage += 1`

On level up, current HP is fully restored to max HP.

### 6.3 Damage

- Player damage is proportional to player level.
- Each projectile hit removes HP from the asteroid.

Fixed first-version formula:

- `playerShotDamage = 2 + (playerLevel - 1)`

## 7. Damage Feedback

After the first successful hit on an asteroid, the game should show its remaining HP.

The first version uses a progress bar only.

Rules:

- The HP bar is hidden until the asteroid receives its first hit.
- After the first hit, the HP bar remains visible until the asteroid is destroyed.
- Crack-based visuals are out of scope for the first version.

## 8. Cell Persistence

### 8.1 Cleared Cells

When a cell is fully cleared:

- The cell is marked as cleared in persistent state.

### 8.2 Partially Cleared Cells

If the player leaves a cell before clearing it, the game remembers remaining progress.

Persistence model for the first version:

- Save whether the cell was visited.
- Save whether the cell was initially empty.
- Save whether the cell is fully cleared.
- Save remaining asteroid counts by size:
  - large
  - medium
  - small

The game does not save exact asteroid positions, directions, or current HP.

When the player re-enters a partially cleared cell:

- The remaining asteroids are respawned from the saved counts.
- Their positions and velocities are regenerated.

This keeps persistence simple while preserving player progress.

## 9. Rewards and Recovery

The source text leaves two systems open:

- What the player receives for clearing a cell.
- How HP restoration works.

### 9.1 Clear Rewards

Clearing a cell grants:

- `+3 XP`
- Restore `2 HP`

If the player is already at max HP:

- The HP reward is lost.

No item drops, temporary buffs, or bonus reward systems are included in the first version.

### 9.2 HP Recovery

The first version uses two HP recovery rules:

- Passive regeneration: `1 HP` every `10` seconds while alive and below max HP
- Cell clear bonus: restore `2 HP` immediately on clearing the cell

Passive regeneration stops at max HP.

## 10. Screens and Navigation

### 10.1 Main Menu

The initial screen includes:

- Seed selection
- Continue game
- Start new game
- Load game

### 10.2 New Game

When starting a new game:

- The player chooses one of `3` save slots.
- If the selected slot is not empty, the game warns that existing progress will be lost.

### 10.3 Continue

- `Continue` loads the most recently used save slot.

### 10.4 Load Game

- `Load Game` shows the three save slots.
- The player selects which slot to load.

### 10.5 Combat Screen

Starting or loading a game takes the player into cell combat.

Combat UI includes at minimum:

- Current HP / max HP
- Player level
- Current XP progress to next level
- Button: return to menu
- Button: open map

### 10.6 Pause / Menu Behavior

- When the player exits to the menu from combat, the game is paused.
- The menu acts as the initial screen with added context for resuming the current run.
- From the menu, the player can continue the paused game or start a new game.

## 11. Map Screen

The map shows a grid of cells.

Cells should visually communicate state.

Mini-map states:

- Unvisited cell: black
- Visited cell with remaining asteroids: white cell with a black dot inside
- Visited empty cell: white
- Visited cleared cell: white

This means empty cells and fully cleared cells share the same visual state on the mini-map.

Additional note:

- A cell may be empty from initial generation or become empty after the player destroys all asteroids.
- In both cases, the mini-map should show that cell as white after it has been visited.

The world is procedurally generated and unbounded for the first version.

- The player can keep moving upward indefinitely.
- Difficulty continues to increase through `cellLevel`.

## 12. Save System

The game supports `3` save slots.

Autosave triggers:

- On every transition between cells
- On full clear of the current cell

`Continue` should use:

- The last slot the player used

## 13. Session Flow

Basic flow:

1. Open main menu.
2. Select seed / continue / new game / load game.
3. Enter combat in the current cell.
4. Fight asteroids and gain XP.
5. Move to neighboring cells by crossing screen borders.
6. Clear cells and advance upward to higher-level cells.
7. Autosave on cell transitions and cell clears.

## 14. Open Questions

There are no blocking design questions for the first version.

Future balancing and feature work can revisit:

1. Whether partial persistence should also store asteroid HP.
2. Whether HP bars should later be replaced with asteroid crack visuals.
3. Whether clear rewards should expand beyond XP and HP.
4. Whether the world should later gain special cell types instead of only empty/combat cells.

## 15. Recommended Next Decisions

The design is implementation-ready for a first playable version.

Recommended next production steps:

1. Implement deterministic cell generation from `seed + coordinates`.
2. Implement combat using the fixed asteroid and player formulas in this document.
3. Implement cell persistence using saved remaining asteroid counts.
4. Implement save slots and autosave triggers.
5. Implement the mini-map using the three fixed visual states.
