#!/usr/bin/env python3
import os
import urllib.request
import subprocess
import time

VERIFIED_FRUITS = [
    # 01 - Manzana
    {"id": 1, "name": "Manzana", "url": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Wet_apple_isolated_on_white.jpg"},
    # 02 - Plátano
    {"id": 2, "name": "Plátano", "url": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg"},
    # 03 - Fresa
    {"id": 3, "name": "Fresa", "url": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Strawberry.jpg"},
    # 04 - Naranja
    {"id": 4, "name": "Naranja", "url": "https://upload.wikimedia.org/wikipedia/commons/c/c4/Orange-Fruit-Pieces.jpg"},
    # 05 - Limón
    {"id": 5, "name": "Limón", "url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Lemon.jpg"},
    # 06 - Sandía
    {"id": 6, "name": "Sandía", "url": "https://upload.wikimedia.org/wikipedia/commons/4/40/Watermelon_slice.jpg"},
    # 07 - Melón
    {"id": 7, "name": "Melón", "url": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Canteloupe_and_cross_section.jpg"},
    # 08 - Melocotón
    {"id": 8, "name": "Melocotón", "url": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Autumn_Red_peaches.jpg"},
    # 09 - Piña
    {"id": 9, "name": "Piña", "url": "https://upload.wikimedia.org/wikipedia/commons/c/cb/Pineapple_and_cross_section.jpg"},
    # 10 - Kiwi
    {"id": 10, "name": "Kiwi", "url": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Kiwi_%28Actinidia_chinensis%29_1_Luc_Viatour.jpg"},
    # 11 - Uva
    {"id": 11, "name": "Uva", "url": "https://upload.wikimedia.org/wikipedia/commons/b/bb/Table_grapes_on_white.jpg"},
    # 12 - Pera
    {"id": 12, "name": "Pera", "url": "https://upload.wikimedia.org/wikipedia/commons/9/99/Four_pears.jpg"},
    # 13 - Cereza
    {"id": 13, "name": "Cereza", "url": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Cherries.jpg"},
    # 14 - Mango
    {"id": 14, "name": "Mango", "url": "https://upload.wikimedia.org/wikipedia/commons/6/64/Mango_fruit.jpg"},
    # 15 - Aguacate
    {"id": 15, "name": "Aguacate", "url": "https://upload.wikimedia.org/wikipedia/commons/5/5d/Avocado_with_cross_section_edit.jpg"},
    # 16 - Papaya
    {"id": 16, "name": "Papaya", "url": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Papaya_cross_section_BNC.jpg"},
    # 17 - Granada
    {"id": 17, "name": "Granada", "url": "https://upload.wikimedia.org/wikipedia/commons/9/9b/Pomegranate02_edit.jpg"},
    # 18 - Higo
    {"id": 18, "name": "Higo", "url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Common_fig.jpg"},
    # 19 - Frambuesa
    {"id": 19, "name": "Frambuesa", "url": "https://upload.wikimedia.org/wikipedia/commons/6/68/Three_Raspberries.jpg"},
    # 20 - Arándano
    {"id": 20, "name": "Arándano", "url": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Dish_of_blueberries.jpg"},
    # 21 - Mora
    {"id": 21, "name": "Mora", "url": "https://upload.wikimedia.org/wikipedia/commons/5/5d/Blackberries.jpg"},
    # 22 - Coco
    {"id": 22, "name": "Coco", "url": "https://upload.wikimedia.org/wikipedia/commons/5/5d/Coconut_on_white_background_TEINTE.jpg"},
    # 23 - Maracuyá
    {"id": 23, "name": "Maracuyá", "url": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Passionfruit_and_cross_section.jpg"},
    # 24 - Mandarina
    {"id": 24, "name": "Mandarina", "url": "https://upload.wikimedia.org/wikipedia/commons/4/49/Mandarin_Oranges_%28Citrus_Reticulata%29.jpg"},
    # 25 - Pomelo
    {"id": 25, "name": "Pomelo", "url": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Grapefruit_and_cross_section_edit.jpg"},
    # 26 - Albaricoque
    {"id": 26, "name": "Albaricoque", "url": "https://upload.wikimedia.org/wikipedia/commons/0/08/Owoce_Morela.jpg"},
    # 27 - Ciruela
    {"id": 27, "name": "Ciruela", "url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Plums.jpg"},
    # 28 - Guayaba
    {"id": 28, "name": "Guayaba", "url": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Guava-Fruit.jpg"},
    # 29 - Pitahaya
    {"id": 29, "name": "Pitahaya", "url": "https://upload.wikimedia.org/wikipedia/commons/4/43/Pitaya_cross_section_ed2.jpg"},
    # 30 - Caqui
    {"id": 30, "name": "Caqui", "url": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Fuyu_Persimmon_%28Diospyros_Kaki%29.jpg"}
]

def main():
    target_dir = "/Users/ryuusei3/Downloads/the_floor/public/categories/frutas"
    os.makedirs(target_dir, exist_ok=True)
    headers = {"User-Agent": "TheFloorBotVerifiedEdu/4.0 (contact@thefloor.app)"}

    for item in VERIFIED_FRUITS:
        num = f"{item['id']:02d}"
        filename = f"frutas_{num}.jpg"
        out_path = os.path.join(target_dir, filename)
        tmp_path = os.path.join(target_dir, f"tmp_{filename}")
        
        print(f"Descargando [{num}] {item['name']}...")
        success = False
        for attempt in range(3):
            try:
                time.sleep(0.5)
                req = urllib.request.Request(item["url"], headers=headers)
                with urllib.request.urlopen(req, timeout=15) as resp:
                    with open(tmp_path, "wb") as f:
                        f.write(resp.read())
                
                # Convert and standardize to JPG
                subprocess.run(["sips", "-s", "format", "jpeg", tmp_path, "--out", out_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                print(f"  -> Guardado {filename} ({os.path.getsize(out_path)} bytes)")
                success = True
                break
            except Exception as e:
                print(f"  ⚠️ Reintentando {item['name']} (intento {attempt+1}): {e}")
                time.sleep(1.5)
        
        if not success:
            print(f"  ❌ Falló descarga de {item['name']}")

if __name__ == "__main__":
    main()
