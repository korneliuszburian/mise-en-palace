# Dogfood Brain Usefulness Reporting

Status: reusable reporting format for KRN dogfood runs.

Source: `docs/reviews/brain-usefulness/REPORT.md`.

## Purpose

Use this format to record whether KRN Brain helped a real dogfood run. The goal
is not to add another quality layer. The goal is to make every dogfood ledger
answer whether selected context, memory, source grounding, evidence,
observation, reflection, and candidates reduced task drift or review burden.

## When To Use It

Use this section for KRN-on-KRN dogfood runs that exercise at least one of:

- activation or context assembly;
- MemoryRecord, MemoryCandidate, MemoryReviewGate, or memory application;
- SourceClaim or SourceDecisionEdge;
- EvidenceBundle, ReviewAssessment, or FeedbackDelta;
- observation prefix, ObservationGroup, or ReflectionRecord;
- candidate proposal, review, rejection, or deferral;
- golden behavior, promptfoo adapter, or other proof boundary.

Prefer adding the section to the run ledger while the evidence is fresh. If the
run is already complete, add it as a review appendix and make clear which
claims are reconstructed from committed evidence rather than live runtime.

## What Not To Use It For

Do not use one dogfood usefulness section to justify:

- dashboard;
- worker runtime;
- broad eval platform;
- activation rewrite;
- memory scoring rewrite;
- new memory subsystem;
- source crawler;
- `krn audit`;
- anti-slop scanner.

Do not mutate Memory Core, promote candidates, change scoring, or create new
runtime behavior as a side effect of reporting.

## Required Fields

Every dogfood usefulness section must record:

- run ID or explicit reason no persisted run exists;
- task/objective;
- date;
- source of evidence;
- whether live DB was inspected in the current shell;
- related commits or changed files if known;
- command evidence and proof strength;
- selected / used / helped / missing / stale context;
- memory usefulness;
- source usefulness;
- evidence and review burden;
- observation/reflection usefulness;
- candidate reviewability;
- Brain ROI verdict;
- follow-up slices supported directly by evidence.

## Required Non-Equivalences

State these rules explicitly when they matter to a run:

```txt
selected != used
used != helped
persisted != useful
green test != product value
reflection record != useful reflection
candidate exists != reviewable candidate
source selected != decision supported
evidence captured != command proof
```

## Dogfood Brain Usefulness Section

Copy this section into future dogfood ledgers when the run exercises Brain
behavior.

### Brain Usefulness Summary

Brain ROI:
- strong positive / positive / mixed / weak / negative / insufficient evidence

Overall verdict:
- ...

What this run proves:
- ...

What this run does not prove:
- ...

DB used in current shell:
- yes / no

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ... | memory / source / observation / anti-memory / search / raw recall / other | ... | yes / no / unclear | helped / neutral / noise / hurt / stale / unknown | missing / stale / noise / none / unknown | file, run ID, DB ID, command, or line pointer | keep / strengthen / demote / invalidate / add anti-memory / improve activation / no action / unknown |

Allowed labels:

Used:
- yes / no / unclear

Helped:
- helped / neutral / noise / hurt / stale / unknown

Follow-up:
- keep / strengthen / demote / invalidate / add anti-memory / improve activation / no action / unknown

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| ... | MemoryRecord / SourceClaim / observation / raw evidence / unknown | ... | ... | activation scoring / memory guidance / source quality / raw recall / no action / unknown |

Use this table only for context that should have been selected based on run
evidence. Do not invent missing context from hindsight without a concrete
source pointer.

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| ... | yes / no / unclear | yes / no / unclear | helped / neutral / noise / hurt / stale / unknown | source claim / evidence bundle / operator report / DB row / ledger only / unknown | ready / needs more evidence / too vague / duplicate / not useful / unknown | keep / strengthen / demote / invalidate / convert to anti-memory / review / reject / defer / unknown |

Reviewability:
- ready / needs more evidence / too vague / duplicate / not useful / unknown

Rules:

- Memory exists is not evidence that memory helped.
- Memory selected is not evidence that memory was used.
- Memory used is not evidence that memory reduced review burden.
- Memory application feedback must name the run/task it helped or hurt.

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| ... | yes / no / unclear | yes / no / unclear | yes / no / unclear | yes / no / unclear | claim ID, source edge, file, or command | keep / strengthen / demote / reject / add conflict / no action / unknown |

Use this table to distinguish source grounding from source decoration. A source
claim is useful only when it supports or qualifies a decision, prevents a false
claim, exposes a conflict, or gives a falsifier that changes what can be
claimed.

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| ... | strong / weak / missing / not applicable | ... | ... | reduced / unchanged / increased / unclear |

Strength:
- strong: outcome and provenance are recorded clearly enough for review;
- weak: evidence exists but provenance, scope, or command status is incomplete;
- missing: the run needed the evidence but did not record it;
- not applicable: the run did not need this evidence.

Review burden impact:
- reduced / unchanged / increased / unclear

Rules:

- A passed command proves only the command scope that actually ran.
- A skipped command proves nothing about runtime correctness.
- DB runtime truth requires DB commands in the current shell.
- Dirty or unrelated worktree state is evidence and must not be hidden.

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| ... | finding / gap / contradiction / candidate / empty / prefix / other | useful finding / useful gap / useful contradiction / correctly empty / ledger-only / noise / missing finding | observation ID, reflection ID, source range, run ledger | keep / add richer fixture / improve extraction / no action / unknown |

Useful:
- useful finding;
- useful gap;
- useful contradiction;
- correctly empty;
- ledger-only;
- noise;
- missing finding.

Rules:

- Observation staging is not memory.
- ReflectionRecord persistence is not useful reflection.
- An empty reflection can be correct only when the run evidence supports that
  there was nothing useful to extract.

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| ... | MemoryCandidate / AntiMemoryCandidate / SourceDecision / EvalCandidate / other | ... | ready / needs more evidence / too vague / duplicate / not useful / unknown | review / reject / defer / convert / unknown | ... |

Decision:
- review / reject / defer / convert / unknown

Rules:

- Candidate exists does not mean candidate is reviewable.
- Candidate reviewability requires evidence refs, scope, does-not-prove where
  relevant, and a clear future use.
- Weak command provenance cannot support high-confidence candidate promotion.

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower / same / higher / unknown | ... |
| Review burden | lower / same / higher / unknown | ... |
| Resume quality | better / same / worse / unknown | ... |
| Decision grounding | better / same / worse / unknown | ... |
| Memory usefulness | better / same / worse / unknown | ... |
| Operator friction | lower / same / higher / unknown | ... |

Brain ROI verdict:
- strong positive / positive / mixed / weak / negative / insufficient evidence

Use qualitative labels only. Do not invent numeric precision.

### Command Evidence

| Command | Result | Proof strength | What it proves | What it does not prove |
| --- | --- | --- | --- | --- |
| ... | passed / failed / skipped / not run / unavailable | strong / weak / missing / not applicable | ... | ... |

Command evidence must distinguish:

- operator-reported outcomes;
- captured output files;
- command-runner evidence;
- external logs;
- default templates;
- missing output;
- current-shell DB runtime truth.

### Next Slice Candidates

Only list follow-up slices directly supported by evidence.

| Candidate slice | Why | Evidence | Non-goals | Verification |
| --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... |

Limit:
- maximum 3 follow-up candidates per dogfood run.

Allowed follow-up categories:

- activation usefulness reporting;
- activation scoring repair, only after repeated measured misses;
- memory application guidance repair;
- source claim quality repair;
- evidence capture ergonomics repair;
- review burden reporting repair;
- reflection quality dogfood case;
- candidate reviewability repair;
- internal-alpha target repo trial.

Not allowed from one report:

- dashboard;
- worker runtime;
- broad eval platform;
- source crawler;
- new memory subsystem;
- `krn audit`;
- anti-slop scanner;
- broad activation rewrite;
- broad memory scoring rewrite.

## Converting Findings Into Next Slices

Convert a finding into a next slice only when the report names:

- the observed failure or gap;
- the evidence pointer;
- why it mattered to the run;
- the smallest likely files or docs to touch;
- explicit non-goals;
- a verification command or review check.

Do not create a slice from a preference, hunch, or single decorative example.
If evidence is weak, record a dogfood case instead of changing behavior.

## Placement Guidance

Keep this document near `docs/reviews/brain-usefulness/REPORT.md` until the
format proves itself across multiple dogfood runs. Promote it to
`docs/standards/` only after repeated use shows that it is a stable repo-wide
standard rather than a one-off review aid.
