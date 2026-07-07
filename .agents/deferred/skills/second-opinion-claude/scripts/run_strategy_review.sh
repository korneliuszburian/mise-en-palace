#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: run_strategy_review.sh <question.md> <output.md>" >&2
  exit 64
fi

question_file=$1
output_file=$2

if [[ ! -f "$question_file" ]]; then
  echo "question file not found: $question_file" >&2
  exit 66
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found on PATH" >&2
  exit 127
fi

mkdir -p "$(dirname "$output_file")"

max_budget=${SECOND_OPINION_MAX_BUDGET_USD:-0.50}
timeout_seconds=${SECOND_OPINION_TIMEOUT_SECONDS:-120}
model_args=()
tmp_prompt=$(mktemp)
tmp_envelope=$(mktemp)
envelope_file="${output_file%.*}.envelope.json"

cleanup() {
  rm -f "$tmp_prompt" "$tmp_envelope"
}

trap cleanup EXIT

if [[ -n "${SECOND_OPINION_MODEL:-}" ]]; then
  model_args=(--model "$SECOND_OPINION_MODEL")
fi

cat > "$tmp_prompt" <<'EOF'
# KRN Strategy Review

You are a governed, read-only strategic reviewer for KRN.

This is not an implementation verdict and not a diff approval. Do not claim the
repo is correct. Do not ask for tools. Do not edit files. Use only the prompt
below and clearly separate decisions from uncertainty.

Return concise Markdown with exactly these sections:

## Decision
State the recommended direction in 1-3 bullets.

## Reasoning
Explain why this direction is cleaner than the main alternatives.

## Rejected Options
List rejected options and the concrete reason each should not be used now.

## Beads
Propose follow-up Beads only when they are necessary. Each item must include:
title, priority, dependencies, acceptance, and falsifier.

## Evidence Gaps
Name missing evidence that would materially change the recommendation.

Rules:
- Prefer product clarity over compatibility shims.
- Prefer one public concept over aliases.
- Do not invent repo facts not present in the prompt.
- If the prompt is underspecified, say what is missing instead of pretending.

EOF

cat "$question_file" >> "$tmp_prompt"

if timeout "$timeout_seconds" claude \
    --bare \
    --print \
    --tools "" \
    --output-format json \
    --max-budget-usd "$max_budget" \
    --no-session-persistence \
    "${model_args[@]}" \
    < "$tmp_prompt" \
    > "$tmp_envelope"; then
  cp "$tmp_envelope" "$envelope_file"
  python3 - "$tmp_envelope" "$output_file" <<'PY'
import json
import sys
from pathlib import Path

envelope_path = Path(sys.argv[1])
output_path = Path(sys.argv[2])

try:
    envelope = json.loads(envelope_path.read_text(encoding="utf-8"))
except json.JSONDecodeError as error:
    output_path.write_text(
        f"strategy review error: invalid Claude JSON envelope: {error}\n",
        encoding="utf-8",
    )
    sys.exit(65)

result = envelope.get("result")
if not isinstance(result, str) or not result.strip():
    output_path.write_text(
        "strategy review error: Claude envelope did not contain a non-empty result\n",
        encoding="utf-8",
    )
    sys.exit(65)

output_path.write_text(result.rstrip() + "\n", encoding="utf-8")
PY
  printf '%s\n' "$output_file"
else
  status=$?

  if [[ "$status" -eq 124 ]]; then
    cat > "$output_file" <<EOF
strategy review error: timeout after ${timeout_seconds}s
EOF
  elif [[ -s "$tmp_envelope" ]]; then
    cp "$tmp_envelope" "$envelope_file"
    cat > "$output_file" <<EOF
strategy review error: claude exited with ${status}; envelope: ${envelope_file}
EOF
  else
    cat > "$output_file" <<EOF
strategy review error: claude exited with ${status}
EOF
  fi

  exit "$status"
fi
