#!/usr/bin/env python3
"""Codex SessionStart continuity lab.

This is not a KRN memory substrate. It is a small compatibility probe for the
Codex hook mechanism: read one compact continuity record from an ignored lab
directory and emit Codex SessionStart additionalContext JSON.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any


DEFAULT_CONTEXT_FILE = "continuity.json"
MAX_FIELD_CHARS = 700
MAX_CONTEXT_CHARS = 1800


def lab_dir() -> Path:
    configured = os.environ.get("KRN_CONTINUITY_LAB_DIR")
    if configured:
        return Path(configured).expanduser()
    return Path(".local-lab/krn-codex-continuity")


def context_path() -> Path:
    return lab_dir() / DEFAULT_CONTEXT_FILE


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


def load_context(path: Path) -> dict[str, object]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return as_record(json.load(handle))


def render_context(record: dict[str, object]) -> str:
    title = clean_text(record.get("title"))
    next_action = clean_text(record.get("next_action"))
    decision = clean_text(record.get("decision"))
    evidence_refs = clean_list(record.get("evidence_refs"))
    non_goals = clean_list(record.get("non_goals"))

    lines = ["KRN continuity lab context:"]
    if title:
        lines.append(f"- Slice: {title}")
    if next_action:
        lines.append(f"- Next action: {next_action}")
    if decision:
        lines.append(f"- Current decision: {decision}")
    if evidence_refs:
        lines.append(f"- Evidence refs: {', '.join(evidence_refs)}")
    if non_goals:
        lines.append(f"- Non-goals: {', '.join(non_goals)}")
    lines.append(
        "- Boundary: this hook output is session continuity only; it is not KRN "
        "runtime memory, source authority, or memory promotion."
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


def run_hook() -> int:
    hook_input = read_hook_input()
    if hook_input.get("hook_event_name") != "SessionStart":
        return 0
    source = hook_input.get("source")
    if source not in {"startup", "resume", "compact"}:
        return 0

    record = load_context(context_path())
    context = render_context(record) if record else ""
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


def write_record(args: argparse.Namespace) -> int:
    record: dict[str, Any] = {
        "title": args.title,
        "next_action": args.next_action,
        "decision": args.decision,
        "evidence_refs": args.evidence_ref,
        "non_goals": args.non_goal,
    }
    path = context_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(record, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    print(path)
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-record", action="store_true")
    parser.add_argument("--title", default="")
    parser.add_argument("--next-action", default="")
    parser.add_argument("--decision", default="")
    parser.add_argument("--evidence-ref", action="append", default=[])
    parser.add_argument("--non-goal", action="append", default=[])
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    if args.write_record:
        return write_record(args)
    return run_hook()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
