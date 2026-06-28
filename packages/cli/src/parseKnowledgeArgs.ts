import type {
  BrainKnowledgeKind,
  BrainKnowledgeReviewability,
  BrainKnowledgeStatus,
  BrainKnowledgeUsefulnessOutcomeFilter
} from "@krn/harness";
import {
  optionValue
} from "./parseArgHelpers.js";
import type {
  ParseArgsResult
} from "./parseArgs.js";

const knowledgeUsage = [
  "Usage: krn knowledge cards [--card-file <path>|--pattern-file <path>|--catalog-file <path>] [--kind <kind>] [--status <status>] [--reviewability <reviewability>] [--usefulness-outcome <outcome|none>] [--text <query>] [--limit <positive-integer>] [--json|--html]",
  "",
  "Read-only preview commands:",
  "krn knowledge cards --card-file docs-or-fixture-card.json [--text unknown-first]",
  "krn knowledge cards --pattern-file docs/patterns/retained-patterns/pattern.json [--text unknown-first]",
  "krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json [--text unknown-first]",
  "  note: knowledge cards preview reads explicit card or retained-pattern files only; it does not scan, rank, persist, or mutate Memory Core",
  "  proof boundary: valid output proves only that supplied files match known read-model inputs and local filters"
].join("\n");

export const formatKnowledgeUsage = (): string => `${knowledgeUsage}\n`;

const knowledgeKinds = [
  "source_claim",
  "source_decision",
  "pattern",
  "memory",
  "memory_candidate",
  "anti_memory_candidate",
  "eval_candidate",
  "adr",
  "standard",
  "skill",
  "run_evidence"
] as const satisfies readonly BrainKnowledgeKind[];

const knowledgeStatuses = [
  "active",
  "candidate",
  "accepted",
  "rejected",
  "deferred",
  "stale",
  "superseded",
  "unknown"
] as const satisfies readonly BrainKnowledgeStatus[];

const knowledgeReviewabilities = [
  "ready",
  "needs_more_evidence",
  "too_vague",
  "duplicate",
  "not_useful",
  "unknown"
] as const satisfies readonly BrainKnowledgeReviewability[];

const knowledgeUsefulnessOutcomes = [
  "helped",
  "neutral",
  "noise",
  "stale",
  "unknown",
  "none"
] as const satisfies readonly BrainKnowledgeUsefulnessOutcomeFilter[];

const isAllowed = <T extends string>(
  value: string,
  allowed: readonly T[]
): value is T =>
  allowed.some((item) => item === value);

const requiredOption = (
  value: string | undefined,
  usage: string
): { ok: true; value: string } | { ok: false; error: string } =>
  value === undefined ? { ok: false, error: usage } : { ok: true, value };

const parsePositiveInteger = (
  value: string
): { ok: true; value: number } | { ok: false; error: string } => {
  const trimmed = value.trim();

  if (!/^[1-9]\d*$/u.test(trimmed)) {
    return {
      ok: false,
      error: `Unsupported knowledge cards limit: ${value}`
    };
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed)) {
    return {
      ok: false,
      error: `Unsupported knowledge cards limit: ${value}`
    };
  }

  return {
    ok: true,
    value: parsed
  };
};

export const parseKnowledgeArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return {
      command: {
        kind: "knowledgeCardsHelp"
      }
    };
  }

  if (action !== "cards") {
    return {
      error: `Unsupported knowledge command: ${action}\n${formatKnowledgeUsage()}`
    };
  }

  const cardFiles: string[] = [];
  const patternFiles: string[] = [];
  const catalogFiles: string[] = [];
  let kind: BrainKnowledgeKind | undefined;
  let status: BrainKnowledgeStatus | undefined;
  let reviewability: BrainKnowledgeReviewability | undefined;
  let usefulnessOutcome: BrainKnowledgeUsefulnessOutcomeFilter | undefined;
  let text: string | undefined;
  let format: "text" | "json" | "html" = "text";
  let limit: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--card-file") {
      const valueResult = optionValue(args, index, "--card-file");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      cardFiles.push(required.value.trim());
      index += 1;
      continue;
    }

    if (arg === "--pattern-file") {
      const valueResult = optionValue(args, index, "--pattern-file");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      patternFiles.push(required.value.trim());
      index += 1;
      continue;
    }

    if (arg === "--catalog-file") {
      const valueResult = optionValue(args, index, "--catalog-file");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      catalogFiles.push(required.value.trim());
      index += 1;
      continue;
    }

    if (arg === "--kind") {
      const valueResult = optionValue(args, index, "--kind");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      if (!isAllowed(required.value, knowledgeKinds)) {
        return {
          error: `Unsupported knowledge kind: ${required.value}\n${formatKnowledgeUsage()}`
        };
      }

      kind = required.value;
      index += 1;
      continue;
    }

    if (arg === "--status") {
      const valueResult = optionValue(args, index, "--status");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      if (!isAllowed(required.value, knowledgeStatuses)) {
        return {
          error: `Unsupported knowledge status: ${required.value}\n${formatKnowledgeUsage()}`
        };
      }

      status = required.value;
      index += 1;
      continue;
    }

    if (arg === "--reviewability") {
      const valueResult = optionValue(args, index, "--reviewability");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      if (!isAllowed(required.value, knowledgeReviewabilities)) {
        return {
          error: `Unsupported knowledge reviewability: ${required.value}\n${formatKnowledgeUsage()}`
        };
      }

      reviewability = required.value;
      index += 1;
      continue;
    }

    if (arg === "--usefulness-outcome") {
      const valueResult = optionValue(args, index, "--usefulness-outcome");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      if (!isAllowed(required.value, knowledgeUsefulnessOutcomes)) {
        return {
          error: `Unsupported knowledge usefulness outcome: ${required.value}\n${formatKnowledgeUsage()}`
        };
      }

      usefulnessOutcome = required.value;
      index += 1;
      continue;
    }

    if (arg === "--text") {
      const valueResult = optionValue(args, index, "--text");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      text = required.value.trim();
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      const valueResult = optionValue(args, index, "--limit");

      if (valueResult.error !== undefined) {
        return {
          error: `${valueResult.error}\n${formatKnowledgeUsage()}`
        };
      }

      const required = requiredOption(valueResult.value, formatKnowledgeUsage());

      if (!required.ok) {
        return {
          error: required.error
        };
      }

      const parsedLimit = parsePositiveInteger(required.value);

      if (!parsedLimit.ok) {
        return {
          error: `${parsedLimit.error}\n${formatKnowledgeUsage()}`
        };
      }

      limit = parsedLimit.value;
      index += 1;
      continue;
    }

    if (arg === "--json") {
      format = "json";
      continue;
    }

    if (arg === "--html") {
      format = "html";
      continue;
    }

    return {
      error: `Unsupported knowledge cards argument: ${arg}\n${formatKnowledgeUsage()}`
    };
  }

  if (
    (cardFiles.length === 0 && patternFiles.length === 0 && catalogFiles.length === 0) ||
    cardFiles.some((cardFile) => cardFile.length === 0) ||
    patternFiles.some((patternFile) => patternFile.length === 0) ||
    catalogFiles.some((catalogFile) => catalogFile.length === 0)
  ) {
    return {
      error: `Missing required --card-file, --pattern-file, or --catalog-file\n${formatKnowledgeUsage()}`
    };
  }

  return {
    command: {
      kind: "knowledgeCards",
      cardFiles,
      patternFiles,
      catalogFiles,
      filter: {
        ...(kind === undefined ? {} : { kind }),
        ...(status === undefined ? {} : { status }),
        ...(reviewability === undefined ? {} : { reviewability }),
        ...(usefulnessOutcome === undefined ? {} : { usefulnessOutcome }),
        ...(text === undefined || text.length === 0 ? {} : { text })
      },
      format,
      ...(limit === undefined ? {} : { limit })
    }
  };
};
