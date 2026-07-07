#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: run_review.sh <prompt.md> <output.json>" >&2
  exit 64
fi

prompt_file=$1
output_file=$2
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if [[ ! -f "$prompt_file" ]]; then
  echo "prompt file not found: $prompt_file" >&2
  exit 66
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found on PATH" >&2
  exit 127
fi

mkdir -p "$(dirname "$output_file")"

max_budget=${SECOND_OPINION_MAX_BUDGET_USD:-0.50}
timeout_seconds=${SECOND_OPINION_TIMEOUT_SECONDS:-120}
base=${SECOND_OPINION_BASE:-origin/main}
model_args=()
tmp_envelope=$(mktemp)
invalid_envelope_file="${output_file%.json}.envelope.json"

cleanup() {
  rm -f "$tmp_envelope"
}

trap cleanup EXIT

if [[ -n "${SECOND_OPINION_MODEL:-}" ]]; then
  model_args=(--model "$SECOND_OPINION_MODEL")
fi

if timeout "$timeout_seconds" claude \
    --bare \
    --print \
    --tools "" \
    --output-format json \
    --max-budget-usd "$max_budget" \
    --no-session-persistence \
    "${model_args[@]}" \
    < "$prompt_file" \
    > "$tmp_envelope"; then
  set +e
  "$script_dir/validate_review.py" finalize "$tmp_envelope" "$base" "$output_file"
  status=$?
  set -e
  if [[ "$status" -ne 0 ]]; then
    cp "$tmp_envelope" "$invalid_envelope_file"
  fi
  if [[ "$status" -ne 0 && ! -s "$output_file" ]]; then
    cat > "$output_file" <<EOF
{"type":"result","subtype":"error_validation","is_error":true,"exit_status":$status,"prompt_file":"$prompt_file","envelope_file":"$invalid_envelope_file"}
EOF
  fi
  printf '%s\n' "$output_file"
  exit "$status"
else
  status=$?

  if [[ "$status" -eq 124 ]]; then
    cat > "$output_file" <<EOF
{"type":"result","subtype":"error_timeout","is_error":true,"timeout_seconds":$timeout_seconds,"prompt_file":"$prompt_file"}
EOF
  elif [[ -s "$tmp_envelope" ]]; then
    cat > "$output_file" <<EOF
{"type":"result","subtype":"error_exit","is_error":true,"exit_status":$status,"prompt_file":"$prompt_file","envelope_file":"not_persisted"}
EOF
  else
    cat > "$output_file" <<EOF
{"type":"result","subtype":"error_exit","is_error":true,"exit_status":$status,"prompt_file":"$prompt_file"}
EOF
  fi

  exit "$status"
fi
