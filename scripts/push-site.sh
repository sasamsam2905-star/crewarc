#!/bin/bash
# Rebuild site -> push main + gh-pages (GitHub Pages + Vercel import stay in sync)
set -e
cd "$(dirname "$0")/.."
node website/build.js
cp website/index.html index.html
git add index.html website/index.html
git commit -m "site rebuild" || exit 0
git push https://x-access-token:"$GH_TOKEN"@github.com/sasamsam2905-star/crewarc.git main
git checkout -q gh-pages && cp website/index.html index.html && git add index.html && git commit -m "pages" && git push https://x-access-token:"$GH_TOKEN"@github.com/sasamsam2905-star/crewarc.git gh-pages && git checkout -q main
