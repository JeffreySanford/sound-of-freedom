#!/usr/bin/env bash
set -euo pipefail

DOC_FOLDER="documetation"
README="README.md"

if [ ! -f "$README" ]; then
  echo "No root README.md found."
  exit 1
fi

echo "Updating links in $README to reference $DOC_FOLDER/... for docs moved into documentation folder"

for f in ${DOC_FOLDER}/*.md; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  # If README contains (base) but not (documetation/base), replace
  if grep -q "(${base})" "$README" && ! grep -q "(${DOC_FOLDER}/${base})" "$README"; then
    sed -i.bak "s|(${base})|(${DOC_FOLDER}/${base})|g" "$README"
    echo "Updated links for ${base}"
  fi
done

echo "Done updating README.md (backup saved as README.md.bak). Please review and commit changes."
