#!/usr/bin/env bash
# Publish this project to GitHub and turn on its Pages site. Safe to run again.
# Run from the repository: bash scripts/setup-repo.sh   (needs git, gh and `gh auth login`)
#
# The repository is named once, below, and only that URL is used. No git remote is read,
# and every gh call names the repository explicitly.
set -euo pipefail

REPO_URL="https://github.com/cocodedk/tetris.git"

SLUG="${REPO_URL#https://github.com/}"
SLUG="${SLUG%.git}"
OWNER="${SLUG%%/*}"
NAME="${SLUG#*/}"
SITE_URL="https://${OWNER}.github.io/${NAME}/"
DESCRIPTION="Classic Tetris in the browser with neon visual effects. English and Persian. No build step."
TOPICS=(tetris game puzzle-game browser-game javascript html5-canvas github-pages)
CI_CHECK="test" # the job name in .github/workflows/ci.yml

step() { printf '\n==> %s\n' "$*"; }

cd "$(git rev-parse --show-toplevel)"

step "Checking tools"
command -v git >/dev/null || { echo "git is not installed" >&2; exit 1; }
command -v gh >/dev/null || { echo "gh is not installed: https://cli.github.com/" >&2; exit 1; }
gh auth status >/dev/null || { echo "Run 'gh auth login' first" >&2; exit 1; }
git rev-parse --verify --quiet refs/heads/main >/dev/null || { echo "No local main branch" >&2; exit 1; }

step "Installing git hooks"
bash scripts/install-hooks.sh

step "Repository $SLUG"
if gh repo view "$SLUG" >/dev/null 2>&1; then
  echo "exists"
else
  gh repo create "$SLUG" --public --description "$DESCRIPTION" --homepage "$SITE_URL"
fi
gh repo edit "$SLUG" --description "$DESCRIPTION" --homepage "$SITE_URL"
for topic in "${TOPICS[@]}"; do gh repo edit "$SLUG" --add-topic "$topic" >/dev/null; done
echo "description, homepage and topics set"

step "Pushing main to $REPO_URL"
local_sha="$(git rev-parse refs/heads/main)"
remote_sha="$(git ls-remote "$REPO_URL" refs/heads/main | cut -f1)"
if [ "$local_sha" = "$remote_sha" ]; then
  echo "main is already up to date"
elif [ -n "$remote_sha" ] && git fetch --quiet "$REPO_URL" main \
  && git merge-base --is-ancestor "$local_sha" FETCH_HEAD; then
  echo "remote main already contains local main (merged pull requests); nothing to push"
else
  git push "$REPO_URL" main:main
fi

step "Enabling GitHub Pages (build type: workflow)"
if gh api -X POST "repos/$SLUG/pages" -f build_type=workflow >/dev/null 2>&1; then
  echo "Pages enabled"
else
  gh api -X PUT "repos/$SLUG/pages" -f build_type=workflow >/dev/null
  echo "Pages already enabled; build type set to workflow"
fi
gh workflow run pages.yml -R "$SLUG" --ref main && echo "Pages deploy started"

step "Waiting for CI on $local_sha"
ci=""
for _ in $(seq 1 60); do
  ci="$(gh run list -R "$SLUG" --workflow ci.yml --commit "$local_sha" --limit 1 \
    --json status,conclusion --jq '.[0] | "\(.status) \(.conclusion)"' 2>/dev/null || true)"
  case "$ci" in completed*) break ;; esac
  sleep 10
done
echo "CI: ${ci:-no run found}"

if [[ "$ci" == completed* ]]; then
  step "Protecting main"
  gh api -X PUT "repos/$SLUG/branches/main/protection" --input - >/dev/null <<JSON
{
  "required_status_checks": { "strict": false, "contexts": ["$CI_CHECK"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
  echo "main requires a pull request (0 approvals) and the '$CI_CHECK' check; no force-push, no deletion"
else
  echo "CI has not finished yet; run this script again to protect main" >&2
fi

step "Done"
echo "Repository: https://github.com/$SLUG"
echo "Site:       $SITE_URL"
echo "Persian:    ${SITE_URL}fa/"
