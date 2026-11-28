#!/usr/bin/env bash
# Fails when any NuGet package, direct or transitive, has a known high or critical
# vulnerability (L2-031 #5). Run from backend/. Pass a saved report to check it instead.
set -euo pipefail

report="${1:-}"
if [[ -z "$report" ]]; then
  report="$(mktemp)"
  trap 'rm -f "$report"' EXIT
  dotnet list package --vulnerable --include-transitive --format json > "$report"
fi

found="$(jq -r '
  .projects[] | .path as $project
  | .frameworks[]? | (.topLevelPackages[]?, .transitivePackages[]?)
  | .id as $package | .resolvedVersion as $version
  | .vulnerabilities[]? | select(.severity == "High" or .severity == "Critical")
  | "\(.severity): \($package) \($version) in \($project | split("/") | last) (\(.advisoryurl))"
' "$report")"

if [[ -n "$found" ]]; then
  echo "Vulnerable packages, high or critical:" >&2
  echo "$found" >&2
  exit 1
fi

echo "No package has a high or critical vulnerability."
