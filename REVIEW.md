# Code review: Farkash application

## Summary

Reviewed the application shell, shared UI, six games, settings, reporting, persistence, speech/audio, PWA configuration, dependency tree, and database migration. Implemented the branding refresh and corrected the issues below. The initial checkout had no Git metadata, so review was performed directly against source; the OCR CLI could not run its Git-diff review at that stage.

## Critical findings

- **Results were saved during render in all six games.** This could repeatedly append sessions and update the provider while rendering. Replaced render-time writes with a shared effect that records each completed run once. Covered by a Strict Mode regression test, including rerenders and replay.
- **The legacy database allowed public CRUD across all sessions.** The app had no ownership key or authentication. Removed its unused cloud mirror and Supabase dependency. Added a migration that drops those policies and revokes table access. **If the original public policies were deployed, that remote table remains accessible until the hardening migration is applied.** No remote migration was executed.

## Important findings

- **Breathing rounds captured stale state.** A ref now tracks completed rounds inside timer callbacks. A regression test completes all four rounds and verifies one persisted result.
- **Answer buttons allowed repeated scoring during feedback.** Reverse Logic and Shubra Lights now lock their controls until the next prompt. A regression test checks the answer lock.
- **Movement-game reaction times measured timer drift.** Musical Chairs now measures the user's seated confirmation; Freeze Poses measures freeze confirmation before starting its hold timer. These are manual confirmation times, not sensor measurements.
- **Chair count could disagree with player count.** It is now derived from the current number of players.
- **Sound settings did not mute synthesized audio.** The master audio gain now follows the saved sound setting; uploaded music respects it too. Shared game navigation stops music and speech.
- **Asynchronous speech could outlive a game or overlap newer commands.** Speech requests now use a cancellation version. English browser speech selects English voices. Cached voice URLs are released when clearing the key.
- **Restored language did not restore document direction.** Language and RTL/LTR direction are synchronized on mount and changes. Saved state is validated without discarding valid sessions when individual entries are malformed.
- **Report averages included untimed breathing sessions and misleading empty-day bars.** Untimed sessions are excluded from reaction averages. The report uses seven local calendar days, excludes future sessions, labels sample history, and avoids reporting full control for empty history. Boundary cases are tested.
- **The UI was restricted to a phone-width column.** Replaced it with an adaptive library, filtered game cards, shared navigation, consistent spacing, full images with preserved proportions, accessible controls, visible focus, zoom support, and reduced-motion support.
- **All screens loaded in the entry bundle.** Games, settings, and report now load on demand. The original entry bundle was about 503 KB; the updated bundle is about 324 KB before gzip, as measured by Vite builds.
- **Outdated dependencies had published advisories.** Updated Vite, React tooling, ESLint, Vitest, and Tailwind; removed unused Supabase code. The final npm audit reports zero vulnerabilities.

## Nits

Removed obsolete game-icon SVGs and metadata, unused imports, the generic social preview, and unnecessary portrait-only/zoom restrictions. Added a star-motif favicon, field labels, switch states, and reset confirmation.

## What's good

- Game metadata already separates Arabic and English content.
- Each game has its own component and a shared game/result shell.
- Audio and speech already had useful browser fallbacks; the changes preserve that approach.

## Validation

- Six regression tests pass across two test files. Tests retain real app state and browser storage; Web Audio is stubbed at its browser boundary.
- TypeScript checking, ESLint, and the production build pass.
- Both main images and all six portraits were inspected. Responsive browser checks covered 375, 768, 1024, and 1440 pixel widths, plus 812 × 375 landscape. Arabic/English direction, reload persistence, game filtering, report, settings, and Reverse Logic were checked in the browser.
- The full original JPGs are preserved. They are sizeable; game portraits load lazily and use an on-demand PWA image cache.
- Real ElevenLabs requests, native-device audio quality, installation on physical phones, and a live Supabase migration were not exercised.

## Self-check coverage

- [x] Walked Section A (naming & functions)
- [x] Walked Section B (comments & formatting)
- [x] Walked Section C (SOLID)
- [x] Walked Section D (DRY/KISS/YAGNI)
- [x] Walked Section E (AI failure modes)
