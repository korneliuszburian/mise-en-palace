import { decisionPacketSupportingEvidenceMaxCharacters } from "./decision-packet-contract.js";

export const decisionPacketSupportingEvidenceProjectionVersions = [
  "raw-prefix-v1",
  "html-prose-v2"
] as const;

export type DecisionPacketSupportingEvidenceProjectionVersion =
  (typeof decisionPacketSupportingEvidenceProjectionVersions)[number];

export const currentDecisionPacketSupportingEvidenceProjectionVersion = "html-prose-v2" satisfies
  DecisionPacketSupportingEvidenceProjectionVersion;

const htmlProseProjectionMaxCharacters = 300;
const standaloneBase64Payload =
  /(?:[a-z0-9+/_-]{64,}(?:[ \t\r\n]+[a-z0-9+/_-]{16,})+|[a-z0-9+/_-]{128,})={0,2}/giu;

const scrubStandaloneBase64Payloads = (content: string): string =>
  content.replace(standaloneBase64Payload, " ");

const decodeHtmlEntity = (_match: string, entity: string): string => {
  const named: Readonly<Record<string, string>> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\""
  };
  const normalizedEntity = entity.toLowerCase();
  const namedValue = named[normalizedEntity];

  if (namedValue !== undefined) {
    return namedValue;
  }

  const numeric = normalizedEntity.startsWith("#x")
    ? Number.parseInt(normalizedEntity.slice(2), 16)
    : normalizedEntity.startsWith("#")
      ? Number.parseInt(normalizedEntity.slice(1), 10)
      : Number.NaN;

  return Number.isSafeInteger(numeric) &&
    numeric > 0 &&
    numeric <= 0x10ffff &&
    !(numeric >= 0xd800 && numeric <= 0xdfff)
    ? String.fromCodePoint(numeric)
    : `&${entity};`;
};

const htmlTextProjection = (content: string): string => {
  const withoutNonContent = scrubStandaloneBase64Payloads(content)
    .replace(/<!--[\s\S]*?-->/gu, " ")
    .replace(/<(?:script|style|svg|iframe|template|noscript)\b[^>]*>[\s\S]*?<\/(?:script|style|svg|iframe|template|noscript)>/giu, " ")
    .replace(/data:[^"'\s>]*/giu, " ");
  const semanticFragments = [...withoutNonContent.matchAll(
    /<(p|h[1-6]|li|blockquote|pre|code)\b[^>]*>([\s\S]*?)<\/\1>/giu
  )]
    .map((match) => ({
      kind: match[1]?.toLowerCase() ?? "",
      content: match[2] ?? ""
    }));
  const substantiveProse = semanticFragments.filter((fragment) =>
    fragment.kind === "p" &&
    fragment.content.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ").trim().length >= 80
  );
  const semanticContent = (substantiveProse.length > 0 ? substantiveProse : semanticFragments)
    .map((fragment) => fragment.content)
    .join(" ");

  return (semanticContent.length > 0 ? semanticContent : withoutNonContent)
    .replace(/<[^>]*>/gu, " ")
    .replace(/<[^>]*$/gu, " ")
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/giu, decodeHtmlEntity)
    .replace(/\s+/gu, " ")
    .trim();
};

export interface DecisionPacketSupportingEvidenceProjection {
  readonly content: string;
  readonly truncated: boolean;
}

export const projectDecisionPacketSupportingEvidence = (
  capturedContent: string,
  version: DecisionPacketSupportingEvidenceProjectionVersion =
    currentDecisionPacketSupportingEvidenceProjectionVersion
): DecisionPacketSupportingEvidenceProjection => {
  if (version === "raw-prefix-v1") {
    return {
      content: capturedContent.slice(0, decisionPacketSupportingEvidenceMaxCharacters),
      truncated: capturedContent.length > decisionPacketSupportingEvidenceMaxCharacters
    };
  }

  const normalized = /<(?:[a-z][^>]*|![^>]*)>/iu.test(capturedContent)
    ? htmlTextProjection(capturedContent)
    : capturedContent.trim();
  const scrubbed = scrubStandaloneBase64Payloads(normalized).replace(/\s+/gu, " ").trim();
  const truncated = scrubbed.length > htmlProseProjectionMaxCharacters;
  const bounded = scrubbed.slice(0, htmlProseProjectionMaxCharacters);
  const lastWordBoundary = bounded.lastIndexOf(" ");

  return {
    content: truncated
      ? bounded.slice(
          0,
          lastWordBoundary >= Math.floor(htmlProseProjectionMaxCharacters * 0.75)
            ? lastWordBoundary
            : bounded.length
        ).trimEnd()
      : scrubbed,
    truncated
  };
};
