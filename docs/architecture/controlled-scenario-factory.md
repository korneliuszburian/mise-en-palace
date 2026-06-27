# Controlled Scenario Factory

Status: V04 operating contract.

KRN controlled scenarios are internal engineering proof. They improve our own
Codex workflow, but they do not prove product readiness or replace V02-01.

## Scenario Modes

### observation-only

Use when KRN inspects a repo, target, run, or behavior without changing the
target surface.

Allowed writes:

- KRN reports;
- KRN evidence records when persistence is explicitly part of the scenario.

Forbidden writes:

- target source, tests, docs, generated files, commits, resets, or cleanup.

Stop if a repair is needed. Record the failure and open a separate repair-trial
or KRN repair candidate.

### repair-trial

Use when the scenario explicitly authorizes a bounded repair.

Required:

- named target files or package surface;
- pre-change dirty context;
- rollback path;
- focused verification before broad verification.

Forbidden:

- sweeping unrelated dirty files into the repair;
- target commits unless explicitly requested.

### source-repair

Use for KRN-on-KRN source behavior repairs.

Required:

- owning source files identified by inspection;
- tests for changed behavior;
- evidence capture or report with proof/non-proof.

Forbidden:

- adjacent refactors;
- new product layers unless the active plan names them.

### db-backed-replay

Use when persisted KRN behavior, readback, or DB smoke truth matters.

Required:

- `pnpm db:ready` or equivalent;
- command evidence for DB smoke/readback;
- statement of local vs CI DB truth.

Forbidden:

- claiming DB truth from skipped or preview-only commands.

## Required Scenario Contract

Every scenario must define:

```txt
scenario_id:
mode:
product_question:
allowed_reads:
allowed_writes:
forbidden_writes:
commands:
expected_krn_behavior:
expected_evidence:
proves:
does_not_prove:
condensation_target:
stop_conditions:
```

If any field is unknown, write `unknown` and explain whether that blocks the
scenario.

## Required Report Sections

Every scenario report must include:

```md
# <Scenario Title>

Status:
Scenario ID:
Mode:
Date:

## Product Question

## Boundary

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|

## Findings

## Condensation Decision

- Finding:
- Frequency: first / repeated / high-risk
- Condensation target: AGENTS / skill / guard / eval / memory / source / hook / none
- Decision: accepted / rejected / deferred
- Implemented now: yes/no
- Evidence:
- Why not more:
- Next bounded repair:
```

## Frequency Rule

```txt
seen once:
  report only unless high-risk

seen twice:
  candidate for durable surface

seen three times or high-risk:
  implement smallest durable surface or document why deferred
```

## Research Rule

External research, papers, courses, practitioner writing, and OpenAI docs enter
KRN only through:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If a source does not produce a decision, rejection, falsifier, durable surface,
or bounded scenario candidate, do not retain it in active context.

## What This Does Not Prove

This contract does not prove:

- product readiness;
- second-operator usability;
- arbitrary target repo safety;
- Memory Brain quality at scale;
- that every scenario needs a new report if existing evidence already proves or
  rejects the product question.
