#!/usr/bin/env python3
import os
import urllib.request
import subprocess

FRUITS_CLEAN_IMAGES = [
    # 01 - Manzana
    {
        "id": 1,
        "name": "Manzana",
        "url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=1280&q=85"
    },
    # 02 - Plátano
    {
        "id": 2,
        "name": "Plátano",
        "url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1280&q=85"
    },
    # 03 - Fresa
    {
        "id": 3,
        "name": "Fresa",
        "url": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1280&q=85"
    },
    # 04 - Naranja
    {
        "id": 4,
        "name": "Naranja",
        "url": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=1280&q=85"
    },
    # 05 - Limón
    {
        "id": 5,
        "name": "Limón",
        "url": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1280&q=85"
    },
    # 06 - Sandía
    {
        "id": 6,
        "name": "Sandía",
        "url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1280&q=85"
    },
    # 07 - Melón
    {
        "id": 7,
        "name": "Melón",
        "url": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=1280&q=85"
    },
    # 08 - Melocotón
    {
        "id": 8,
        "name": "Melocotón",
        "url": "https://images.unsplash.com/photo-1629828874514-c1e5103f2150?auto=format&fit=crop&w=1280&q=85"
    },
    # 09 - Piña
    {
        "id": 9,
        "name": "Piña",
        "url": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1280&q=85"
    },
    # 10 - Kiwi
    {
        "id": 10,
        "name": "Kiwi",
        "url": "https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=1280&q=85"
    },
    # 11 - Uva
    {
        "id": 11,
        "name": "Uva",
        "url": "https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=1280&q=85"
    },
    # 12 - Pera
    {
        "id": 12,
        "name": "Pera",
        "url": "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?auto=format&fit=crop&w=1280&q=85"
    },
    # 13 - Cereza
    {
        "id": 13,
        "name": "Cereza",
        "url": "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1280&q=85"
    },
    # 14 - Mango
    {
        "id": 14,
        "name": "Mango",
        "url": "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1280&q=85"
    },
    # 15 - Aguacate
    {
        "id": 15,
        "name": "Aguacate",
        "url": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1280&q=85"
    },
    # 16 - Papaya
    {
        "id": 16,
        "name": "Papaya",
        "url": "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=1280&q=85"
    },
    # 17 - Granada
    {
        "id": 17,
        "name": "Granada",
        "url": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1280&q=85"
    },
    # 18 - Higo
    {
        "id": 18,
        "name": "Higo",
        "url": "https://images.unsplash.com/photo-1601379327928-bedfaf9da2d0?auto=format&fit=crop&w=1280&q=85"
    },
    # 19 - Frambuesa
    {
        "id": 19,
        "name": "Frambuesa",
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/68/Three_Raspberries.jpg"
    },
    # 20 - Arándano
    {
        "id": 20,
        "name": "Arándano",
        "url": "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=1280&q=85"
    },
    # 21 - Mora
    {
        "id": 21,
        "name": "Mora",
        "url": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=1280&q=85"
    },
    # 22 - Coco
    {
        "id": 22,
        "name": "Coco",
        "url": "https://images.unsplash.com/photo-1544378730-8b5104b18790?auto=format&fit=crop&w=1280&q=85"
    },
    # 23 - Maracuyá
    {
        "id": 23,
        "name": "Maracuyá",
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Passionfruit_and_cross_section.jpg"
    },
    # 24 - Mandarina
    {
        "id": 24,
        "name": "Mandarina",
        "url": "https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=1280&q=85"
    },
    # 25 - Pomelo
    {
        "id": 25,
        "name": "Pomelo",
        "url": "https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=1280&q=85"
    },
    # 26 - Albaricoque
    {
        "id": 26,
        "name": "Albaricoque",
        "url": "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1280&q=85"
    },
    # 27 - Ciruela
    {
        "id": 27,
        "name": "Ciruela",
        "url": "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=1280&q=85"
    },
    # 28 - Guayaba
    {
        "id": 28,
        "name": "Guayaba",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Guava-Fruit.jpg"
    },
    # 29 - Pitahaya
    {
        "id": 29,
        "name": "Pitahaya",
        "url": "https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=1280&q=85"
    },
    # 30 - Caqui
    {
        "id": 30,
        "name": "Caqui",
        "url": "https://images.unsplash.com/photo-1574545488652-2a97d6b6c387?auto=format&fit=crop&w=1280&q=85"
    }
]

def main():
    target_dir = "/Users/ryuusei3/Downloads/the_floor/public/categories/frutas"
    os.makedirs(target_dir, exist_ok=True)
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

    for item in FRUITS_CLEAN_IMAGES:
        num = f"{item['id']:02d}"
        filename = f"frutas_{num}.jpg"
        out_path = os.path.join(target_dir, filename)
        tmp_path = os.path.join(target_dir, f"tmp_{filename}")
        
        print(f"Descargando [{num}] {item['name']}...")
        try:
            req = urllib.request.Request(item["url"], headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                with open(tmp_path, "wb") as f:
                    f.write(resp.read())
            
            # Convert and standardize to JPG
            subprocess.run(["sips", "-s", "format", "jpeg", tmp_path, "--out", out_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            print(f"  -> Guardado {filename} ({os.path.getsize(out_path)} bytes)")
        except Exception as e:
            print(f"  ❌ Error en {item['name']}: {e}")
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

if __name__ == "__main__":
    main()
