#!/bin/bash
# Reduce las imágenes de categorías demasiado grandes para la TV (lado mayor > MAX_SIZE).
# Solo sustituye el archivo si el resultado pesa menos. Las miniaturas del mando se generan
# aparte con ./scripts/generate_thumbs.sh
# Uso: ./scripts/optimize_images.sh
set -euo pipefail
cd "$(dirname "$0")/../public/categories"

MAX_SIZE=1600
QUALITY=80
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

optimized=0
saved=0

for img in */*.jpg */*.jpeg */*.png; do
  [ -f "$img" ] || continue
  dims=$(sips -g pixelWidth -g pixelHeight "$img" 2>/dev/null | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print (w>h?w:h)}')
  [ -n "$dims" ] && [ "$dims" -gt "$MAX_SIZE" ] || continue

  out="$tmp/$(basename "$img")"
  # Mantener el formato original para no romper las rutas de los JSON
  if sips -Z "$MAX_SIZE" -s formatOptions "$QUALITY" "$img" --out "$out" >/dev/null 2>&1; then
    before=$(stat -f%z "$img")
    after=$(stat -f%z "$out")
    if [ "$after" -lt "$before" ]; then
      mv "$out" "$img"
      optimized=$((optimized + 1))
      saved=$((saved + before - after))
    fi
  else
    echo "Error con $img"
  fi
done

echo "Imágenes reducidas: $optimized · Ahorro: $((saved / 1048576)) MB"
