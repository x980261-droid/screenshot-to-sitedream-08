<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render crack paths and clips in the configured reveal order with instance-unique SVG IDs, so overlays cannot bind to another animation's clipping definitions.
- Drive the apartment date/value overlay from the crack animation clock, with pure UTC date and price calculations in building-value.ts to keep resets synchronized and rules testable.

- Keep the original facade asset unchanged with stationary lower floors and signs; render upper-floor image slices and cracks in a synchronized SVG overlay so separation never moves floors 1-2. Geometry uses component pixels mapped from the source by 760/1536 (x) and 623/1264 (y); timing, crack geometry and floor displacement live in building-cracks.ts for direct rule tests.
- Inspection requests insert straight from the browser (anonymous insert-only access); visitors see taken slots only through the get_booked_slots database function, so personal data stays unreadable. A unique (date, time) pair prevents double booking.
