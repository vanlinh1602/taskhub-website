# Payroll surface redesign

## Confirmed direction

- Keep the Taskory Hub identity and existing Calm Control Room tokens.
- Open on payroll that is awaiting payment; make the next batch action easy to find.

## Working layout

Lead with the payroll heading and pending/paid switch, then show the pending total with task and member counts. Put the cutoff field and “Chốt đợt lương” action directly above the pending batch queue. Keep the member ledger available below as a secondary reconciliation view. Open a batch into a member selector beside task details on wide screens; stack them on small screens, with task cards that keep price edits and save actions usable without horizontal scrolling. Keep the paid batch history reachable from the same status switch.

## Visual and behavior constraints

Use the existing Taskory Hub lavender, cool canvas, mint and sky tokens, system sans typography, quiet borders, and rounded controls. `../mocks/decision/payroll-ready-first.png` is an assistant-selected critique reference aligned to the user-confirmed pending-first priority; it is not an exact comp the user explicitly approved. Keep all existing payroll API, reward, cutoff, batch, and payment behavior unchanged in the presentation work.

## Review evidence

The authenticated `/payroll` route redirected to `/login`, so no live desktop or mobile page capture was available. The concept board was displayed, but its comps are not captures of the implemented page.
