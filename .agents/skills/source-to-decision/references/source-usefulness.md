# Source Usefulness

Use this reference after execution when a source materially shaped code, infra,
harness, CI, eval, TypeScript, operator UX, or Codex-surface work.

## Procedure

1. Decide whether the source shaped an implementation or review decision.
2. If it did, close usefulness feedback:

   ```txt
   rtk proxy krn evidence capture --source-usefulness "claim:<source-id>=helped|reason|evidence-ref[,ref]|doesNotProve"
   ```

   Use `decision:<id>` instead of `claim:<id>` when the retained object is a
   SourceDecision.
3. If usefulness is not measured, record one bounded reason:

   ```txt
   no persisted run
   source was rejected
   source was background context only
   no implementation/review decision used it
   legal/content boundary
   ```

## Stop Condition

Stop when a shaped source has measured usefulness feedback, or a bounded reason
explains why usefulness was not measured.
