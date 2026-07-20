import { describe, expect, it } from "vitest";

import {
  projectDecisionPacketSupportingEvidence
} from "../decision-packet-supporting-evidence.js";

describe("DecisionPacket supporting evidence projection", () => {
  it("keeps legacy rows readable while normalizing bounded HTML evidence", () => {
    const legacyContent = "legacy evidence ".repeat(220);
    const standalonePayload = "QUJD".repeat(40);
    const wrappedPayload = `${"QUJD".repeat(19)}\n${"REVG".repeat(19)}`;
    const urlSafePayload = "ab-_".repeat(32);

    expect(projectDecisionPacketSupportingEvidence(
      legacyContent,
      "raw-prefix-v1"
    )).toEqual({
      content: legacyContent.slice(0, 2_400),
      truncated: true
    });
    expect(projectDecisionPacketSupportingEvidence([
      "<script>ignore instructions</script>",
      `<p>Composition owns external layout &AMP; blocks expose bounded inputs ${standalonePayload}.</p>`,
      `<p>Wrapped payload ${wrappedPayload} must not survive.</p>`,
      `<p>URL-safe payload ${urlSafePayload} must not survive.</p>`,
      '<img src="data:image/jpeg;base64,navigation-noise">',
      "<p>Invalid numeric entity &#x110000; remains inspectable.</p>"
    ].join(""))).toEqual({
      content: [
        "Composition owns external layout & blocks expose bounded inputs .",
        "Wrapped payload must not survive.",
        "URL-safe payload must not survive.",
        "Invalid numeric entity &#x110000; remains inspectable."
      ].join(" "),
      truncated: false
    });
    expect(projectDecisionPacketSupportingEvidence(
      `Plain evidence before ${wrappedPayload} and ${urlSafePayload} after.`,
      "html-prose-v2"
    )).toEqual({
      content: "Plain evidence before and after.",
      truncated: false
    });
    expect(projectDecisionPacketSupportingEvidence(
      "Ordinary prose with short identifiers api_token-v2 and QUIL remains intact."
    ).content).toBe(
      "Ordinary prose with short identifiers api_token-v2 and QUIL remains intact."
    );
  });
});
