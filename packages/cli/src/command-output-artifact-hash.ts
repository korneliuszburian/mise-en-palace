import {
  createHash
} from "node:crypto";
import type {
  CommandOutputArtifactSha256Hex
} from "@krn/core";

export const commandOutputArtifactSha256Hex: CommandOutputArtifactSha256Hex = (
  value
) => createHash("sha256").update(value).digest("hex");
