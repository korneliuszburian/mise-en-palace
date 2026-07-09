# Skill Inventory

This is an inventory, not a verdict. It intentionally avoids text-similarity
scores because the useful question is whether a skill has a clear role in the
engineering loop.

## KRN Skills

| Skill | Role | Invocation | Stop | Output | Verification | Lines |
|---|---|---|---|---|---|---|
| activation-engine | maker | model | yes | yes | yes | 78 |
| beads | router | model | yes | yes | yes | 170 |
| brain-store-schema | maker | model | yes | yes | yes | 56 |
| code-review | checker | model | yes | yes | yes | 84 |
| codebase-design | decision | model | yes | yes | yes | 79 |
| codex-adapter-plan | maker | model | yes | yes | yes | 59 |
| domain-modeling | decision | model | yes | yes | yes | 120 |
| evidence-review-loop | checker | model | yes | yes | yes | 77 |
| handoff-compact | router | model | yes | yes | yes | 74 |
| source-to-decision | decision | model | yes | yes | yes | 231 |
| target-repo-testing | checker | model | yes | yes | yes | 203 |
| tdd | maker | model | yes | yes | yes | 101 |
| typescript-type-safety | maker | model | yes | yes | yes | 74 |

## Matt Skills

| Skill | Role | Invocation | Stop | Output | Verification | Lines |
|---|---|---|---|---|---|---|
| ask-matt | router | user | no | no | yes | 77 |
| code-review | checker | model | no | no | yes | 90 |
| codebase-design | decision | model | no | no | yes | 115 |
| diagnosing-bugs | maker | model | yes | no | yes | 135 |
| domain-modeling | decision | model | no | no | yes | 75 |
| grill-with-docs | decision | user | no | no | no | 8 |
| implement | maker | user | no | no | yes | 16 |
| improve-codebase-architecture | decision | user | no | no | yes | 67 |
| prototype | maker | model | no | no | yes | 31 |
| research | decision | model | no | no | yes | 13 |
| resolving-merge-conflicts | maker | model | no | no | yes | 15 |
| setup-matt-pocock-skills | router | user | no | no | yes | 128 |
| tdd | maker | model | no | no | yes | 37 |
| to-spec | decision | user | no | no | yes | 76 |
| to-tickets | router | user | no | no | yes | 115 |
| triage | router | user | no | no | yes | 113 |
| wayfinder | router | user | no | no | yes | 128 |
