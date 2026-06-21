# Git Commit Standard

Use Semantic/Conventional Commits only.

## Format

```text
type(optional-scope): concise imperative summary
```

Use lowercase `type`. Keep the summary concrete and under 72 characters when
reasonable.

## Allowed Types

- `feat`: user-visible capability.
- `fix`: bug fix.
- `docs`: documentation or repo guidance.
- `build`: package, dependency, workspace, compiler, or build system change.
- `test`: tests or test fixtures.
- `ci`: CI configuration.
- `chore`: repo maintenance without behavior change.
- `refactor`: behavior-preserving code restructure.

## Rules

- Do not use vague messages like `update`, `changes`, or `wip`.
- Do not mix unrelated scopes in one commit.
- Use `!` only for intentional breaking changes.
- Rewrite public history only while the repo is explicitly in early bootstrap or
  when the user explicitly asks for it.
- Use `--force-with-lease`, not plain `--force`, when rewriting a remote branch.

## Current Bootstrap Examples

```text
docs: bootstrap KRN kernel contract
chore: add Codex-native kernel surfaces
build: add strict TypeScript workspace spine
docs: require semantic commits
```
