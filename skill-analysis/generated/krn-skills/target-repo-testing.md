# target-repo-testing

- Source: KRN
- Path: `.agents/skills/target-repo-testing/SKILL.md`
- Role: checker
- Invocation: model-invoked
- Lines: 203
- Stop condition: yes
- Output: yes
- Verification: yes

## Description

Use when Codex is asked to inspect, test, initialize, plan, verify, or repair a target repository through KRN with explicit mode, dirty-state, write-authority, proof/non-proof, and handoff boundaries, especially when the target repo may be dirty, active, external, headless, writable, or used as evidence for second-operator/internal-alpha readiness.

## Sections

- Trigger
- Core Rule
- Steps
- Step 1: Classify The Mode
- Step 2: Record Dirty State
- Step 3: Run Only Mode-Compatible Commands
- Step 4: Capture Evidence Honestly
- Owner-File Read-Model Contract
- Stop Condition
- Verification
- Output
- Forbidden

## Reference Files

- agents/openai.yaml

