# UX Directions

- Mobile-first controls.
- Use simple line-based visuals with a consistent stroke thickness across the ship, asteroids, joystick, fire button, HUD, overlays, and labels.
- Avoid semi-transparency and opacity effects anywhere in the UI.
- Avoid fully transparent placeholders too; if something is hidden, prefer `display: none` or match the background color.
- Avoid gradients, blur, backdrop filters, glow, or other soft translucent treatments.
- Prefer solid dark backgrounds with light linework and a small, disciplined color palette.
- Keep text in a thin monospaced style that matches the line weight of the game art as closely as possible.
- The virtual joystick should appear only while the user is actively pressing or dragging on the play area.
- The fire control should be icon-only and visually consistent with the rest of the line-art UI.
- Keep any helper text to a minimum; remove instructional clutter when it competes with gameplay.
- Every code change must be covered by unit tests, either by adding new tests or updating existing ones to match the changed behavior.

# Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
