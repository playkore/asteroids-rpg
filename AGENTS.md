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
