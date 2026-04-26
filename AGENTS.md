<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design System Guardrails (Trip Worth-It)

Use these rules for any UI changes in this repo:

1. Product feel
- Aim for a polished, trustworthy, mobile-first SaaS calculator.
- Prefer strong hierarchy, large readable typography, and clear visual blocks.
- Keep the neutral/slate base and use selective accents (cyan for focus, verdict colors for state).

2. Layout
- Keep a clear split between input workflow and results panel on desktop.
- On mobile, keep cards vertically stacked with generous spacing and no cramped controls.
- Preserve the current card rhythm: rounded `2rem` surfaces, clear borders, and soft elevation.

3. Forms and validation UX
- Inputs must stay easy to scan, with clear labels and visible focus states.
- Validation copy should be user-friendly and action-oriented (tell user what to do next).
- When submit is blocked, show a top-level hint near the CTA plus field-level errors.

4. Results UX
- Results should be the visual centerpiece and include:
  - verdict
  - net summary
  - net/hour signal
  - concise recommendation
- Empty state should explain what users get after calculation (not just “enter details”).
- Never expose raw internal reason codes directly in UI copy.

5. Motion and interaction polish
- Keep subtle micro-animations only: card entrance, small hover lift, button press feedback.
- Respect reduced-motion preferences.
- Avoid flashy transitions or animation-heavy UI.

6. Implementation constraints
- Keep existing calculator/business logic intact unless explicitly asked.
- Prefer refactoring existing components over adding dependencies.
- Maintain TypeScript safety and run lint/build after UI changes.
