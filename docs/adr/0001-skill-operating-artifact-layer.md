# Skill operating artifacts are separate from the product roadmap

KRN skills need stable operating language, templates, references, and rare
decision records that should not depend on the current shape of
`KRN_ROADMAP.md`. We will keep product direction in `KRN_ROADMAP.md`, but move
skill and artifact conventions into `CONVENTIONS.md`, shared vocabulary into
`CONTEXT.md`, and hard-to-reverse operating decisions into small ADRs under
`docs/adr/`.

This keeps Matt Pocock-style skills composable and normalized without turning
markdown into runtime memory or a parallel task tracker.
