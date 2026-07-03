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
diff_stat=$(git diff --stat || true)
untracked_files=$(git ls-files --others --exclude-standard)
diff_max_bytes=${SECOND_OPINION_DIFF_MAX_BYTES:-60000}
untracked_max_bytes=${SECOND_OPINION_UNTRACKED_MAX_BYTES:-20000}
head_commit=$(git log -1 --oneline || true)
beads_ready=$(bd ready 2>/dev/null || true)
diff_file=$(mktemp)
untracked_body_file=$(mktemp)

cleanup() {
  rm -f "$diff_file" "$untracked_body_file"
}

trap cleanup EXIT

git diff -- . \
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

You are reviewing a KRN implementation slice. Be strict, concrete, and evidence
driven. Do not praise the work. Find correctness risks, proof overclaims,
missing verification, stale docs, or cleanup that became speculative.

## Slice Objective

$slice_title

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

Return:
- verdict: approve | approve_with_fixes | block
- must_fix findings ordered by severity, with file/path evidence
- evidence gaps and exact verification requested
- false claims or overclaims in the slice report
- rejected suggestions if the current code already disproves them
- next bounded slice
- proof and non-proof boundary

Do not ask for broad rewrites unless the diff proves they are required.
EOF

printf '%s\n' "$output_file"
