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

This formula is a draft and can be adjusted if the final map origin differs.

### 3.2 Cell Generation

When a cell is generated for the first time:

- It is empty with probability `75%`.
- It contains asteroids with probability `25%`.

If the cell contains asteroids:

- Spawn `3` large asteroids.

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

The exact multipliers are still open to tuning.

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

The source text leaves open whether scaling should be linear or exponential.

This document records the requirement but does **not** lock the final formula yet:

- `attack` increases with cell level.
- Asteroid HP increases with cell level.

Open balancing choice:

- Linear growth: safer, easier to tune, longer progression runway.
- Exponential growth: sharper difficulty spikes, higher risk of invalidating player growth.

Current recommendation:

- Start with linear or gently super-linear scaling.
- Avoid doubling per level unless the entire progression curve is built around short runs and aggressive failure.

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

The exact XP values per asteroid size are not defined in the source text and remain a balancing task.

### 6.2 Leveling

On level up:

- Player level increases.
- Maximum HP increases.
- Player damage increases.

### 6.3 Damage

- Player damage is proportional to player level.
- Each projectile hit removes HP from the asteroid.

The exact formula for damage growth remains open.

## 7. Damage Feedback

After the first successful hit on an asteroid, the game should show its remaining HP.

Two candidate approaches were identified:

- Progress bar
- Visual cracks on the asteroid sprite

Recommendation:

- Implement an HP bar first as the simplest readable solution.
- Consider replacing or supplementing it later with visible cracks tied to HP thresholds.

Possible crack thresholds:

- Light damage
- Medium damage
- Heavy damage

Exact thresholds are not yet fixed.

## 8. Cell Persistence

### 8.1 Cleared Cells

When a cell is fully cleared:

- The cell is marked as cleared in persistent state.

### 8.2 Partially Cleared Cells

The source text explicitly raises an open question:

- If the player leaves a cell before destroying all asteroids, should the game remember how many asteroids remain?

This is not resolved yet.

Possible persistence models:

1. Full persistence
   - Save every remaining asteroid with position, velocity, size, and HP.
2. Partial persistence
   - Save only remaining asteroid counts by size and regenerate positions on re-entry.
3. No partial persistence
   - Reset uncleared cells when re-entered.

Current recommendation:

- Use partial persistence.

Reason:

- It preserves player progress without requiring full simulation snapshots.

## 9. Rewards and Recovery

The source text leaves two systems open:

- What the player receives for clearing a cell.
- How HP restoration works.

### 9.1 Clear Rewards

Candidate reward types:

- XP bonus
- HP restoration
- Other progression reward

No final reward model is defined yet.

### 9.2 HP Recovery

Open options from the concept:

- Slow passive regeneration over time
- Recovery on cell clear
- A combination of both

Current recommendation:

- Use slow background regeneration plus a small reward heal for clearing a cell.

Reason:

- Passive regen reduces dead-end runs.
- Clear rewards create a meaningful payoff for finishing a fight.

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

These items are explicitly unresolved in the source text and should be answered before implementation is finalized.

1. How exactly should asteroid `attack` scale with cell level?
   - Linear, exponential, or hybrid.
2. How exactly should asteroid `HP` scale with cell level?
3. Are the collision damage multipliers `1x / 2x / 3x` correct, or should they be tuned?
4. How much XP does each asteroid size grant?
5. What is the exact XP curve for player leveling?
6. What is the exact player damage growth formula by level?
7. How should partially cleared cells be persisted?
8. What is the reward for clearing a cell?
9. How does HP regeneration work exactly?
10. Should asteroid HP be shown as a progress bar, cracks, or both?
11. Is the world infinite upward, or should there be bounds?
12. How should seed selection affect generation?
   - Map layout, asteroid behavior, spawn patterns, or all of these?

## 15. Recommended Next Decisions

To move from concept to implementation, the next useful product decisions are:

1. Lock the progression formulas:
   - Cell attack scaling
   - Cell HP scaling
   - Player XP curve
   - Player damage curve
2. Lock persistence behavior for partially cleared cells.
3. Lock the clear reward and HP recovery model.
4. Lock the map generation rules tied to the seed.
5. Lock the HP feedback style for damaged asteroids.
