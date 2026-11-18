#!/bin/bash
# Genera miniaturas ligeras para el mando del juez (public/categories/<cat>/thumbs/).
# Uso: ./scripts/generate_thumbs.sh   (solo regenera las que falten o estén desactualizadas)
set -euo pipefail
cd "$(dirname "$0")/../public/categories"

MAX_SIZE=320
QUALITY=65
count=0

for dir in */; do
  cat="${dir%/}"
  mkdir -p "$cat/thumbs"
  for img in "$cat"/*.jpg "$cat"/*.jpeg "$cat"/*.png; do
    [ -f "$img" ] || continue
    name="$(basename "$img")"
    out="$cat/thumbs/${name%.*}.jpg"
    if [ ! -f "$out" ] || [ "$img" -nt "$out" ]; then
      sips -Z "$MAX_SIZE" -s format jpeg -s formatOptions "$QUALITY" "$img" --out "$out" >/dev/null 2>&1 \
        && count=$((count + 1)) || echo "Error con $img"
    fi
  done
done

echo "Miniaturas generadas: $count"
