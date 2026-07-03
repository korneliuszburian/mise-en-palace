#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: run_review.sh <prompt.md> <output.json>" >&2
  exit 64
fi

prompt_file=$1
output_file=$2

if [[ ! -f "$prompt_file" ]]; then
  echo "prompt file not found: $prompt_file" >&2
  exit 66
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found on PATH" >&2
  exit 127
fi

mkdir -p "$(dirname "$output_file")"

max_turns=${SECOND_OPINION_MAX_TURNS:-1}
max_budget=${SECOND_OPINION_MAX_BUDGET_USD:-0.50}
timeout_seconds=${SECOND_OPINION_TIMEOUT_SECONDS:-120}
model_args=()
tmp_output=$(mktemp)

cleanup() {
  rm -f "$tmp_output"
}

trap cleanup EXIT

if [[ -n "${SECOND_OPINION_MODEL:-}" ]]; then
  model_args=(--model "$SECOND_OPINION_MODEL")
fi

if timeout "$timeout_seconds" claude \
    --bare \
    --print "Use the prompt from stdin as the complete review task. Do not use tools. Return the requested review only." \
    --tools "" \
    --output-format json \
    --max-turns "$max_turns" \
    --max-budget-usd "$max_budget" \
    --no-session-persistence \
    "${model_args[@]}" \
    < "$prompt_file" \
    > "$tmp_output"; then
  mv "$tmp_output" "$output_file"
else
  status=$?

  if [[ "$status" -eq 124 ]]; then
    cat > "$output_file" <<EOF
{"type":"result","subtype":"error_timeout","is_error":true,"timeout_seconds":$timeout_seconds,"prompt_file":"$prompt_file"}
EOF
  elif [[ -s "$tmp_output" ]]; then
    mv "$tmp_output" "$output_file"
  else
    cat > "$output_file" <<EOF
{"type":"result","subtype":"error_exit","is_error":true,"exit_status":$status,"prompt_file":"$prompt_file"}
EOF
  fi

  exit "$status"
fi

printf '%s\n' "$output_file"
