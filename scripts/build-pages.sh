#!/usr/bin/env bash
# Monta o site do GitHub Pages com DUAS versões no mesmo artefato:
#   /humanity-tokens/          -> branch main (oficial)
#   /humanity-tokens/preview/  -> branch dev  (prévia)
# Uso: scripts/build-pages.sh <pasta-main> <pasta-dev> <saida>
set -euo pipefail
MAIN_DIR=$1; DEV_DIR=$2; OUT=$3
rm -rf "$OUT"; mkdir -p "$OUT/preview"

# Oficial: build do código da main sem alterar o repositório. Só garante (na cópia de build)
# que o service worker da oficial não capture as páginas da prévia.
( cd "$MAIN_DIR"
  if ! grep -q navigateFallbackDenylist vite.config.ts; then
    sed -i 's#^\(\s*\)navigateFallback: \(.*\),#&\n\1navigateFallbackDenylist: [/\\/preview\\//],#' vite.config.ts
    grep -q navigateFallbackDenylist vite.config.ts || { echo "falha ao proteger /preview/"; exit 1; }
  fi
  npm run build )
cp -r "$MAIN_DIR/dist/." "$OUT/"

# Prévia: mesmo projeto com base própria (manifest, scope e service worker em /preview/).
( cd "$DEV_DIR" && VITE_BASE=/humanity-tokens/preview/ npx vite build --outDir dist-preview )
cp -r "$DEV_DIR/dist-preview/." "$OUT/preview/"
echo "Site montado em $OUT"
