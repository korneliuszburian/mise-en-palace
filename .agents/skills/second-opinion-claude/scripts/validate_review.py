#!/usr/bin/env python3
"""Validate governed second-opinion verdicts without calling a model."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


VERDICTS = {"approve", "approve_with_fixes", "block"}
RISK_CLASSES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
HEX_64 = re.compile(r"^[a-f0-9]{64}$")


class ReviewError(Exception):
    pass


def load_json(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:
        raise ReviewError(f"{path}: invalid JSON: {exc}") from exc


def dump_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, indent=2, sort_keys=False)
        handle.write("\n")


def fenced_json_candidates(text: str) -> list[str]:
    return re.findall(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL)


def balanced_object_candidates(text: str) -> list[str]:
    candidates: list[str] = []
    starts = [index for index, char in enumerate(text) if char == "{"]

    for start in starts:
        depth = 0
        in_string = False
        escape = False

        for index in range(start, len(text)):
            char = text[index]

            if in_string:
                if escape:
                    escape = False
                elif char == "\\":
                    escape = True
                elif char == '"':
                    in_string = False
                continue

            if char == '"':
                in_string = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    candidates.append(text[start:index + 1])
                    break

    return candidates


def parse_json_object(candidate: str) -> dict[str, Any] | None:
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        return None

    return parsed if isinstance(parsed, dict) else None


def extract_json_from_text(text: str) -> dict[str, Any]:
    for candidate in [text, *fenced_json_candidates(text), *balanced_object_candidates(text)]:
        parsed = parse_json_object(candidate.strip())
        if parsed is not None and "verdict" in parsed:
            return parsed

    raise ReviewError("could not extract verdict JSON from model result")


def verdict_from_envelope(path: Path) -> dict[str, Any]:
    envelope = load_json(path)

    if not isinstance(envelope, dict):
        raise ReviewError("Claude envelope must be a JSON object")

    if "verdict" in envelope:
        return envelope

    result = envelope.get("result")

    if not isinstance(result, str) or result.strip() == "":
        raise ReviewError("Claude envelope missing non-empty string result")

    return extract_json_from_text(result)


def git_diff_bytes(base: str) -> bytes:
    pathspec = [
        ".",
        ":(exclude).beads/**",
        ":(exclude).local-lab/**",
        ":(exclude)docs/materials/**"
    ]
    commands = [
        ["git", "diff", f"{base}...HEAD", "--", *pathspec],
        ["git", "diff", "--cached", "--", *pathspec],
        ["git", "diff", "--", *pathspec]
    ]
    chunks: list[bytes] = []

    for command in commands:
        completed = subprocess.run(
            command,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        if completed.returncode != 0:
            raise ReviewError(completed.stderr.decode("utf-8", errors="replace").strip())

        chunks.append(completed.stdout)

    return b"\n".join(chunks)


def diff_sha256(base: str) -> str:
    return hashlib.sha256(git_diff_bytes(base)).hexdigest()


def require_string(value: dict[str, Any], key: str, *, max_length: int | None = None) -> str:
    raw = value.get(key)

    if not isinstance(raw, str) or raw.strip() == "":
        raise ReviewError(f"{key} must be a non-empty string")

    if max_length is not None and len(raw) > max_length:
        raise ReviewError(f"{key} must be <= {max_length} chars")

    return raw


def require_bool(value: dict[str, Any], key: str) -> bool:
    raw = value.get(key)

    if not isinstance(raw, bool):
        raise ReviewError(f"{key} must be boolean")

    return raw


def require_list(value: dict[str, Any], key: str) -> list[Any]:
    raw = value.get(key)

    if not isinstance(raw, list):
        raise ReviewError(f"{key} must be an array")

    return raw


def reject_extra_keys(value: dict[str, Any], allowed: set[str], label: str) -> None:
    extra = sorted(set(value) - allowed)

    if extra:
        raise ReviewError(f"{label} has unknown keys: {', '.join(extra)}")


def validate_findings(findings: list[Any]) -> None:
    allowed = {"id", "severity", "evidence_ref", "reason", "minimal_fix"}

    for index, finding in enumerate(findings, start=1):
        if not isinstance(finding, dict):
            raise ReviewError(f"findings[{index}] must be an object")

        reject_extra_keys(finding, allowed, f"findings[{index}]")
        require_string(finding, "id")
        severity = require_string(finding, "severity")
        require_string(finding, "evidence_ref")
        require_string(finding, "reason")
        require_string(finding, "minimal_fix")

        if severity not in SEVERITIES:
            raise ReviewError(f"findings[{index}].severity must be one of {sorted(SEVERITIES)}")


def validate_evidence_gaps(evidence_gaps: list[Any]) -> None:
    allowed = {"what", "verification_requested"}

    for index, gap in enumerate(evidence_gaps, start=1):
        if not isinstance(gap, dict):
            raise ReviewError(f"evidence_gaps[{index}] must be an object")

        reject_extra_keys(gap, allowed, f"evidence_gaps[{index}]")
        require_string(gap, "what")
        require_string(gap, "verification_requested")


def validate_notes(notes: list[Any]) -> None:
    allowed = {"note", "why_non_blocking"}

    for index, note in enumerate(notes, start=1):
        if not isinstance(note, dict):
            raise ReviewError(f"non_blocking_notes[{index}] must be an object")

        reject_extra_keys(note, allowed, f"non_blocking_notes[{index}]")
        require_string(note, "note")
        require_string(note, "why_non_blocking")


def validate_verdict(verdict: dict[str, Any], *, base: str | None = None) -> int:
    allowed = {
        "review_version",
        "verdict",
        "risk_class",
        "diff_sha256",
        "summary",
        "findings",
        "evidence_gaps",
        "another_loop_required",
        "non_blocking_notes"
    }
    reject_extra_keys(verdict, allowed, "verdict")

    if require_string(verdict, "review_version") != "1":
        raise ReviewError("review_version must be '1'")

    verdict_value = require_string(verdict, "verdict")
    risk_class = require_string(verdict, "risk_class")
    diff_hash = require_string(verdict, "diff_sha256")
    require_string(verdict, "summary", max_length=300)
    findings = require_list(verdict, "findings")
    evidence_gaps = require_list(verdict, "evidence_gaps")
    another_loop_required = require_bool(verdict, "another_loop_required")
    notes = require_list(verdict, "non_blocking_notes")

    if verdict_value not in VERDICTS:
        raise ReviewError(f"verdict must be one of {sorted(VERDICTS)}")

    if risk_class not in RISK_CLASSES:
        raise ReviewError(f"risk_class must be one of {sorted(RISK_CLASSES)}")

    if HEX_64.fullmatch(diff_hash) is None:
        raise ReviewError("diff_sha256 must be a 64-character lowercase hex string")

    validate_findings(findings)
    validate_evidence_gaps(evidence_gaps)
    validate_notes(notes)

    if verdict_value == "approve" and findings:
        raise ReviewError("approve verdict must not include findings")

    if verdict_value == "approve_with_fixes" and not findings:
        raise ReviewError("approve_with_fixes requires at least one finding")

    if verdict_value == "block":
        if not findings and not evidence_gaps:
            raise ReviewError("block verdict requires findings or evidence_gaps")
        if not another_loop_required:
            raise ReviewError("block verdict requires another_loop_required=true")

    if base is not None:
        current_hash = diff_sha256(base)
        if diff_hash != current_hash:
            raise ReviewError(f"STALE diff_sha256: verdict={diff_hash} current={current_hash}")

    return 2 if verdict_value == "block" else 0


def finalize(args: argparse.Namespace) -> int:
    verdict = verdict_from_envelope(Path(args.envelope_json))
    verdict["diff_sha256"] = diff_sha256(args.base)
    exit_code = validate_verdict(verdict, base=args.base)
    dump_json(Path(args.out_json), verdict)
    print(f"valid review verdict: {verdict['verdict']} risk={verdict['risk_class']}")
    return exit_code


def check(args: argparse.Namespace) -> int:
    verdict = load_json(Path(args.verdict_json))

    if not isinstance(verdict, dict):
        raise ReviewError("verdict must be a JSON object")

    exit_code = validate_verdict(verdict, base=args.base)
    print(f"valid review verdict: {verdict['verdict']} risk={verdict['risk_class']}")
    return exit_code


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser()
    subcommands = root.add_subparsers(dest="command", required=True)

    finalize_parser = subcommands.add_parser("finalize")
    finalize_parser.add_argument("envelope_json")
    finalize_parser.add_argument("base")
    finalize_parser.add_argument("out_json")
    finalize_parser.set_defaults(func=finalize)

    check_parser = subcommands.add_parser("check")
    check_parser.add_argument("verdict_json")
    check_parser.add_argument("--base")
    check_parser.set_defaults(func=check)

    return root


def main() -> int:
    args = parser().parse_args()

    try:
        return int(args.func(args))
    except ReviewError as exc:
        print(f"review validation failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
