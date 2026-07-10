import type {
  DoctorCheck,
  DoctorProofEvidence
} from "./run-doctor-command.js";

const DOCTOR_PROOF_FRESHNESS_WINDOW_MS = 15 * 60 * 1000;

export interface DoctorProofExpectation {
  now?: Date;
  storeIdentity?: string;
  requiresProjectId?: boolean;
  projectId?: string;
}

const hasNonEmptyValue = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const parseDatabaseIdentity = (databaseUrl: string): string => {
  try {
    const parsed = new URL(databaseUrl);
    const port = parsed.port.length > 0 ? parsed.port : "5432";
    const database = parsed.pathname.replace(/^\//u, "") || "default";

    return `${parsed.protocol}//${parsed.hostname}:${port}/${database}`;
  } catch {
    return "postgres-store:unparseable-url";
  }
};

export const createDoctorProof = (
  databaseUrl: string,
  probeName: string,
  capturedAt = new Date()
): DoctorProofEvidence => ({
  command: "pnpm krn doctor",
  status: "passed",
  capturedAt: capturedAt.toISOString(),
  freshness: "current",
  storeIdentity: `${parseDatabaseIdentity(databaseUrl)}#${probeName}`
});

export const isCurrentDoctorProof = (
  check: DoctorCheck | undefined,
  expectation: DoctorProofExpectation = {}
): boolean => {
  if (check?.outcome !== "proven") {
    return false;
  }

  const proof = check.proof;
  if (proof === undefined || proof.status !== "passed" || proof.freshness !== "current") {
    return false;
  }

  if (!hasNonEmptyValue(proof.command) || !hasNonEmptyValue(proof.storeIdentity)) {
    return false;
  }

  const capturedAt = Date.parse(proof.capturedAt);
  const now = (expectation.now ?? new Date()).getTime();
  if (!Number.isFinite(capturedAt) || capturedAt > now ||
      now - capturedAt > DOCTOR_PROOF_FRESHNESS_WINDOW_MS) {
    return false;
  }

  if (expectation.storeIdentity !== undefined && proof.storeIdentity !== expectation.storeIdentity) {
    return false;
  }

  if (expectation.requiresProjectId === true && !hasNonEmptyValue(proof.projectId)) {
    return false;
  }

  return expectation.projectId === undefined || proof.projectId === expectation.projectId;
};

export const formatDoctorProof = (
  proof: DoctorProofEvidence,
  details: string
): string =>
  `ready (${details}; command ${proof.command}; status ${proof.status}; captured ${proof.capturedAt}; freshness ${proof.freshness}; store ${proof.storeIdentity})`;
