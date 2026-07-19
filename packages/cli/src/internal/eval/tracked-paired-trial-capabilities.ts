import { createHash } from "node:crypto";

import type { CommandResult } from "./paired-live-codex-repair.js";
import {
  isTrackedTrialCapabilities,
  type CodexCapabilityProfile,
  type PairedTrialManifest
} from "./tracked-paired-trial-manifest.js";

type JsonRecord = Record<string, unknown>;

export type CodexCapabilityUseObservation = {
  readonly mcpToolCallEvents: number;
  readonly skillEvents: number;
  readonly genericMcpToolCallEvents?: number;
  readonly genericSkillEvents?: number;
};

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const tomlString = (value: string): string => JSON.stringify(value);

/** Render the explicit Codex overrides for a preregistered capability arm. */
export const codexCapabilityConfigArgs = (
  profile: CodexCapabilityProfile | undefined
): readonly string[] => {
  if (profile === undefined) return [];
  const args: string[] = [];
  for (const server of profile.mcpServers) {
    args.push("--config", `mcp_servers.${server.name}.command=${tomlString(server.command)}`);
    args.push("--config", `mcp_servers.${server.name}.args=${JSON.stringify(server.args)}`);
    args.push("--config", `mcp_servers.${server.name}.enabled=true`);
    if (server.envVars !== undefined) {
      args.push("--config", `mcp_servers.${server.name}.env_vars=${JSON.stringify(server.envVars)}`);
    }
  }
  const skills = profile.skillPaths.map((path) => `{path=${tomlString(path)},enabled=true}`);
  args.push("--config", `skills.config=[${skills.join(",")}]`);
  return args;
};

export const codexCapabilityProfileConfig = (
  baseConfig: string,
  profile: CodexCapabilityProfile | undefined
): string => {
  if (profile === undefined) return baseConfig;
  const serverConfig = profile.mcpServers.map((server) => [
    `[mcp_servers.${server.name}]`,
    `command = ${tomlString(server.command)}`,
    `args = ${JSON.stringify(server.args)}`,
    "enabled = true",
    ...(server.envVars === undefined ? [] : [`env_vars = ${JSON.stringify(server.envVars)}`])
  ].join("\n")).join("\n\n");
  const skillConfig = profile.skillPaths.map((path) => [
    "[[skills.config]]",
    `path = ${tomlString(path)}`,
    "enabled = true"
  ].join("\n")).join("\n\n");
  return [baseConfig.trimEnd(), serverConfig, skillConfig].filter((part) => part.length > 0).join("\n\n") + "\n";
};

export const capabilityProfileName = (baseName: string, arm: "baseline" | "krn"): string =>
  `${baseName}-${arm}`;

export const capabilityProfileHash = (profile: CodexCapabilityProfile | undefined): string =>
  sha256(JSON.stringify(profile ?? {
    mode: "legacy",
    mcpServers: [],
    skillPaths: []
  }));

export const hasPacketTransportCapability = (
  capabilities: PairedTrialManifest["capabilities"]
): boolean =>
  isTrackedTrialCapabilities(capabilities) &&
  capabilities.krn.mcpServers.some((server) => server.name === "krn_decision_packet");

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const walkStructuredJson = (node: unknown, visit: (record: JsonRecord) => void): void => {
  if (Array.isArray(node)) {
    node.forEach((child) => walkStructuredJson(child, visit));
    return;
  }
  if (!isRecord(node)) return;
  visit(node);
  Object.values(node).forEach((child) => walkStructuredJson(child, visit));
};

const capabilityEventName = (record: JsonRecord): string | undefined =>
  typeof record["server"] === "string"
    ? record["server"]
    : typeof record["name"] === "string" ? record["name"] : undefined;

const classifyMcpEvent = (
  record: JsonRecord,
  expectedMcpServers: readonly string[] | undefined
): "configured" | "generic" | undefined => {
  const eventType = record["type"];
  if (eventType !== "mcp_tool_call" && eventType !== "mcp_tool_call_completed") return undefined;
  const name = capabilityEventName(record);
  return expectedMcpServers === undefined ||
    (name !== undefined && expectedMcpServers.includes(name)) ? "configured" : "generic";
};

const classifySkillEvent = (
  record: JsonRecord,
  expectedSkills: boolean | undefined
): "configured" | "generic" | undefined => {
  const eventType = record["type"];
  if (eventType !== "skill" && eventType !== "skill_loaded") return undefined;
  return expectedSkills === undefined || expectedSkills ? "configured" : "generic";
};

export const observeCodexCapabilityUse = (
  result: Pick<CommandResult, "stdout">,
  expectedMcpServers?: readonly string[],
  expectedSkills?: boolean
): CodexCapabilityUseObservation => {
  let mcpToolCallEvents = 0;
  let skillEvents = 0;
  let genericMcpToolCallEvents = 0;
  let genericSkillEvents = 0;
  const visit = (node: JsonRecord): void => {
    const mcpEvent = classifyMcpEvent(node, expectedMcpServers);
    if (mcpEvent === "configured") mcpToolCallEvents += 1;
    if (mcpEvent === "generic") genericMcpToolCallEvents += 1;
    const skillEvent = classifySkillEvent(node, expectedSkills);
    if (skillEvent === "configured") skillEvents += 1;
    if (skillEvent === "generic") genericSkillEvents += 1;
  };
  for (const line of result.stdout.split("\n")) {
    try {
      const parsed: unknown = JSON.parse(line);
      walkStructuredJson(parsed, visit);
    } catch {
      // Capability evidence is accepted only from structured JSON events.
    }
  }
  return {
    mcpToolCallEvents,
    skillEvents,
    ...(expectedMcpServers === undefined && genericMcpToolCallEvents === 0
      ? {} : { genericMcpToolCallEvents }),
    ...(expectedSkills === undefined && genericSkillEvents === 0
      ? {} : { genericSkillEvents })
  };
};

export const capabilityUseFalsifierReasons = (
  observation: { readonly baseline: CodexCapabilityUseObservation; readonly krn: CodexCapabilityUseObservation }
): readonly string[] => [
  observation.baseline.mcpToolCallEvents + observation.baseline.skillEvents === 0
    ? undefined
    : "baseline emitted a configured KRN capability-use event",
  observation.krn.mcpToolCallEvents + observation.krn.skillEvents > 0
    ? undefined
    : "KRN emitted no configured capability-use event"
].filter((reason): reason is string => reason !== undefined);
