#!/usr/bin/env python3
"""Codex SessionStart continuity lab.

This is not a KRN memory substrate. It is a compatibility probe for the Codex
hook mechanism: read one generated ``krn agent packet --json`` artifact and
emit compact Codex SessionStart additionalContext JSON.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path


MAX_FIELD_CHARS = 700
MAX_CONTEXT_CHARS = 1800
AGENT_PACKET_ENV = "KRN_CONTINUITY_AGENT_PACKET_PATH"


def as_record(value: object) -> dict[str, object]:
    return value if isinstance(value, dict) else {}


def clean_text(value: object, *, max_chars: int = MAX_FIELD_CHARS) -> str:
    if not isinstance(value, str):
        return ""
    collapsed = re.sub(r"\s+", " ", value).strip()
    return collapsed[:max_chars]


def clean_list(value: object, *, max_items: int = 6) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned: list[str] = []
    for item in value:
        text = clean_text(item, max_chars=240)
        if text:
            cleaned.append(text)
        if len(cleaned) >= max_items:
            break
    return cleaned


def load_json_record(path: Path) -> dict[str, object]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return as_record(json.load(handle))


def child_record(record: dict[str, object], key: str) -> dict[str, object]:
    return as_record(record.get(key))


def render_agent_packet(record: dict[str, object]) -> str:
    if record.get("kind") != "krn.agentPacket.v1":
        return ""

    request = child_record(record, "request")
    read_model = child_record(record, "readModel")
    packet = child_record(record, "packet")
    task = child_record(read_model, "task")

    run_id = clean_text(request.get("runId"), max_chars=160)
    objective = clean_text(task.get("objective"))
    governing_decisions = clean_list(packet.get("governingDecisionIds"))
    stale_decisions = clean_list(packet.get("staleDecisionIds"))
    rejected_paths = clean_list(packet.get("rejectedPathIds"))
    source_rejections = clean_list(packet.get("sourceRejectionIds"))
    falsifiers = clean_list(packet.get("falsifiers"), max_items=4)
    non_proofs = clean_list(packet.get("nonProofs"), max_items=4)

    lines = ["KRN continuity context from generated agent packet:"]
    if run_id:
        lines.append(f"- Run: {run_id}")
    if objective:
        lines.append(f"- Objective: {objective}")
    if governing_decisions:
        lines.append(f"- Governing decisions: {', '.join(governing_decisions)}")
    if stale_decisions:
        lines.append(f"- Stale decisions: {', '.join(stale_decisions)}")
    if rejected_paths:
        lines.append(f"- Rejected paths: {', '.join(rejected_paths)}")
    if source_rejections:
        lines.append(f"- Source rejections: {', '.join(source_rejections)}")
    if falsifiers:
        lines.append(f"- Falsifiers: {' | '.join(falsifiers)}")
    if non_proofs:
        lines.append(f"- Non-proofs: {' | '.join(non_proofs)}")
    lines.append(
        "- Boundary: this is generated continuity context only; it is not KRN "
        "runtime memory, source authority, review approval, or memory promotion."
    )
    return "\n".join(lines)[:MAX_CONTEXT_CHARS]


def read_hook_input() -> dict[str, object]:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        return as_record(json.loads(raw))
    except json.JSONDecodeError:
        return {}


def agent_packet_path(args: argparse.Namespace) -> Path | None:
    explicit = args.agent_packet or os.environ.get(AGENT_PACKET_ENV)
    return None if explicit is None or explicit.strip() == "" else Path(explicit).expanduser()


def run_hook(args: argparse.Namespace) -> int:
    hook_input = read_hook_input()
    if hook_input.get("hook_event_name") != "SessionStart":
        return 0
    source = hook_input.get("source")
    if source not in {"startup", "resume", "compact"}:
        return 0

    path = agent_packet_path(args)
    if path is None:
        return 0

    record = load_json_record(path)
    context = render_agent_packet(record) if record else ""
    if not context:
        return 0

    payload = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        }
    }
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True))
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--agent-packet",
        help=(
            "Path to a generated `krn agent packet --json` artifact. "
            f"Defaults to ${AGENT_PACKET_ENV}."
        ),
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    return run_hook(args)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
