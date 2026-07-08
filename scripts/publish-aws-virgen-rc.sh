#!/usr/bin/env bash
# Publish aws-virgen from the primary monorepo (owner credentials required).
# Cloud agents cannot push to aws-virgen (403). Run on Replit or your machine.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git remote get-url origin &>/dev/null; then
  echo "Run from the BANCO monorepo root." >&2
  exit 1
fi

ORIGIN_URL="$(git remote get-url origin)"
VIRGEN_URL="$(echo "$ORIGIN_URL" | sed 's|-BANCO-CA-OOM-|aws-virgen|')"

git fetch origin main
SHA="$(git rev-parse origin/main)"
TAG="${1:-v1.0.0-rc.1}"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "[aws-virgen] clone $VIRGEN_URL"
git clone "$VIRGEN_URL" "$WORKDIR/repo"
cd "$WORKDIR/repo"

git remote add banco "$ORIGIN_URL"
git fetch banco main

echo "[aws-virgen] merge banco/main ($SHA)"
git merge banco/main -m "chore(release): sync production main ($TAG) into aws-virgen"

if [[ -f .github/workflows/deploy.yml ]]; then
  cp "$ROOT/.github/workflows/deploy.yml" .github/workflows/deploy.yml
  git add .github/workflows/deploy.yml
  git diff --cached --quiet || git commit -m "chore(ci): align deploy workflow with primary monorepo"
fi

git tag -a "$TAG" -m "BANCO Store release candidate ($TAG)" 2>/dev/null || git tag -f -a "$TAG" -m "BANCO Store release candidate ($TAG)"

echo "[aws-virgen] push main + tag $TAG"
git push origin main
git push origin "$TAG"

echo "[aws-virgen] done at $(git rev-parse HEAD)"
