#!/usr/bin/env bash
set -euo pipefail

CURRENT_VERSION="1.0.0"

if [ $# -ge 1 ]; then
    NEW_VERSION="$1"
else
    echo "Current version: $CURRENT_VERSION"
    read -rp "New version: " NEW_VERSION
fi

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in semver format (e.g. 1.0.1)"
    exit 1
fi

TAG="v$NEW_VERSION"

if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "Error: Tag $TAG already exists"
    exit 1
fi

echo "Releasing $TAG ..."

# Update version in package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update CURRENT_VERSION in this script for next time
sed -i '' "s/^CURRENT_VERSION=\".*\"/CURRENT_VERSION=\"$NEW_VERSION\"/" release.sh

# Stage, commit, tag, push
git add package.json release.sh
git commit -m "release: $TAG"
git tag -a "$TAG" -m "Release $TAG"
git push origin HEAD
git push origin "$TAG"

echo ""
echo "Released $TAG successfully."
