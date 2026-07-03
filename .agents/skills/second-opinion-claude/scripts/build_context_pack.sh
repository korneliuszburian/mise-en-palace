#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: build_context_pack.sh <slice-title> <output-prompt.md>" >&2
  exit 64
fi

slice_title=$1
output_file=$2
output_dir=$(dirname "$output_file")

mkdir -p "$output_dir"

status=$(git status --short --branch)
diff_stat=$(git diff HEAD --stat -- \
  ":(exclude).beads/**" \
  ":(exclude).local-lab/**" \
  ":(exclude)docs/materials/**" || true)
untracked_files=$(git ls-files --others --exclude-standard)
diff_max_bytes=${SECOND_OPINION_DIFF_MAX_BYTES:-60000}
untracked_max_bytes=${SECOND_OPINION_UNTRACKED_MAX_BYTES:-20000}
prompt_max_bytes=${SECOND_OPINION_PROMPT_MAX_BYTES:-120000}
acceptance_criteria=${SECOND_OPINION_ACCEPTANCE_CRITERIA:-"not provided; flag as an evidence gap if this prevents review"}
verification_evidence=${SECOND_OPINION_VERIFICATION_EVIDENCE:-"not provided; request exact verification if needed"}
head_commit=$(git log -1 --oneline || true)
if command -v bd >/dev/null 2>&1; then
  beads_err=$(mktemp)
  beads_ready=$(bd ready 2>"$beads_err" || true)
  if [[ -z "$beads_ready" && -s "$beads_err" ]]; then
    beads_ready="Beads snapshot unavailable: $(head -1 "$beads_err")"
  fi
  rm -f "$beads_err"
else
  beads_ready="Beads snapshot unavailable: bd CLI not found on PATH"
fi
diff_file=$(mktemp)
untracked_body_file=$(mktemp)

cleanup() {
  rm -f "$diff_file" "$untracked_body_file"
}

trap cleanup EXIT

is_denied_untracked_path() {
  local file=$1
  local base
  base=$(basename "$file")

  case "$file" in
    .env|.env.*|*/.env|*/.env.*|secrets/*|*/secrets/*|*.key|*.pem|*.p12|*id_rsa*)
      return 0
      ;;
  esac

  case "$base" in
    id_rsa|id_rsa.*)
      return 0
      ;;
  esac

  return 1
}

git diff HEAD -- . \
  ":(exclude).beads/**" \
  ":(exclude).local-lab/**" \
  ":(exclude)docs/materials/**" \
  > "$diff_file" || true

diff_bytes=$(wc -c < "$diff_file" | tr -d " ")

if (( diff_bytes > diff_max_bytes )); then
  {
    printf 'Diff capped at %s of %s bytes. Rebuild with SECOND_OPINION_DIFF_MAX_BYTES if needed.\n' \
      "$diff_max_bytes" "$diff_bytes"
    head -c "$diff_max_bytes" "$diff_file"
  } > "${diff_file}.capped"
  mv "${diff_file}.capped" "$diff_file"
fi

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  [[ "$file" == .local-lab/* ]] && continue
  [[ "$file" == .beads/* ]] && continue

  if [[ ! -f "$file" ]]; then
    continue
  fi

  if is_denied_untracked_path "$file"; then
    {
      printf '\n### %s\n\n' "$file"
      printf 'File omitted: path matches second-opinion secret denylist.\n'
    } >> "$untracked_body_file"
    continue
  fi

  file_bytes=$(wc -c < "$file" | tr -d " ")

  {
    printf '\n### %s\n\n' "$file"

    if (( file_bytes > untracked_max_bytes )); then
      printf 'File omitted: %s bytes exceeds SECOND_OPINION_UNTRACKED_MAX_BYTES=%s.\n' \
        "$file_bytes" "$untracked_max_bytes"
      continue
    fi

    if ! LC_ALL=C grep -Iq . "$file"; then
      printf 'File omitted: binary or non-text content.\n'
      continue
    fi

    printf '```txt\n'
    sed -n '1,400p' "$file"
    printf '\n```\n'
  } >> "$untracked_body_file"
done <<< "$untracked_files"

cat > "$output_file" <<EOF
# KRN Second Opinion Context Pack

You are a governed, read-only reviewer for a KRN implementation slice.

Try to FALSIFY "done". Do not praise the work. Do not rewrite the solution.
Find correctness risks, proof overclaims, missing verification, stale docs, or
cleanup that became speculative. Use only the context below. Do not ask for
tools, repository access, or broad rereads.

Return JSON only. No prose, no Markdown, no code fences.

Required verdict shape:

\`\`\`json
{
  "review_version": "1",
  "verdict": "approve | approve_with_fixes | block",
  "risk_class": "LOW | MEDIUM | HIGH | CRITICAL",
  "diff_sha256": "validator injects this; return an empty string",
  "summary": "<=300 chars",
  "findings": [
    {
      "id": "F1",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "evidence_ref": "file:line | test | missing-test:x | log:line | fn()",
      "reason": "...",
      "minimal_fix": "..."
    }
  ],
  "evidence_gaps": [
    {
      "what": "...",
      "verification_requested": "..."
    }
  ],
  "another_loop_required": false,
  "non_blocking_notes": [
    {
      "note": "...",
      "why_non_blocking": "..."
    }
  ]
}
\`\`\`

Rules:
- Every finding must have a non-empty evidence_ref.
- approve requires findings=[].
- approve_with_fixes requires at least one finding.
- block requires findings or evidence_gaps and another_loop_required=true.
- If acceptance criteria or verification evidence is missing, put it in evidence_gaps.
- Prefer minimal fixes over broad rewrites.

## Slice Objective

$slice_title

## Acceptance Criteria

\`\`\`txt
$acceptance_criteria
\`\`\`

## Verification Evidence Already Run

\`\`\`txt
$verification_evidence
\`\`\`

## Repo State

\`\`\`txt
$status
\`\`\`

## Head Commit

\`\`\`txt
$head_commit
\`\`\`

## Diff Stat

\`\`\`txt
$diff_stat
\`\`\`

## Capped Git Diff

\`\`\`diff
$(cat "$diff_file")
\`\`\`

## Untracked Files

\`\`\`txt
$untracked_files
\`\`\`

## Untracked File Bodies

$(cat "$untracked_body_file")

## Ready Beads Snapshot

\`\`\`txt
$beads_ready
\`\`\`

## Reviewer Task

Return the governed verdict JSON only.
EOF

prompt_bytes=$(wc -c < "$output_file" | tr -d " ")
if (( prompt_bytes > prompt_max_bytes )); then
  {
    head -c "$(( prompt_max_bytes - 1024 ))" "$output_file"
    printf '\n\n## Prompt Size Cap\n\nContext pack exceeded SECOND_OPINION_PROMPT_MAX_BYTES=%s and was truncated. Treat the diff/untracked sections as possibly incomplete and flag as an evidence gap if the missing tail is load-bearing. Narrow the slice or raise the cap and rebuild.\n' \
      "$prompt_max_bytes"
  } > "${output_file}.capped"
  mv "${output_file}.capped" "$output_file"
  prompt_bytes=$(wc -c < "$output_file" | tr -d " ")
fi

printf '%s bytes -> %s\n' "$prompt_bytes" "$output_file"
