#!/bin/bash
# 部署婚礼网站到 Cloudflare Pages。
# 用法:
#   ./deploy.sh          部署到正式站 hector-yui-wedding.com
#   ./deploy.sh preview  部署到预览网址 preview.hector-yui-wedding.pages.dev
# 需要: 已 `wrangler login`；npm 全局装了 wrangler。
set -e
cd "$(dirname "$0")"
BRANCH="${1:-main}"

echo "==> 组装 dist（只放 index.html + assets，排除 og-card / 部署说明 等）"
rm -rf dist && mkdir -p dist
cp index.html dist/index.html
cp -R assets dist/assets
find dist -name '.DS_Store' -delete

echo "==> 部署到 Cloudflare Pages（分支 $BRANCH）"
wrangler pages deploy --branch="$BRANCH" --commit-dirty=true

echo "==> 完成。正式站: https://hector-yui-wedding.com"
echo "    查看 RSVP 名单: https://hector-yui-wedding.com/api/rsvp-list?token=hyui--TRM70TP6Aa0"
