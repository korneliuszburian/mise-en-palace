import type {
  CodexCapabilityEvalManifest
} from "../contracts.js";

export const validManifest = (): CodexCapabilityEvalManifest => ({
  kind: "krn.codexCapabilityEvalManifest.v1",
  id: "weak-json-boundary-001",
  question: "Does KRN context improve the same Codex model on matched repo tasks?",
  target: {
    repoPath: "tests/fixtures/target-repos/weak-json-boundary-typescript",
    commit: "028ee980a7167855bafd3f8beb3e388fb3529bad",
    taskId: "weak-json-boundary",
    prompt: "Repair invalid JSON handling with explicit result states.",
    timeoutMs: 240000
  },
  codex: {
    command: "codex",
    execBaseArgs: ["exec", "--json", "--ephemeral", "--ignore-rules", "--sandbox", "workspace-write"],
    model: "gpt-5.6-sol"
  },
  arms: {
    baseline: {
      profile: {
        name: "plain-codex-eval",
        configPath: "evals/codex-capability/profiles/plain-codex-eval.config.toml"
      },
      capabilities: {
        mcpServers: [],
        skills: []
      }
    },
    krn: {
      profile: {
        name: "krn-codex-eval",
        configPath: "evals/codex-capability/profiles/krn-codex-eval.config.toml"
      },
      capabilities: {
        mcpServers: [
          {
            id: "krn_decision_packet",
            transport: "stdio",
            readOnly: true
          }
        ],
        skills: [
          {
            name: "krn-memory-core",
            path: ".agents/skills/krn-memory-core/SKILL.md"
          }
        ]
      }
    }
  },
  graders: [
    {
      id: "target-public-seam",
      kind: "deterministic_command",
      command: "pnpm",
      args: ["test"],
      proves: "target public seam passes",
      doesNotProve: "broad product readiness"
    }
  ],
  usage: {
    source: "codex_exec_json",
    requireComparable: true
  }
});
