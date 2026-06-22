import type {
  EvidenceBundle,
  ExecutionRunId,
  FeedbackDelta,
  IsoTimestamp,
  ReviewAssessment
} from "@krn/core";

export type ObserverInputSourceType =
  | "run_event"
  | "evidence_bundle"
  | "review_assessment"
  | "feedback_delta";

export interface ObserverRunEventSnapshot {
  id: string;
  sequence: number;
  type: string;
  severity: "debug" | "info" | "warning" | "error";
  message: string;
  payload: Record<string, unknown>;
  occurredAt: IsoTimestamp;
}

export interface ObserverInputItem {
  sourceType: ObserverInputSourceType;
  sourceId: string;
  locator: string;
  observedAt: IsoTimestamp;
  text: string;
  payload: string;
}

export interface ObserverInputRedaction {
  sourceId: string;
  paths: string[];
}

export interface ObserverInputTruncation {
  sourceId: string;
  field: "payload";
  originalCharacters: number;
  retainedCharacters: number;
}

export interface BuildObserverInputOptions {
  executionRunId: ExecutionRunId;
  generatedAt: IsoTimestamp;
  events: readonly ObserverRunEventSnapshot[];
  evidenceBundles: readonly EvidenceBundle[];
  reviewAssessments: readonly ReviewAssessment[];
  feedbackDeltas: readonly FeedbackDelta[];
  maxPayloadCharacters?: number;
}

export interface ObserverInput {
  executionRunId: ExecutionRunId;
  generatedAt: IsoTimestamp;
  counts: {
    events: number;
    evidenceBundles: number;
    reviewAssessments: number;
    feedbackDeltas: number;
  };
  items: ObserverInputItem[];
  redactions: ObserverInputRedaction[];
  truncations: ObserverInputTruncation[];
}

const defaultMaxPayloadCharacters = 1_200;
const redactedValue = "[REDACTED]";
const secretKeyPattern = /(?:password|secret|token|api[-_]?key|authorization|cookie|private[-_]?key)/i;
const secretValuePatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/u,
  /\bBearer\s+[A-Za-z0-9._~+/-]{16,}={0,2}\b/iu,
  /\b[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/u,
  /\b(?:Api[-_ ]?Key|x-api-key|api_key)\s*[:=]?\s*[A-Za-z0-9._-]{16,}\b/iu,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/u,
  /\bgh[opsru]_[A-Za-z0-9_]{20,}\b/u,
  /\bCookie:\s*[^=\s;]+=[^;\s]{8,}/iu,
  /\b(?:sessionid|session|sid|auth|token)=[^;\s]{8,}/iu
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const sortById = <T extends { id: string }>(items: readonly T[]): T[] => (
  [...items].sort((left, right) => left.id.localeCompare(right.id))
);

const sortByCreatedAt = <T extends { id: string; createdAt: IsoTimestamp }>(
  items: readonly T[]
): T[] => (
  [...items].sort((left, right) => (
    left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
  ))
);

const isSecretShapedString = (value: string): boolean => (
  secretValuePatterns.some((pattern) => pattern.test(value))
);

const sanitizeValue = (
  value: unknown,
  path: string[],
  redactedPaths: string[]
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeValue(item, [...path, String(index)], redactedPaths));
  }

  if (typeof value === "string" && isSecretShapedString(value)) {
    redactedPaths.push(path.join("."));
    return redactedValue;
  }

  if (!isRecord(value)) {
    return value;
  }

  const sanitized: Record<string, unknown> = {};

  for (const key of Object.keys(value).sort()) {
    const nextPath = [...path, key];

    if (secretKeyPattern.test(key)) {
      sanitized[key] = redactedValue;
      redactedPaths.push(nextPath.join("."));
      continue;
    }

    sanitized[key] = sanitizeValue(value[key], nextPath, redactedPaths);
  }

  return sanitized;
};

const stringifyPayload = (
  sourceId: string,
  payload: Record<string, unknown>,
  maxPayloadCharacters: number,
  redactions: ObserverInputRedaction[],
  truncations: ObserverInputTruncation[]
): string => {
  const redactedPaths: string[] = [];
  const sanitized = sanitizeValue(payload, [], redactedPaths);
  const json = JSON.stringify(sanitized);

  if (redactedPaths.length > 0) {
    redactions.push({
      sourceId,
      paths: redactedPaths
    });
  }

  if (json.length <= maxPayloadCharacters) {
    return json;
  }

  truncations.push({
    sourceId,
    field: "payload",
    originalCharacters: json.length,
    retainedCharacters: maxPayloadCharacters
  });

  return `${json.slice(0, maxPayloadCharacters)}... [truncated]`;
};

const eventItem = (
  event: ObserverRunEventSnapshot,
  maxPayloadCharacters: number,
  redactions: ObserverInputRedaction[],
  truncations: ObserverInputTruncation[]
): ObserverInputItem => ({
  sourceType: "run_event",
  sourceId: event.id,
  locator: `run_events.sequence:${event.sequence}`,
  observedAt: event.occurredAt,
  text: `${event.type}: ${event.message}`,
  payload: stringifyPayload(event.id, {
    sequence: event.sequence,
    severity: event.severity,
    type: event.type,
    payload: event.payload
  }, maxPayloadCharacters, redactions, truncations)
});

const evidenceItem = (
  evidence: EvidenceBundle,
  maxPayloadCharacters: number,
  redactions: ObserverInputRedaction[],
  truncations: ObserverInputTruncation[]
): ObserverInputItem => ({
  sourceType: "evidence_bundle",
  sourceId: evidence.id,
  locator: `evidence_bundles.id:${evidence.id}`,
  observedAt: evidence.updatedAt,
  text: `evidence ${evidence.status}: ${evidence.commands.length} commands, ${evidence.changedFiles.length} changed files`,
  payload: stringifyPayload(evidence.id, {
    status: evidence.status,
    changedFiles: evidence.changedFiles,
    commands: evidence.commands,
    diffRisk: evidence.diffRisk,
    reviewBurden: evidence.reviewBurden,
    rollbackPath: evidence.rollbackPath,
    metadata: evidence.metadata
  }, maxPayloadCharacters, redactions, truncations)
});

const reviewItem = (
  review: ReviewAssessment,
  maxPayloadCharacters: number,
  redactions: ObserverInputRedaction[],
  truncations: ObserverInputTruncation[]
): ObserverInputItem => ({
  sourceType: "review_assessment",
  sourceId: review.id,
  locator: `review_assessments.id:${review.id}`,
  observedAt: review.updatedAt,
  text: `review ${review.status}: ${review.summary}`,
  payload: stringifyPayload(review.id, {
    status: review.status,
    reviewer: review.reviewer,
    findings: review.findings,
    metadata: review.metadata
  }, maxPayloadCharacters, redactions, truncations)
});

const feedbackItem = (
  feedback: FeedbackDelta,
  maxPayloadCharacters: number,
  redactions: ObserverInputRedaction[],
  truncations: ObserverInputTruncation[]
): ObserverInputItem => ({
  sourceType: "feedback_delta",
  sourceId: feedback.id,
  locator: `feedback_deltas.id:${feedback.id}`,
  observedAt: feedback.updatedAt,
  text: `feedback ${feedback.status}: ${feedback.memoryCandidates.length} memory candidates, ${feedback.sourceDecisions.length} source decisions, ${feedback.evalCandidates.length} eval candidates`,
  payload: stringifyPayload(feedback.id, {
    status: feedback.status,
    memoryCandidateCount: feedback.memoryCandidates.length,
    sourceDecisionCount: feedback.sourceDecisions.length,
    evalCandidateCount: feedback.evalCandidates.length,
    metadata: feedback.metadata
  }, maxPayloadCharacters, redactions, truncations)
});

export const buildObserverInput = (
  options: BuildObserverInputOptions
): ObserverInput => {
  const maxPayloadCharacters = options.maxPayloadCharacters ?? defaultMaxPayloadCharacters;
  const redactions: ObserverInputRedaction[] = [];
  const truncations: ObserverInputTruncation[] = [];
  const events = [...options.events].sort((left, right) => (
    left.sequence - right.sequence || left.id.localeCompare(right.id)
  ));

  const items = [
    ...events.map((event) => eventItem(event, maxPayloadCharacters, redactions, truncations)),
    ...sortByCreatedAt(options.evidenceBundles).map((evidence) =>
      evidenceItem(evidence, maxPayloadCharacters, redactions, truncations)),
    ...sortByCreatedAt(options.reviewAssessments).map((review) =>
      reviewItem(review, maxPayloadCharacters, redactions, truncations)),
    ...sortById(options.feedbackDeltas).map((feedback) =>
      feedbackItem(feedback, maxPayloadCharacters, redactions, truncations))
  ];

  return {
    executionRunId: options.executionRunId,
    generatedAt: options.generatedAt,
    counts: {
      events: options.events.length,
      evidenceBundles: options.evidenceBundles.length,
      reviewAssessments: options.reviewAssessments.length,
      feedbackDeltas: options.feedbackDeltas.length
    },
    items,
    redactions,
    truncations
  };
};
