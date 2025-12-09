#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
DOCFOLDER="${ROOT}/documetation"

echo "Doc folder: ${DOCFOLDER}"
[ -d "${DOCFOLDER}" ] || (echo "Create documetation folder first" && exit 1)

for f in ${ROOT}/*.md; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  if [ "$base" = "README.md" ]; then
    echo "Skipping root README.md"
    continue
  fi
  target="${DOCFOLDER}/${base}"
  if [ ! -f "$target" ]; then
    echo "Moving $base -> documetation/"
    git mv "$f" "$target"
  else
    # compare
    if cmp -s "$f" "$target"; then
      echo "$base already exists in documetation and content is identical. Removing root file."
      git rm "$f"
    else
      echo "$base exists in documetation and differs. Moving root file to documetation/${base}.root.md"
      git mv "$f" "${DOCFOLDER}/${base}.root.md"
    fi
  fi
done

echo "Done moving files."
