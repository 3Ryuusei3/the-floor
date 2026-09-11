#!/usr/bin/env python3
import os
import sys
import json
import time
import random
import urllib.request
import urllib.parse
import subprocess
import concurrent.futures

CATEGORIES_DATA = {
    "meteorologia": {
        "name": "Meteorología",
        "description": "Fenómenos meteorológicos, nubes, tempestades e instrumentos del clima",
        "icon": "⚡",
        "items": [
            {"id": 1, "name": "Tornado", "aliases": ["Tornado", "Tornados", "Torbellino"], "query": "Tornado Oklahoma May 3 1999"},
            {"id": 2, "name": "Arcoíris", "aliases": ["Arcoíris", "Arcoiris", "Arco iris", "Rainbow"], "query": "Rainbow nature landscape"},
            {"id": 3, "name": "Aurora boreal", "aliases": ["Aurora boreal", "Auroras boreales", "Luces del norte", "Northern lights", "Aurora"], "query": "Aurora borealis Norway Tromso"},
            {"id": 4, "name": "Rayo", "aliases": ["Rayo", "Rayos", "Relámpago", "Relampago", "Relámpagos", "Relampagos"], "query": "Lightning bolt strike thunderstorm"},
            {"id": 5, "name": "Nieve", "aliases": ["Nieve", "Copo de nieve", "Copos de nieve", "Nevada"], "query": "Snow snowflake macro winter"},
            {"id": 6, "name": "Granizo", "aliases": ["Granizo", "Granizada", "Pedrisco"], "query": "Hailstones hail weather"},
            {"id": 7, "name": "Lluvia", "aliases": ["Lluvia", "Lluvias", "Chubasco", "Precipitación", "Precipitacion"], "query": "Rain shower raindrops street"},
            {"id": 8, "name": "Niebla", "aliases": ["Niebla", "Neblina", "Bruma", "Brumas"], "query": "Fog morning forest mist"},
            {"id": 9, "name": "Huracán", "aliases": ["Huracán", "Huracan", "Ciclón", "Ciclon", "Tifón", "Tifon"], "query": "Hurricane satellite view storm"},
            {"id": 10, "name": "Cumulonimbo", "aliases": ["Cumulonimbo", "Cumulonimbos", "Cumulonimbus", "Nube de tormenta"], "query": "Cumulonimbus cloud formation"},
            {"id": 11, "name": "Escarcha", "aliases": ["Escarcha", "Helada", "Cencellada", "Frost"], "query": "Frost frostwork leaves ice"},
            {"id": 12, "name": "Tromba marina", "aliases": ["Tromba marina", "Manga de agua", "Tromba", "Waterspout"], "query": "Waterspout over ocean sea"},
            {"id": 13, "name": "Tormenta de arena", "aliases": ["Tormenta de arena", "Haboob", "Tormenta de polvo"], "query": "Dust storm sandstorm desert"},
            {"id": 14, "name": "Halo solar", "aliases": ["Halo solar", "Halo", "Antelia", "Sun halo 22 degree"], "query": "22 degree halo sun optical phenomenon"},
            {"id": 15, "name": "Rocío", "aliases": ["Rocío", "Rocio", "Gotas de rocío", "Dew"], "query": "Morning dew drops leaf grass"},
            {"id": 16, "name": "Nube lenticular", "aliases": ["Nube lenticular", "Nubes lenticulares", "Altocumulus lenticularis"], "query": "Lenticular clouds mountain sky"},
            {"id": 17, "name": "Ocaso", "aliases": ["Ocaso", "Puesta de sol", "Atardecer", "Crepúsculo", "Crepusculo"], "query": "Sunset golden hour colorful sky"},
            {"id": 18, "name": "Nube mammatus", "aliases": ["Mammatus", "Nube mammatus", "Nubes mammatus", "Mamma"], "query": "Mammatus clouds sunset sky"},
            {"id": 19, "name": "Calima", "aliases": ["Calima", "Polvo en suspensión", "Calina"], "query": "Haze dust suspension atmospheric"},
            {"id": 20, "name": "Sequía", "aliases": ["Sequía", "Sequia", "Tierra agrietada"], "query": "Drought cracked earth soil"},
            {"id": 21, "name": "Cirro", "aliases": ["Cirro", "Cirros", "Cirrus", "Nube cirro"], "query": "Cirrus clouds blue sky wispy"},
            {"id": 22, "name": "Ola de calor", "aliases": ["Ola de calor", "Bochorno", "Canícula", "Canicula"], "query": "Mirage heat haze road summer"},
            {"id": 23, "name": "Torbellino de fuego", "aliases": ["Torbellino de fuego", "Remolino de fuego", "Fire whirl", "Fire tornado"], "query": "Fire whirl fire tornado wildfire"},
            {"id": 24, "name": "Cencellada", "aliases": ["Cencellada", "Cencellada blanca", "Rime ice"], "query": "Soft rime ice trees winter"},
            {"id": 25, "name": "Barómetro", "aliases": ["Barómetro", "Barometro", "Barógrafo"], "query": "Aneroid barometer instrument dial antique"},
            {"id": 26, "name": "Anemómetro", "aliases": ["Anemómetro", "Anemometro", "Medidor de viento"], "query": "Cup anemometer weather station"},
            {"id": 27, "name": "Manga de viento", "aliases": ["Manga de viento", "Cono de viento", "Anemoscopio", "Windsock"], "query": "Windsock airport runway wind direction"},
            {"id": 28, "name": "Pluviómetro", "aliases": ["Pluviómetro", "Pluviometro"], "query": "Rain gauge rain gauge cylinder weather"},
            {"id": 29, "name": "Veleta", "aliases": ["Veleta", "Veleta de viento", "Gallo de veleta"], "query": "Weather vane rooster roof compass"},
            {"id": 30, "name": "Termómetro", "aliases": ["Termómetro", "Termometro", "Termómetro ambiental"], "query": "Outdoor thermometer mercury celsius temperature"}
        ]
    },
    "senales_trafico": {
        "name": "Señales de Tráfico",
        "description": "Identifica las señales viales de peligro, prohibición, obligación e indicación",
        "icon": "🛑",
        "items": [
            {"id": 1, "name": "Stop", "aliases": ["Stop", "Alto", "Parada", "Detención obligatoria"], "query": "Stop sign octagonal traffic"},
            {"id": 2, "name": "Ceda el paso", "aliases": ["Ceda el paso", "Ceda", "Ceder el paso", "Yield"], "query": "Yield sign inverted triangle traffic"},
            {"id": 3, "name": "Prohibido el paso", "aliases": ["Prohibido el paso", "Dirección prohibida", "Sentido prohibido", "Entrada prohibida"], "query": "No entry traffic sign red circle white bar"},
            {"id": 4, "name": "Paso de peatones", "aliases": ["Paso de peatones", "Paso de cebra", "Paso peatonal", "Peatones"], "query": "Pedestrian crossing traffic sign blue square"},
            {"id": 5, "name": "Límite de velocidad", "aliases": ["Límite de velocidad", "Velocidad máxima", "Velocidad maxima", "Limite de velocidad"], "query": "Speed limit sign 50 red circle"},
            {"id": 6, "name": "Sentido obligatorio", "aliases": ["Sentido obligatorio", "Dirección obligatoria", "Direccion obligatoria", "Giro obligatorio"], "query": "Mandatory straight arrow blue traffic sign"},
            {"id": 7, "name": "Prohibido estacionar", "aliases": ["Prohibido estacionar", "Prohibido aparcar", "Estacionamiento prohibido", "No aparcar"], "query": "No parking sign red circle diagonal blue"},
            {"id": 8, "name": "Glorieta", "aliases": ["Glorieta", "Rotonda", "Intersección de sentido giratorio", "Plaza circular"], "query": "Roundabout traffic sign blue arrows"},
            {"id": 9, "name": "Prohibido adelantar", "aliases": ["Prohibido adelantar", "Adelantamiento prohibido", "No adelantar"], "query": "No overtaking sign cars red black"},
            {"id": 10, "name": "Obras", "aliases": ["Obras", "Zona de obras", "Peligro obras", "Trabajos en la vía"], "query": "Road work sign worker digging warning"},
            {"id": 11, "name": "Curva peligrosa", "aliases": ["Curva peligrosa", "Curva a la derecha", "Curva a la izquierda", "Curva"], "query": "Dangerous curve road sign warning triangle"},
            {"id": 12, "name": "Paso de animales", "aliases": ["Paso de animales", "Animales sueltos", "Peligro animales", "Paso de ciervos"], "query": "Deer crossing warning road sign triangle"},
            {"id": 13, "name": "Zona escolar", "aliases": ["Zona escolar", "Peligro niños", "Colegio", "Paso escolar"], "query": "Children crossing road sign warning triangle"},
            {"id": 14, "name": "Estrechamiento de calzada", "aliases": ["Estrechamiento de calzada", "Estrechamiento", "Calzada estrecha"], "query": "Road narrows warning sign triangle"},
            {"id": 15, "name": "Pavimento deslizante", "aliases": ["Pavimento deslizante", "Calzada deslizante", "Peligro resbaladizo", "Suelo resbaladizo"], "query": "Slippery road warning sign car skidding"},
            {"id": 16, "name": "Paso a nivel", "aliases": ["Paso a nivel", "Paso a nivel con barreras", "Paso de tren", "Ferrocarril"], "query": "Level crossing with barrier warning sign"},
            {"id": 17, "name": "Paso de ciclistas", "aliases": ["Paso de ciclistas", "Ciclistas", "Carril bici", "Vía ciclista"], "query": "Bicycle warning road sign triangle"},
            {"id": 18, "name": "Calzada con prioridad", "aliases": ["Calzada con prioridad", "Prioridad", "Vía prioritaria"], "query": "Priority road sign yellow diamond"},
            {"id": 19, "name": "Prohibido el giro en U", "aliases": ["Prohibido el giro en U", "Prohibido cambio de sentido", "Cambio de sentido prohibido", "No U turn"], "query": "No U-turn traffic sign red circle slash"},
            {"id": 20, "name": "Calle sin salida", "aliases": ["Calle sin salida", "Calle cortada", "Sin salida", "Cul-de-sac"], "query": "Dead end road sign no through road blue square"},
            {"id": 21, "name": "Autopista", "aliases": ["Autopista", "Autovía", "Autovia", "Comienzo de autopista"], "query": "Motorway traffic sign highway blue symbol"},
            {"id": 22, "name": "Semáforo", "aliases": ["Semáforo", "Semaforo", "Peligro semáforo", "Peligro semáforos"], "query": "Traffic light warning road sign triangle"},
            {"id": 23, "name": "Gasolinera", "aliases": ["Gasolinera", "Estación de servicio", "Combustible", "Surtidor"], "query": "Gas station road sign fuel pump symbol"},
            {"id": 24, "name": "Hospital", "aliases": ["Hospital", "Puesto de primeros auxilios", "Cruz roja"], "query": "Hospital traffic sign blue H bed symbol"},
            {"id": 25, "name": "Estacionamiento", "aliases": ["Estacionamiento", "Parking", "Aparcamiento", "Zona de aparcamiento"], "query": "Parking sign blue square white P"},
            {"id": 26, "name": "Fin de prohibición", "aliases": ["Fin de prohibición", "Fin de prohibiciones", "Fin de límite", "Desrestricción"], "query": "End of all restrictions traffic sign circle grey lines"},
            {"id": 27, "name": "Túnel", "aliases": ["Túnel", "Tunel", "Peligro túnel"], "query": "Tunnel road sign warning entry"},
            {"id": 28, "name": "Viento transversal", "aliases": ["Viento transversal", "Peligro viento", "Viento lateral"], "query": "Side winds warning road sign windsock triangle"},
            {"id": 29, "name": "Desprendimientos", "aliases": ["Desprendimientos", "Caída de piedras", "Peligro desprendimiento"], "query": "Falling rocks road sign warning triangle"},
            {"id": 30, "name": "Resalto", "aliases": ["Resalto", "Badén", "Baden", "Bache", "Resalto en la vía"], "query": "Speed bump road sign warning hump triangle"}
        ]
    },
    "marcas_coches": {
        "name": "Marcas de Coches",
        "description": "Reconoce los emblemas y logotipos icónicos de fabricantes de automóviles",
        "icon": "🏎️",
        "items": [
            {"id": 1, "name": "Ferrari", "aliases": ["Ferrari", "Cavallino Rampante", "Scuderia Ferrari"], "query": "Ferrari prancing horse logo emblem badge"},
            {"id": 2, "name": "Mercedes-Benz", "aliases": ["Mercedes", "Mercedes-Benz", "Mercedes Benz", "Daimler"], "query": "Mercedes Benz three pointed star hood ornament emblem"},
            {"id": 3, "name": "BMW", "aliases": ["BMW", "Bayerische Motoren Werke"], "query": "BMW roundel badge car emblem blue white"},
            {"id": 4, "name": "Audi", "aliases": ["Audi", "Cuatro Aros", "Auto Union"], "query": "Audi four rings emblem car grille badge"},
            {"id": 5, "name": "Porsche", "aliases": ["Porsche", "Escudo Porsche"], "query": "Porsche crest emblem car badge Stuttgart horse"},
            {"id": 6, "name": "Lamborghini", "aliases": ["Lamborghini", "Automobili Lamborghini"], "query": "Lamborghini raging bull emblem badge gold"},
            {"id": 7, "name": "Toyota", "aliases": ["Toyota", "Toyota Motor"], "query": "Toyota emblem badge car chrome oval"},
            {"id": 8, "name": "Volkswagen", "aliases": ["Volkswagen", "VW"], "query": "Volkswagen emblem badge chrome VW circle"},
            {"id": 9, "name": "Ford", "aliases": ["Ford", "Ford Motor Company", "Óvalo azul"], "query": "Ford blue oval emblem car badge"},
            {"id": 10, "name": "Renault", "aliases": ["Renault", "Rombo Renault"], "query": "Renault diamond logo emblem chrome badge"},
            {"id": 11, "name": "Peugeot", "aliases": ["Peugeot", "León Peugeot"], "query": "Peugeot lion badge emblem car"},
            {"id": 12, "name": "Chevrolet", "aliases": ["Chevrolet", "Chevy", "Pajarita Chevrolet"], "query": "Chevrolet bowtie emblem gold car badge"},
            {"id": 13, "name": "Hyundai", "aliases": ["Hyundai", "Hyundai Motor"], "query": "Hyundai slanted H logo emblem car"},
            {"id": 14, "name": "Honda", "aliases": ["Honda", "Honda Motor"], "query": "Honda H badge car chrome emblem"},
            {"id": 15, "name": "Nissan", "aliases": ["Nissan", "Nissan Motor", "Datsun"], "query": "Nissan logo emblem car chrome circle"},
            {"id": 16, "name": "Tesla", "aliases": ["Tesla", "Tesla Motors"], "query": "Tesla T logo car badge emblem chrome"},
            {"id": 17, "name": "Aston Martin", "aliases": ["Aston Martin"], "query": "Aston Martin winged emblem car badge"},
            {"id": 18, "name": "Alfa Romeo", "aliases": ["Alfa Romeo", "Alfa"], "query": "Alfa Romeo emblem badge serpent cross Milan"},
            {"id": 19, "name": "Maserati", "aliases": ["Maserati", "Tridente Maserati"], "query": "Maserati trident emblem badge car grille"},
            {"id": 20, "name": "Jaguar", "aliases": ["Jaguar", "Jaguar Cars"], "query": "Jaguar leaper hood ornament badge chrome cat"},
            {"id": 21, "name": "Rolls-Royce", "aliases": ["Rolls-Royce", "Rolls Royce", "Espíritu del Éxtasis", "Spirit of Ecstasy"], "query": "Spirit of Ecstasy Rolls Royce hood mascot"},
            {"id": 22, "name": "Bentley", "aliases": ["Bentley", "Bentley Motors", "B Alada"], "query": "Bentley flying B emblem car badge winged"},
            {"id": 23, "name": "Seat", "aliases": ["Seat", "SEAT", "Sociedad Española de Automóviles de Turismo"], "query": "SEAT car emblem badge chrome S"},
            {"id": 24, "name": "Citroën", "aliases": ["Citroën", "Citroen", "Doble Chevrón"], "query": "Citroen double chevron emblem chrome car badge"},
            {"id": 25, "name": "Fiat", "aliases": ["Fiat", "FIAT"], "query": "Fiat car emblem round red badge"},
            {"id": 26, "name": "Mazda", "aliases": ["Mazda", "Mazda Motor"], "query": "Mazda winged emblem badge chrome car"},
            {"id": 27, "name": "Mitsubishi", "aliases": ["Mitsubishi", "Mitsubishi Motors", "Tres Diamantes"], "query": "Mitsubishi three diamonds logo emblem red"},
            {"id": 28, "name": "Subaru", "aliases": ["Subaru", "Pléyades Subaru"], "query": "Subaru six stars emblem blue badge car"},
            {"id": 29, "name": "Jeep", "aliases": ["Jeep", "Willys"], "query": "Jeep seven slot grille front face car"},
            {"id": 30, "name": "Bugatti", "aliases": ["Bugatti", "Ettore Bugatti"], "query": "Bugatti EB emblem oval badge car"}
        ]
    },
    "frutas": {
        "name": "Frutas",
        "description": "Identifica frutas frescas, tropicales y cítricas de todo el mundo",
        "icon": "🍓",
        "items": [
            {"id": 1, "name": "Manzana", "aliases": ["Manzana", "Manzanas", "Apple"], "query": "Red apple fruit fresh"},
            {"id": 2, "name": "Plátano", "aliases": ["Plátano", "Platano", "Banana", "Banano", "Plátanos", "Bananas"], "query": "Ripe bananas fruit bunch"},
            {"id": 3, "name": "Fresa", "aliases": ["Fresa", "Fresas", "Frutilla", "Frutillas", "Strawberry"], "query": "Strawberries fresh red fruit"},
            {"id": 4, "name": "Naranja", "aliases": ["Naranja", "Naranjas", "Orange"], "query": "Orange fruit sliced fresh"},
            {"id": 5, "name": "Limón", "aliases": ["Limón", "Limon", "Limones", "Lemon"], "query": "Fresh lemon fruit yellow"},
            {"id": 6, "name": "Sandía", "aliases": ["Sandía", "Sandia", "Sandías", "Watermelon"], "query": "Watermelon slice fresh fruit red"},
            {"id": 7, "name": "Melón", "aliases": ["Melón", "Melon", "Melones", "Cantaloupe"], "query": "Cantaloupe melon sliced fruit"},
            {"id": 8, "name": "Melocotón", "aliases": ["Melocotón", "Melocoton", "Durazno", "Melocotones", "Duraznos", "Peach"], "query": "Peach fruit ripe fresh"},
            {"id": 9, "name": "Piña", "aliases": ["Piña", "Pina", "Ananá", "Anana", "Pineapple"], "query": "Pineapple fruit whole fresh"},
            {"id": 10, "name": "Kiwi", "aliases": ["Kiwi", "Kiwis"], "query": "Kiwi fruit sliced green"},
            {"id": 11, "name": "Uva", "aliases": ["Uva", "Uvas", "Grape", "Grapes"], "query": "Grapes bunch purple green fresh"},
            {"id": 12, "name": "Pera", "aliases": ["Pera", "Peras", "Pear"], "query": "Pear fruit green ripe"},
            {"id": 13, "name": "Cereza", "aliases": ["Cereza", "Cerezas", "Guinda", "Guindas", "Cherry"], "query": "Cherries fresh red fruit pair"},
            {"id": 14, "name": "Mango", "aliases": ["Mango", "Mangos", "Mangues"], "query": "Mango fruit ripe sliced"},
            {"id": 15, "name": "Aguacate", "aliases": ["Aguacate", "Palta", "Avocado", "Aguacates", "Paltas"], "query": "Avocado fruit sliced with pit"},
            {"id": 16, "name": "Papaya", "aliases": ["Papaya", "Papayas", "Lechosa"], "query": "Papaya fruit sliced open seeds"},
            {"id": 17, "name": "Granada", "aliases": ["Granada", "Granadas", "Pomegranate"], "query": "Pomegranate fruit open seeds red"},
            {"id": 18, "name": "Higo", "aliases": ["Higo", "Higos", "Breva", "Brevas", "Fig"], "query": "Figs fresh fruit sliced open"},
            {"id": 19, "name": "Frambuesa", "aliases": ["Frambuesa", "Frambuesas", "Raspberry"], "query": "Raspberries fresh red berries"},
            {"id": 20, "name": "Arándano", "aliases": ["Arándano", "Arandano", "Arándanos", "Arandanos", "Blueberry"], "query": "Blueberries fresh blue fruit"},
            {"id": 21, "name": "Mora", "aliases": ["Mora", "Moras", "Zarzamora", "Blackberry"], "query": "Blackberries fruit fresh ripe"},
            {"id": 22, "name": "Coco", "aliases": ["Coco", "Cocos", "Coconut"], "query": "Coconut cracked open with milk"},
            {"id": 23, "name": "Maracuyá", "aliases": ["Maracuyá", "Maracuya", "Fruta de la pasión", "Parchita", "Passion fruit"], "query": "Passion fruit halved fresh yellow seeds"},
            {"id": 24, "name": "Mandarina", "aliases": ["Mandarina", "Mandarinas", "Clementina", "Clementinas", "Tangerine"], "query": "Tangerine mandarin fruit peeled"},
            {"id": 25, "name": "Pomelo", "aliases": ["Pomelo", "Pomelos", "Toronja", "Toronjas", "Grapefruit"], "query": "Grapefruit sliced pink fruit"},
            {"id": 26, "name": "Albaricoque", "aliases": ["Albaricoque", "Albaricoques", "Damasco", "Damascos", "Chabacano", "Apricot"], "query": "Apricots fresh ripe orange fruit"},
            {"id": 27, "name": "Ciruela", "aliases": ["Ciruela", "Ciruelas", "Plum"], "query": "Plums purple fresh fruit"},
            {"id": 28, "name": "Guayaba", "aliases": ["Guayaba", "Guayabas", "Guava"], "query": "Guava fruit pink sliced"},
            {"id": 29, "name": "Pitahaya", "aliases": ["Pitahaya", "Pitaya", "Fruta del dragón", "Dragon fruit"], "query": "Dragon fruit pitaya sliced pink white"},
            {"id": 30, "name": "Caqui", "aliases": ["Caqui", "Caquis", "Pérsimo", "Persimo", "Kaki", "Persimmon"], "query": "Persimmon fruit ripe kaki"}
        ]
    },
    "animales_marinos": {
        "name": "Animales Marinos",
        "description": "Descubre la asombrosa fauna de los océanos, mares y arrecifes",
        "icon": "🐬",
        "items": [
            {"id": 1, "name": "Delfín", "aliases": ["Delfín", "Delfin", "Delfines", "Dolphin"], "query": "Bottlenose dolphin jumping ocean water"},
            {"id": 2, "name": "Tiburón blanco", "aliases": ["Tiburón", "Tiburon", "Tiburón blanco", "Tiburon blanco", "Gran tiburón blanco", "Great white shark"], "query": "Great white shark underwater swimming"},
            {"id": 3, "name": "Ballena azul", "aliases": ["Ballena", "Ballena azul", "Rorcual azul", "Blue whale"], "query": "Blue whale underwater ocean surfacing"},
            {"id": 4, "name": "Pulpo", "aliases": ["Pulpo", "Pulpos", "Octopus"], "query": "Common octopus underwater reef tentacles"},
            {"id": 5, "name": "Medusa", "aliases": ["Medusa", "Medusas", "Agua viva", "Jellyfish"], "query": "Jellyfish glowing blue water ocean"},
            {"id": 6, "name": "Tortuga marina", "aliases": ["Tortuga marina", "Tortuga de mar", "Tortuga boba", "Tortuga laúd", "Sea turtle"], "query": "Sea turtle swimming underwater coral reef"},
            {"id": 7, "name": "Foca", "aliases": ["Foca", "Focas", "Foca común", "Seal"], "query": "Harbor seal swimming water portrait"},
            {"id": 8, "name": "Manta raya", "aliases": ["Manta raya", "Mantarraya", "Manta", "Raya", "Manta ray"], "query": "Manta ray swimming underwater blue ocean"},
            {"id": 9, "name": "Caballito de mar", "aliases": ["Caballito de mar", "Hipocampo", "Seahorse"], "query": "Seahorse underwater coral macro"},
            {"id": 10, "name": "Cangrejo", "aliases": ["Cangrejo", "Cangrejos", "Crab"], "query": "Crab beach ocean shore close-up"},
            {"id": 11, "name": "Orca", "aliases": ["Orca", "Orcas", "Ballena asesina", "Killer whale"], "query": "Orca killer whale jumping breaching ocean"},
            {"id": 12, "name": "Morsa", "aliases": ["Morsa", "Morsas", "Walrus"], "query": "Walrus ice arctic tusks"},
            {"id": 13, "name": "Calamar", "aliases": ["Calamar", "Calamares", "Squid", "Calamar gigante"], "query": "Squid underwater swimming marine life"},
            {"id": 14, "name": "Estrella de mar", "aliases": ["Estrella de mar", "Estrellas de mar", "Starfish", "Sea star"], "query": "Starfish underwater ocean sand"},
            {"id": 15, "name": "Pez payaso", "aliases": ["Pez payaso", "Amphiprion", "Nemo", "Clownfish"], "query": "Clownfish anemone coral reef"},
            {"id": 16, "name": "Narval", "aliases": ["Narval", "Narvales", "Narwhal"], "query": "Narwhal arctic ocean tusk swimming"},
            {"id": 17, "name": "Langosta", "aliases": ["Langosta", "Langostas", "Langosta marina", "Lobster"], "query": "Lobster underwater ocean floor"},
            {"id": 18, "name": "Manatí", "aliases": ["Manatí", "Manati", "Vaca marina", "Manatee"], "query": "Manatee swimming underwater clear spring"},
            {"id": 19, "name": "Pez globo", "aliases": ["Pez globo", "Fugu", "Pufferfish"], "query": "Pufferfish inflated underwater ocean"},
            {"id": 20, "name": "Pez espada", "aliases": ["Pez espada", "Espada", "Swordfish"], "query": "Swordfish jumping ocean gamefish"},
            {"id": 21, "name": "Morena", "aliases": ["Morena", "Pez morena", "Moray eel"], "query": "Moray eel reef opening mouth underwater"},
            {"id": 22, "name": "Erizo de mar", "aliases": ["Erizo de mar", "Erizo marino", "Sea urchin"], "query": "Sea urchin underwater ocean rocks spines"},
            {"id": 23, "name": "Beluga", "aliases": ["Beluga", "Ballena blanca", "Beluga whale"], "query": "Beluga whale swimming smiling white underwater"},
            {"id": 24, "name": "Nutria marina", "aliases": ["Nutria marina", "Nutria de mar", "Sea otter"], "query": "Sea otter floating on water kelp"},
            {"id": 25, "name": "León marino", "aliases": ["León marino", "Leon marino", "Lobo marino", "Sea lion"], "query": "California sea lion swimming ocean"},
            {"id": 26, "name": "Pez león", "aliases": ["Pez león", "Pez leon", "Lionfish", "Pterois"], "query": "Lionfish venomous stripes fins coral reef"},
            {"id": 27, "name": "Sepia", "aliases": ["Sepia", "Jibia", "Choco", "Cuttlefish"], "query": "Cuttlefish camouflage underwater reef"},
            {"id": 28, "name": "Tiburón martillo", "aliases": ["Tiburón martillo", "Tiburon martillo", "Pez martillo", "Hammerhead shark"], "query": "Hammerhead shark swimming ocean blue"},
            {"id": 29, "name": "Pez cirujano", "aliases": ["Pez cirujano", "Cirujano azul", "Dory", "Blue tang"], "query": "Blue tang surgeonfish coral reef"},
            {"id": 30, "name": "Pez ángel", "aliases": ["Pez ángel", "Pez angel", "Pez ángel emperador", "Angelfish"], "query": "Emperor angelfish underwater colorful stripes"}
        ]
    },
    "pokemon": {
        "name": "Pokémon",
        "description": "Identifica los monstruos de bolsillo más famosos y emblemáticos",
        "icon": "⚡",
        "items": [
            {"id": 1, "name": "Pikachu", "aliases": ["Pikachu", "Pika"], "query": "Pikachu yellow mouse pokemon character figure"},
            {"id": 2, "name": "Charizard", "aliases": ["Charizard", "Lizardon"], "query": "Charizard dragon pokemon orange fire figure"},
            {"id": 3, "name": "Bulbasaur", "aliases": ["Bulbasaur", "Fushigidane"], "query": "Bulbasaur pokemon green plant bulb figure"},
            {"id": 4, "name": "Squirtle", "aliases": ["Squirtle", "Zenigame"], "query": "Squirtle pokemon turtle water blue figure"},
            {"id": 5, "name": "Mewtwo", "aliases": ["Mewtwo", "Myuutsuu"], "query": "Mewtwo legendary psychic pokemon figure"},
            {"id": 6, "name": "Eevee", "aliases": ["Eevee", "Iibui"], "query": "Eevee pokemon brown fur ears figure"},
            {"id": 7, "name": "Gengar", "aliases": ["Gengar", "Gengaa"], "query": "Gengar purple ghost shadow pokemon figure"},
            {"id": 8, "name": "Snorlax", "aliases": ["Snorlax", "Kabigon"], "query": "Snorlax sleeping giant bear pokemon figure"},
            {"id": 9, "name": "Jigglypuff", "aliases": ["Jigglypuff", "Purin"], "query": "Jigglypuff pink balloon singing pokemon figure"},
            {"id": 10, "name": "Lucario", "aliases": ["Lucario", "Rukario"], "query": "Lucario aura blue jackal pokemon figure"},
            {"id": 11, "name": "Greninja", "aliases": ["Greninja", "Gekkouga"], "query": "Greninja ninja frog water pokemon figure"},
            {"id": 12, "name": "Dragonite", "aliases": ["Dragonite", "Kairyuu"], "query": "Dragonite orange gentle dragon pokemon figure"},
            {"id": 13, "name": "Gyarados", "aliases": ["Gyarados", "Gyardos"], "query": "Gyarados sea dragon blue sea monster pokemon figure"},
            {"id": 14, "name": "Meowth", "aliases": ["Meowth", "Nyaasu"], "query": "Meowth cat coin lucky cat pokemon figure"},
            {"id": 15, "name": "Psyduck", "aliases": ["Psyduck", "Kodakku"], "query": "Psyduck yellow duck holding head pokemon figure"},
            {"id": 16, "name": "Mew", "aliases": ["Mew", "Myuu"], "query": "Mew pink mythical cat pokemon figure"},
            {"id": 17, "name": "Rayquaza", "aliases": ["Rayquaza", "Reikuuza"], "query": "Rayquaza green dragon sky legendary pokemon figure"},
            {"id": 18, "name": "Blastoise", "aliases": ["Blastoise", "Kamekkusu"], "query": "Blastoise turtle shell water cannons pokemon figure"},
            {"id": 19, "name": "Venusaur", "aliases": ["Venusaur", "Fushigibana"], "query": "Venusaur giant flower dinosaur pokemon figure"},
            {"id": 20, "name": "Charmander", "aliases": ["Charmander", "Hitokage"], "query": "Charmander orange lizard tail flame pokemon figure"},
            {"id": 21, "name": "Togepi", "aliases": ["Togepi", "Togepii"], "query": "Togepi egg shell baby fairy pokemon figure"},
            {"id": 22, "name": "Machamp", "aliases": ["Machamp", "Kairikii"], "query": "Machamp four arms fighting muscular pokemon figure"},
            {"id": 23, "name": "Gardevoir", "aliases": ["Gardevoir", "Saanaito"], "query": "Gardevoir white green dress psychic pokemon figure"},
            {"id": 24, "name": "Umbreon", "aliases": ["Umbreon", "Burakkii"], "query": "Umbreon black yellow rings dark pokemon figure"},
            {"id": 25, "name": "Garchomp", "aliases": ["Garchomp", "Gaburiasu"], "query": "Garchomp shark dragon land ground pokemon figure"},
            {"id": 26, "name": "Lapras", "aliases": ["Lapras", "Rapurasu"], "query": "Lapras sea turtle plesiosaur blue pokemon figure"},
            {"id": 27, "name": "Lugia", "aliases": ["Lugia", "Rugia"], "query": "Lugia silver white legendary bird diving pokemon figure"},
            {"id": 28, "name": "Arcanine", "aliases": ["Arcanine", "Uindi"], "query": "Arcanine legendary fire tiger dog pokemon figure"},
            {"id": 29, "name": "Vulpix", "aliases": ["Vulpix", "Rokon"], "query": "Vulpix six tails red fox cute pokemon figure"},
            {"id": 30, "name": "Ditto", "aliases": ["Ditto", "Metamon"], "query": "Ditto purple pink slime smile pokemon figure"}
        ]
    },
    "superheroes_marvel": {
        "name": "Superhéroes de Marvel",
        "description": "Identifica a los héroes, vengadores y mutantes del Universo Marvel",
        "icon": "🦸",
        "items": [
            {"id": 1, "name": "Spider-Man", "aliases": ["Spider-Man", "Spiderman", "Hombre Araña", "Peter Parker", "El Hombre Araña"], "query": "Spider-Man red blue suit hero"},
            {"id": 2, "name": "Iron Man", "aliases": ["Iron Man", "Ironman", "Tony Stark", "Hombre de Hierro", "El Hombre de Hierro"], "query": "Iron Man suit red gold armor"},
            {"id": 3, "name": "Capitán América", "aliases": ["Capitán América", "Capitan America", "Steve Rogers", "Captain America"], "query": "Captain America shield suit stars stripes"},
            {"id": 4, "name": "Thor", "aliases": ["Thor", "Thor Odinson", "Dios del Trueno"], "query": "Thor hammer Mjolnir Marvel armor"},
            {"id": 5, "name": "Hulk", "aliases": ["Hulk", "Bruce Banner", "El Increíble Hulk", "The Incredible Hulk"], "query": "Hulk green giant muscular angry"},
            {"id": 6, "name": "Lobezno", "aliases": ["Lobezno", "Wolverine", "Logan", "James Howlett", "Guepardo"], "query": "Wolverine claws yellow suit leather Logan"},
            {"id": 7, "name": "Black Panther", "aliases": ["Black Panther", "Pantera Negra", "T'Challa", "TChalla"], "query": "Black Panther vibranium suit mask Wakanda"},
            {"id": 8, "name": "Viuda Negra", "aliases": ["Viuda Negra", "Black Widow", "Natasha Romanoff", "Natasha Romanov"], "query": "Black Widow Marvel red hair black suit"},
            {"id": 9, "name": "Doctor Strange", "aliases": ["Doctor Strange", "Stephen Strange", "Doctor Extraño", "Hechicero Supremo"], "query": "Doctor Strange cloak of levitation eye of agamotto"},
            {"id": 10, "name": "Deadpool", "aliases": ["Deadpool", "Wade Wilson", "Masacre"], "query": "Deadpool red black suit swords mask"},
            {"id": 11, "name": "Bruja Escarlata", "aliases": ["Bruja Escarlata", "Scarlet Witch", "Wanda Maximoff", "Wanda"], "query": "Scarlet Witch Wanda red tiara magic crown"},
            {"id": 12, "name": "Ojo de Halcón", "aliases": ["Ojo de Halcón", "Ojo de Halcon", "Hawkeye", "Clint Barton"], "query": "Hawkeye bow and arrow purple suit Marvel"},
            {"id": 13, "name": "Visión", "aliases": ["Visión", "Vision", "Sintetoide"], "query": "Vision Marvel cape mind stone synth"},
            {"id": 14, "name": "Ant-Man", "aliases": ["Ant-Man", "Antman", "Hombre Hormiga", "Scott Lang", "Hank Pym"], "query": "Ant-Man helmet suit red silver Marvel"},
            {"id": 15, "name": "Capitana Marvel", "aliases": ["Capitana Marvel", "Captain Marvel", "Carol Danvers"], "query": "Captain Marvel Carol Danvers red blue gold suit"},
            {"id": 16, "name": "Daredevil", "aliases": ["Daredevil", "Matt Murdock", "El hombre sin miedo"], "query": "Daredevil red suit horns mask billy clubs"},
            {"id": 17, "name": "Groot", "aliases": ["Groot", "Baby Groot", "Yo soy Groot"], "query": "Groot tree creature Guardians of the Galaxy"},
            {"id": 18, "name": "Rocket Raccoon", "aliases": ["Rocket", "Rocket Raccoon", "Mapache Cohete"], "query": "Rocket Raccoon gun Guardians of the Galaxy"},
            {"id": 19, "name": "Gamora", "aliases": ["Gamora", "Hija de Thanos"], "query": "Gamora green skin sword Guardians of the Galaxy"},
            {"id": 20, "name": "Star-Lord", "aliases": ["Star-Lord", "Star Lord", "Peter Quill"], "query": "Star-Lord helmet leather jacket blasters"},
            {"id": 21, "name": "Soldado de Invierno", "aliases": ["Soldado de Invierno", "Winter Soldier", "Bucky Barnes", "Bucky"], "query": "Winter Soldier metal arm cybernetic Bucky"},
            {"id": 22, "name": "Falcon", "aliases": ["Falcon", "Sam Wilson", "Halcón"], "query": "Falcon Sam Wilson wings flight Marvel"},
            {"id": 23, "name": "Castigador", "aliases": ["El Castigador", "Castigador", "Punisher", "The Punisher", "Frank Castle"], "query": "The Punisher skull vest coat Frank Castle"},
            {"id": 24, "name": "Motorista Fantasma", "aliases": ["Motorista Fantasma", "Ghost Rider", "Johnny Blaze", "Jinete Fantasma"], "query": "Ghost Rider flaming skull leather jacket chain"},
            {"id": 25, "name": "Tormenta", "aliases": ["Tormenta", "Storm", "Ororo Munroe"], "query": "Storm X-Men white hair cape weather mutant"},
            {"id": 26, "name": "Cíclope", "aliases": ["Cíclope", "Ciclope", "Cyclops", "Scott Summers"], "query": "Cyclops X-Men ruby visor laser beam"},
            {"id": 27, "name": "Caballero Luna", "aliases": ["Caballero Luna", "Moon Knight", "Marc Spector", "Steven Grant"], "query": "Moon Knight white cowl cape crescent"},
            {"id": 28, "name": "Hulka", "aliases": ["Hulka", "She-Hulk", "She Hulk", "Jennifer Walters"], "query": "She-Hulk green lawyer superheroine Marvel"},
            {"id": 29, "name": "Nick Furia", "aliases": ["Nick Furia", "Nick Fury", "Director Furia"], "query": "Nick Fury eye patch leather coat trenchcoat"},
            {"id": 30, "name": "Blade", "aliases": ["Blade", "Eric Brooks", "Cazavampiros"], "query": "Blade vampire hunter sunglasses trench coat sword"}
        ]
    },
    "dibujos_animados": {
        "name": "Dibujos Animados",
        "description": "Personajes legendarios de series animadas, caricaturas y anime clásico",
        "icon": "📺",
        "items": [
            {"id": 1, "name": "Mickey Mouse", "aliases": ["Mickey Mouse", "Mickey", "Ratón Mickey"], "query": "Mickey Mouse big ears red shorts gloves"},
            {"id": 2, "name": "Bugs Bunny", "aliases": ["Bugs Bunny", "El conejo Bugs"], "query": "Bugs Bunny rabbit carrot Looney Tunes"},
            {"id": 3, "name": "Homer Simpson", "aliases": ["Homer Simpson", "Homero Simpson", "Homer", "Homero"], "query": "Homer Simpson yellow cartoon character"},
            {"id": 4, "name": "Bob Esponja", "aliases": ["Bob Esponja", "SpongeBob", "SpongeBob SquarePants"], "query": "SpongeBob SquarePants yellow sponge cartoon"},
            {"id": 5, "name": "Tom y Jerry", "aliases": ["Tom y Jerry", "Tom & Jerry", "Tom", "Jerry"], "query": "Tom and Jerry cat and mouse cartoon"},
            {"id": 6, "name": "Scooby-Doo", "aliases": ["Scooby-Doo", "Scooby Doo", "Scooby"], "query": "Scooby-Doo great dane dog cartoon mystery"},
            {"id": 7, "name": "Goku", "aliases": ["Goku", "Son Goku", "Kakarotto", "Kakaroto"], "query": "Goku Son Goku orange gi black spiky hair"},
            {"id": 8, "name": "Shrek", "aliases": ["Shrek", "Ogro Shrek"], "query": "Shrek green ogre ears cartoon DreamWorks"},
            {"id": 9, "name": "Pato Donald", "aliases": ["Pato Donald", "Donald Duck", "Donald"], "query": "Donald Duck sailor shirt blue hat Disney"},
            {"id": 10, "name": "Garfield", "aliases": ["Garfield", "Gato Garfield"], "query": "Garfield orange striped cat lazy cartoon"},
            {"id": 11, "name": "Popeye", "aliases": ["Popeye", "Popeye el marino"], "query": "Popeye the sailor man pipe spinach muscles"},
            {"id": 12, "name": "Pedro Picapiedra", "aliases": ["Pedro Picapiedra", "Fred Flintstone", "Los Picapiedra"], "query": "Fred Flintstone orange tunic black spots tie"},
            {"id": 13, "name": "Bart Simpson", "aliases": ["Bart Simpson", "Bart", "El Barto"], "query": "Bart Simpson skateboard red shirt yellow"},
            {"id": 14, "name": "Piolín", "aliases": ["Piolín", "Piolin", "Tweety", "Tweety Bird"], "query": "Tweety bird yellow canary big head blue eyes"},
            {"id": 15, "name": "Patricio Estrella", "aliases": ["Patricio Estrella", "Patricio", "Patrick Star"], "query": "Patrick Star pink starfish green shorts"},
            {"id": 16, "name": "El Coyote", "aliases": ["El Coyote", "Coyote", "Wile E. Coyote", "Wile E Coyote"], "query": "Wile E. Coyote desert Looney Tunes"},
            {"id": 17, "name": "Snoopy", "aliases": ["Snoopy", "Perro Snoopy", "Peanuts"], "query": "Snoopy white beagle dog black ears Peanuts"},
            {"id": 18, "name": "Doraemon", "aliases": ["Doraemon", "Gato Cósmico", "El gato cósmico"], "query": "Doraemon blue robot cat bell pocket"},
            {"id": 19, "name": "La Pantera Rosa", "aliases": ["La Pantera Rosa", "Pantera Rosa", "The Pink Panther"], "query": "Pink Panther cartoon sleek feline"},
            {"id": 20, "name": "Winnie the Pooh", "aliases": ["Winnie the Pooh", "Winnie Pooh", "Pooh", "Oso Pooh"], "query": "Winnie the Pooh yellow bear red shirt honey"},
            {"id": 21, "name": "Shin Chan", "aliases": ["Shin Chan", "Shin-chan", "Shinnosuke Nohara"], "query": "Shin-chan Shinnosuke red shirt yellow shorts"},
            {"id": 22, "name": "Sailor Moon", "aliases": ["Sailor Moon", "Usagi Tsukino", "Bunny Tsukino"], "query": "Sailor Moon blonde twintails sailor suit tiara"},
            {"id": 23, "name": "Naruto", "aliases": ["Naruto", "Naruto Uzumaki"], "query": "Naruto Uzumaki orange jumpsuit headband ninja"},
            {"id": 24, "name": "Dexter", "aliases": ["Dexter", "El laboratorio de Dexter", "Laboratorio de Dexter"], "query": "Dexter Laboratory red hair glasses lab coat"},
            {"id": 25, "name": "Las Supernenas", "aliases": ["Las Supernenas", "Supernenas", "Las Chicas Superpoderosas", "Chicas Superpoderosas", "Powerpuff Girls"], "query": "Powerpuff Girls Blossom Bubbles Buttercup cartoon"},
            {"id": 26, "name": "Johnny Bravo", "aliases": ["Johnny Bravo"], "query": "Johnny Bravo blonde pompadour sunglasses muscles"},
            {"id": 27, "name": "Agallas el perro cobarde", "aliases": ["Agallas el perro cobarde", "Coraje el perro cobarde", "Agallas", "Coraje"], "query": "Courage the Cowardly Dog pink dog big eyes"},
            {"id": 28, "name": "Mortadelo", "aliases": ["Mortadelo", "Mortadelo y Filemón", "Mortadelo y Filemon"], "query": "Mortadelo comic character black frock glasses"},
            {"id": 29, "name": "Mafalda", "aliases": ["Mafalda", "Quino Mafalda"], "query": "Mafalda comic girl black hair red ribbon"},
            {"id": 30, "name": "Inspector Gadget", "aliases": ["Inspector Gadget", "Gadget"], "query": "Inspector Gadget trench coat hat copter cartoon"}
        ]
    },
    "marcas_tecnologia": {
        "name": "Marcas de Tecnología",
        "description": "Logotipos limpios y símbolos de las principales empresas y gigantes tech",
        "icon": "💻",
        "items": [
            {"id": 1, "name": "Apple", "aliases": ["Apple", "Apple Inc", "Manzana"], "query": "Apple Inc logo white minimalist icon"},
            {"id": 2, "name": "Microsoft", "aliases": ["Microsoft", "MSFT", "Windows"], "query": "Microsoft logo four squares colorful icon"},
            {"id": 3, "name": "Google", "aliases": ["Google", "Alphabet", "Google Inc"], "query": "Google G logo colorful four color icon"},
            {"id": 4, "name": "Sony", "aliases": ["Sony", "Sony Corporation"], "query": "Sony logo minimalist electronics"},
            {"id": 5, "name": "Samsung", "aliases": ["Samsung", "Samsung Electronics"], "query": "Samsung logo blue electronics emblem"},
            {"id": 6, "name": "Nintendo", "aliases": ["Nintendo", "Nintendo Co"], "query": "Nintendo logo red oval capsule gaming"},
            {"id": 7, "name": "PlayStation", "aliases": ["PlayStation", "Playstation", "PS", "Sony PlayStation"], "query": "PlayStation PS logo blue black gaming"},
            {"id": 8, "name": "Xbox", "aliases": ["Xbox", "Microsoft Xbox"], "query": "Xbox sphere X logo green gaming"},
            {"id": 9, "name": "Intel", "aliases": ["Intel", "Intel Corporation"], "query": "Intel logo blue processor chip emblem"},
            {"id": 10, "name": "AMD", "aliases": ["AMD", "Advanced Micro Devices"], "query": "AMD arrow logo green processor icon"},
            {"id": 11, "name": "Nvidia", "aliases": ["Nvidia", "NVIDIA"], "query": "Nvidia green claw eye logo GPU graphics"},
            {"id": 12, "name": "Spotify", "aliases": ["Spotify", "Spotify AB"], "query": "Spotify green circle waves logo sound music"},
            {"id": 13, "name": "Amazon", "aliases": ["Amazon", "Amazon.com"], "query": "Amazon smile arrow logo orange curved"},
            {"id": 14, "name": "Meta", "aliases": ["Meta", "Facebook", "Meta Platforms"], "query": "Meta infinity loop blue logo social media"},
            {"id": 15, "name": "Instagram", "aliases": ["Instagram", "Insta", "IG"], "query": "Instagram camera gradient glyph logo icon"},
            {"id": 16, "name": "WhatsApp", "aliases": ["WhatsApp", "Whatsapp"], "query": "WhatsApp green speech bubble phone receiver logo"},
            {"id": 17, "name": "YouTube", "aliases": ["YouTube", "Youtube", "YT"], "query": "YouTube red play button rectangle logo icon"},
            {"id": 18, "name": "TikTok", "aliases": ["TikTok", "Tiktok", "ByteDance"], "query": "TikTok musical note cyan red glitch logo icon"},
            {"id": 19, "name": "Twitter / X", "aliases": ["Twitter", "X", "Twitter / X", "Red social X"], "query": "X logo black white minimalist new Twitter icon"},
            {"id": 20, "name": "Netflix", "aliases": ["Netflix", "Netflix Inc"], "query": "Netflix red N ribbon logo stream icon"},
            {"id": 21, "name": "Xiaomi", "aliases": ["Xiaomi", "Mi"], "query": "Xiaomi orange square Mi logo icon"},
            {"id": 22, "name": "Huawei", "aliases": ["Huawei", "Huawei Technologies"], "query": "Huawei red fan petals blossom logo icon"},
            {"id": 23, "name": "Lenovo", "aliases": ["Lenovo", "Lenovo Group"], "query": "Lenovo red rectangle white logo laptop"},
            {"id": 24, "name": "Dell", "aliases": ["Dell", "Dell Technologies"], "query": "Dell blue circle slanted E logo icon"},
            {"id": 25, "name": "HP", "aliases": ["HP", "Hewlett-Packard", "Hewlett Packard"], "query": "HP blue circle slanted hp logo tech"},
            {"id": 26, "name": "Asus", "aliases": ["Asus", "ASUS", "ASUSTeK"], "query": "Asus blue logo computer hardware tech"},
            {"id": 27, "name": "LG", "aliases": ["LG", "LG Electronics", "Life's Good"], "query": "LG red circle winking face logo icon"},
            {"id": 28, "name": "Canon", "aliases": ["Canon", "Canon Inc"], "query": "Canon red logo camera electronics"},
            {"id": 29, "name": "Tesla", "aliases": ["Tesla", "Tesla Motors"], "query": "Tesla red T shield logo tech automotive"},
            {"id": 30, "name": "IBM", "aliases": ["IBM", "International Business Machines", "Big Blue"], "query": "IBM blue eight bar striped logo tech"}
        ]
    },
    "cuadros_famosos": {
        "name": "Pintores de Cuadros Famosos",
        "description": "Adivina el pintor/artista que pintó cada una de estas obras maestras de la historia del arte",
        "icon": "🎨",
        "items": [
            {"id": 1, "name": "Leonardo da Vinci", "aliases": ["Leonardo da Vinci", "Leonardo", "Da Vinci", "La Gioconda", "Mona Lisa"], "query": "Mona Lisa Leonardo da Vinci Louvre painting"},
            {"id": 2, "name": "Vincent van Gogh", "aliases": ["Vincent van Gogh", "Van Gogh", "La noche estrellada", "Starry Night"], "query": "The Starry Night Vincent van Gogh MoMA painting"},
            {"id": 3, "name": "Pablo Picasso", "aliases": ["Pablo Picasso", "Picasso", "Guernica"], "query": "Guernica Pablo Picasso Reina Sofia painting"},
            {"id": 4, "name": "Salvador Dalí", "aliases": ["Salvador Dalí", "Salvador Dali", "Dalí", "Dali", "La persistencia de la memoria"], "query": "The Persistence of Memory Salvador Dali melting clocks"},
            {"id": 5, "name": "Claude Monet", "aliases": ["Claude Monet", "Monet", "Nenúfares", "Impresión sol naciente"], "query": "Impression Sunrise Claude Monet painting Le Havre"},
            {"id": 6, "name": "Diego Velázquez", "aliases": ["Diego Velázquez", "Diego Velazquez", "Velázquez", "Velazquez", "Las Meninas"], "query": "Las Meninas Diego Velazquez Prado painting"},
            {"id": 7, "name": "Francisco de Goya", "aliases": ["Francisco de Goya", "Goya", "El 3 de mayo en Madrid", "Saturno devorando a su hijo"], "query": "The Third of May 1808 Francisco de Goya Prado painting"},
            {"id": 8, "name": "Edvard Munch", "aliases": ["Edvard Munch", "Munch", "El grito", "The Scream"], "query": "The Scream Edvard Munch National Gallery Oslo painting"},
            {"id": 9, "name": "Johannes Vermeer", "aliases": ["Johannes Vermeer", "Vermeer", "La joven de la perla", "La chica de la perla"], "query": "Girl with a Pearl Earring Johannes Vermeer Mauritshuis"},
            {"id": 10, "name": "Gustav Klimt", "aliases": ["Gustav Klimt", "Klimt", "El beso", "The Kiss"], "query": "The Kiss Gustav Klimt Belvedere Vienna painting gold"},
            {"id": 11, "name": "Sandro Botticelli", "aliases": ["Sandro Botticelli", "Botticelli", "El nacimiento de Venus"], "query": "The Birth of Venus Sandro Botticelli Uffizi painting"},
            {"id": 12, "name": "Miguel Ángel", "aliases": ["Miguel Ángel", "Miguel Angel", "Michelangelo", "Michelangelo Buonarroti", "La creación de Adán"], "query": "The Creation of Adam Michelangelo Sistine Chapel ceiling"},
            {"id": 13, "name": "Rembrandt", "aliases": ["Rembrandt", "Rembrandt van Rijn", "La ronda de noche"], "query": "The Night Watch Rembrandt Rijksmuseum Amsterdam painting"},
            {"id": 14, "name": "Frida Kahlo", "aliases": ["Frida Kahlo", "Kahlo", "Las dos Fridas"], "query": "The Two Fridas Frida Kahlo painting double portrait"},
            {"id": 15, "name": "Joan Miró", "aliases": ["Joan Miró", "Joan Miro", "Miró", "Miro", "El carnaval de Arlequín"], "query": "The Harlequin Carnival Joan Miro painting surrealism"},
            {"id": 16, "name": "René Magritte", "aliases": ["René Magritte", "Rene Magritte", "Magritte", "El hijo del hombre"], "query": "The Son of Man Rene Magritte green apple bowler hat"},
            {"id": 17, "name": "Henri Matisse", "aliases": ["Henri Matisse", "Matisse", "La danza"], "query": "La Danse Henri Matisse Hermitage painting red dancers"},
            {"id": 18, "name": "Paul Cézanne", "aliases": ["Paul Cézanne", "Paul Cezanne", "Cézanne", "Cezanne", "Los jugadores de cartas"], "query": "The Card Players Paul Cezanne painting Orsay"},
            {"id": 19, "name": "Wassily Kandinsky", "aliases": ["Wassily Kandinsky", "Kandinsky", "Vasili Kandinski", "Composición VIII"], "query": "Composition VIII Wassily Kandinsky abstract painting"},
            {"id": 20, "name": "El Bosco", "aliases": ["El Bosco", "Hieronymus Bosch", "Bosch", "El jardín de las delicias"], "query": "The Garden of Earthly Delights Hieronymus Bosch Prado triptych"},
            {"id": 21, "name": "Caravaggio", "aliases": ["Caravaggio", "Michelangelo Merisi", "La vocación de San Mateo", "Judith y Holofernes"], "query": "The Calling of Saint Matthew Caravaggio painting San Luigi dei Francesi"},
            {"id": 22, "name": "Edgar Degas", "aliases": ["Edgar Degas", "Degas", "La clase de danza", "Bailarinas"], "query": "The Ballet Class Edgar Degas Orsay painting ballerinas"},
            {"id": 23, "name": "Pierre-Auguste Renoir", "aliases": ["Pierre-Auguste Renoir", "Auguste Renoir", "Renoir", "El almuerzo de los remeros"], "query": "Luncheon of the Boating Party Pierre-Auguste Renoir Phillips Collection"},
            {"id": 24, "name": "Édouard Manet", "aliases": ["Édouard Manet", "Edouard Manet", "Manet", "El almuerzo sobre la hierba"], "query": "Le Dejeuner sur l herbe Edouard Manet Orsay painting"},
            {"id": 25, "name": "Joaquín Sorolla", "aliases": ["Joaquín Sorolla", "Joaquin Sorolla", "Sorolla", "Paseo a orillas del mar"], "query": "Paseo a orillas del mar Joaquin Sorolla painting Madrid"},
            {"id": 26, "name": "Andy Warhol", "aliases": ["Andy Warhol", "Warhol", "Marilyn Monroe", "Latas de sopa Campbell"], "query": "Marilyn Diptych Andy Warhol pop art screenprint"},
            {"id": 27, "name": "Roy Lichtenstein", "aliases": ["Roy Lichtenstein", "Lichtenstein", "Whaam!"], "query": "Whaam! Roy Lichtenstein Tate Modern pop art painting"},
            {"id": 28, "name": "Paul Gauguin", "aliases": ["Paul Gauguin", "Gauguin", "¿De dónde venimos? ¿Quiénes somos? ¿Adónde vamos?"], "query": "Where Do We Come From Paul Gauguin painting Boston MFA"},
            {"id": 29, "name": "El Greco", "aliases": ["El Greco", "Doménikos Theotokópoulos", "El entierro del Conde de Orgaz"], "query": "The Burial of the Count of Orgaz El Greco Santo Tome Toledo"},
            {"id": 30, "name": "Rafael Sanzio", "aliases": ["Rafael Sanzio", "Rafael", "Raphael", "La escuela de Atenas"], "query": "The School of Athens Raphael Vatican Rooms fresco"}
        ]
    },
    "material_escolar": {
        "name": "Material Escolar",
        "description": "Útiles, herramientas de papelería e instrumentos de clase y estudio",
        "icon": "🎒",
        "items": [
            {"id": 1, "name": "Lápiz", "aliases": ["Lápiz", "Lapiz", "Lápices", "Lapices", "Lapicero", "Pencil"], "query": "Yellow wooden pencil sharp point graphite"},
            {"id": 2, "name": "Goma de borrar", "aliases": ["Goma de borrar", "Goma", "Borrador", "Gomas de borrar", "Eraser"], "query": "Rubber eraser pink white stationary school"},
            {"id": 3, "name": "Sacapuntas", "aliases": ["Sacapuntas", "Afilalápiz", "Afilalapiz", "Tajalápiz", "Tajalapiz", "Pencil sharpener"], "query": "Metal pencil sharpener metal blade school"},
            {"id": 4, "name": "Regla", "aliases": ["Regla", "Regla graduada", "Reglas", "Ruler"], "query": "Wooden plastic 30cm ruler scale school"},
            {"id": 5, "name": "Tijeras", "aliases": ["Tijeras", "Tijera", "Tijeras escolares", "Scissors"], "query": "School scissors safety rounded tips stationary"},
            {"id": 6, "name": "Mochila", "aliases": ["Mochila", "Mochila escolar", "Mochilas", "Backpack"], "query": "School backpack colorful bag zipper"},
            {"id": 7, "name": "Cuaderno", "aliases": ["Cuaderno", "Cuadernos", "Libreta", "Libretas", "Notebook"], "query": "Spiral notebook lined paper school"},
            {"id": 8, "name": "Bolígrafo", "aliases": ["Bolígrafo", "Boligrafo", "Bolígrafos", "Boli", "Pluma", "Ballpoint pen"], "query": "Blue ballpoint pen stationary cap"},
            {"id": 9, "name": "Pegamento en barra", "aliases": ["Pegamento", "Pegamento en barra", "Barra de pegamento", "Cola", "Glue stick"], "query": "Glue stick adhesive stationary school"},
            {"id": 10, "name": "Estuche", "aliases": ["Estuche", "Estuches", "Cartuchera", "Portalápices", "Pencil case"], "query": "Pencil case zipper cloth stationary pouch"},
            {"id": 11, "name": "Compás", "aliases": ["Compás", "Compas", "Compases", "Compass"], "query": "Drawing compass drafting metal tool circle"},
            {"id": 12, "name": "Rotulador", "aliases": ["Rotulador", "Rotuladores", "Marcador", "Plumón", "Marker"], "query": "Felt tip pens markers colorful stationary"},
            {"id": 13, "name": "Subrayador", "aliases": ["Subrayador", "Subrayadores", "Marcador fluorescente", "Fluorescente", "Highlighter"], "query": "Yellow highlighter pen fluorescent marker"},
            {"id": 14, "name": "Transportador de ángulos", "aliases": ["Transportador de ángulos", "Transportador", "Semicírculo graduado", "Protractor"], "query": "Protractor angle measure clear plastic school"},
            {"id": 15, "name": "Escuadra", "aliases": ["Escuadra", "Escuadra geométrica", "Set square"], "query": "Set square 45 degree drafting triangle clear plastic"},
            {"id": 16, "name": "Cartabón", "aliases": ["Cartabón", "Cartabon", "Triángulo de 30 60"], "query": "Set square 30 60 degree drafting triangle plastic"},
            {"id": 17, "name": "Pincel", "aliases": ["Pincel", "Pinceles", "Brocha", "Paintbrush"], "query": "Paintbrushes watercolor artist brush set"},
            {"id": 18, "name": "Acuarelas", "aliases": ["Acuarelas", "Acuarela", "Paleta de acuarelas", "Watercolors"], "query": "Watercolor paint set palette cakes brush"},
            {"id": 19, "name": "Plastilina", "aliases": ["Plastilina", "Masa de modelar", "Play-Doh"], "query": "Modeling clay plasticine colorful bars roll"},
            {"id": 20, "name": "Carpeta", "aliases": ["Carpeta", "Carpetas", "Archivador", "Clasificador", "Folder"], "query": "Two ring binder folder cardboard stationery"},
            {"id": 21, "name": "Calculadora", "aliases": ["Calculadora", "Calculadora científica", "Calculator"], "query": "Electronic pocket calculator display buttons"},
            {"id": 22, "name": "Grapadora", "aliases": ["Grapadora", "Grapadoras", "Engrapadora", "Stapler"], "query": "Desktop stapler metal office stationery"},
            {"id": 23, "name": "Clips", "aliases": ["Clip", "Clips", "Sujetapapeles", "Paperclip"], "query": "Paper clips metallic colorful stationery"},
            {"id": 24, "name": "Chinchetas", "aliases": ["Chincheta", "Chinchetas", "Pines", "Tachuelas", "Push pins"], "query": "Push pins thumb tacks colorful cork board"},
            {"id": 25, "name": "Corrector líquido", "aliases": ["Corrector líquido", "Corrector", "Típex", "Tipex", "Tipp-Ex", "Liquid Paper"], "query": "Correction tape liquid white out stationery"},
            {"id": 26, "name": "Pizarra", "aliases": ["Pizarra", "Pizarrón", "Pizarra verde", "Chalkboard"], "query": "Green chalkboard school blackboard wooden frame"},
            {"id": 27, "name": "Tiza", "aliases": ["Tiza", "Tizas", "Gis", "Chalk"], "query": "Colored chalk sticks for blackboard school"},
            {"id": 28, "name": "Globo terráqueo", "aliases": ["Globo terráqueo", "Globo terraqueo", "Bola del mundo", "Globe"], "query": "Desk terrestrial globe sphere geography stand"},
            {"id": 29, "name": "Post-it", "aliases": ["Post-it", "Post it", "Notas adhesivas", "Notas post-it", "Sticky notes"], "query": "Yellow sticky notes pad stationery square"},
            {"id": 30, "name": "Grapas", "aliases": ["Grapas", "Caja de grapas", "Staples"], "query": "Box of staples steel office stationery"}
        ]
    },
    "especias_sazonadores": {
        "name": "Especias y Sazonadores",
        "description": "Hierbas aromáticas, semillas, condimentos y sazonadores culinarios",
        "icon": "🧂",
        "items": [
            {"id": 1, "name": "Pimienta negra", "aliases": ["Pimienta negra", "Pimienta", "Granos de pimienta", "Black pepper"], "query": "Black peppercorns spice bowl grains"},
            {"id": 2, "name": "Canela", "aliases": ["Canela", "Canela en rama", "Ramas de canela", "Cinnamon"], "query": "Cinnamon sticks spice roll tied wood"},
            {"id": 3, "name": "Orégano", "aliases": ["Orégano", "Oregano", "Oregano seco"], "query": "Dried oregano leaves spice in bowl herb"},
            {"id": 4, "name": "Azafrán", "aliases": ["Azafrán", "Azafran", "Hebras de azafrán", "Saffron"], "query": "Saffron threads red spice bowl stigma"},
            {"id": 5, "name": "Cúrcuma", "aliases": ["Cúrcuma", "Curcuma", "Cúrcuma en polvo", "Turmeric"], "query": "Turmeric powder root golden spice bowl"},
            {"id": 6, "name": "Romero", "aliases": ["Romero", "Ramas de romero", "Rosemary"], "query": "Fresh rosemary sprigs green herb leaves"},
            {"id": 7, "name": "Tomillo", "aliases": ["Tomillo", "Ramas de tomillo", "Thyme"], "query": "Fresh thyme sprigs herb bundle"},
            {"id": 8, "name": "Pimentón", "aliases": ["Pimentón", "Pimenton", "Paprika", "Pimentón dulce", "Pimentón de la Vera"], "query": "Paprika powder red spice wooden spoon bowl"},
            {"id": 9, "name": "Albahaca", "aliases": ["Albahaca", "Hojas de albahaca", "Basil"], "query": "Fresh basil leaves green sweet basil"},
            {"id": 10, "name": "Laurel", "aliases": ["Laurel", "Hojas de laurel", "Hoja de laurel", "Bay leaf"], "query": "Dried bay leaves laurel spice bowl"},
            {"id": 11, "name": "Comino", "aliases": ["Comino", "Comino en grano", "Semillas de comino", "Cumin"], "query": "Cumin seeds spice bowl whole grains"},
            {"id": 12, "name": "Clavo de olor", "aliases": ["Clavo de olor", "Clavo", "Clavos de olor", "Cloves"], "query": "Whole cloves spice aromatic bowl dried"},
            {"id": 13, "name": "Nuez moscada", "aliases": ["Nuez moscada", "Nutmeg"], "query": "Whole nutmeg seed spice grated kernel"},
            {"id": 14, "name": "Jengibre", "aliases": ["Jengibre", "Raíz de jengibre", "Ginger"], "query": "Fresh ginger root rhizome unpeeled fresh"},
            {"id": 15, "name": "Sal marina", "aliases": ["Sal", "Sal marina", "Sal gruesa", "Sal de mesa", "Salt"], "query": "Sea salt coarse crystals bowl white"},
            {"id": 16, "name": "Ajo en polvo", "aliases": ["Ajo en polvo", "Ajo granulado", "Garlic powder"], "query": "Garlic powder spice bowl dry ground"},
            {"id": 17, "name": "Perejil", "aliases": ["Perejil", "Perejil fresco", "Parsley"], "query": "Fresh parsley green leaves bunch herb"},
            {"id": 18, "name": "Cilantro", "aliases": ["Cilantro", "Coriandro", "Coriander"], "query": "Fresh coriander cilantro leaves herb bunch"},
            {"id": 19, "name": "Eneldo", "aliases": ["Eneldo", "Dill"], "query": "Fresh dill weed herb green fronds"},
            {"id": 20, "name": "Mostaza", "aliases": ["Mostaza", "Semillas de mostaza", "Granos de mostaza", "Mustard seeds"], "query": "Mustard seeds yellow black spice bowl"},
            {"id": 21, "name": "Cayena", "aliases": ["Cayena", "Pimienta de cayena", "Guindilla", "Chile en polvo", "Cayenne"], "query": "Cayenne pepper whole dried red chili peppers"},
            {"id": 22, "name": "Vainilla", "aliases": ["Vainilla", "Vaina de vainilla", "Vainas de vainilla", "Vanilla"], "query": "Vanilla pods beans whole cured dark spice"},
            {"id": 23, "name": "Curry", "aliases": ["Curry", "Curry en polvo", "Polvo de curry"], "query": "Curry powder yellow spice blend bowl spoon"},
            {"id": 24, "name": "Anís estrellado", "aliases": ["Anís estrellado", "Anis estrellado", "Star anise"], "query": "Star anise spice pods whole star shape"},
            {"id": 25, "name": "Cardamomo", "aliases": ["Cardamomo", "Cardamom"], "query": "Green cardamom pods spice bowl seeds"},
            {"id": 26, "name": "Estragón", "aliases": ["Estragón", "Estragon", "Tarragon"], "query": "Fresh tarragon sprigs herb green leaves"},
            {"id": 27, "name": "Hierbabuena", "aliases": ["Hierbabuena", "Menta", "Spearmint", "Mint"], "query": "Fresh spearmint leaves green fresh mint herb"},
            {"id": 28, "name": "Sésamo", "aliases": ["Sésamo", "Sesamo", "Ajonjolí", "Ajonjoli", "Sesame"], "query": "White sesame seeds spice bowl grains"},
            {"id": 29, "name": "Mejorana", "aliases": ["Mejorana", "Marjoram"], "query": "Dried marjoram herb leaves bowl seasoning"},
            {"id": 30, "name": "Wasabi", "aliases": ["Wasabi", "Rábano japonés"], "query": "Wasabi root rhizome green paste fresh grated"}
        ]
    },
    "colores": {
        "name": "Colores",
        "description": "Identifica tonalidades, colores primarios, secundarios y matices cromáticos",
        "icon": "🎨",
        "items": [
            {"id": 1, "name": "Rojo", "aliases": ["Rojo", "Red", "Colorado"], "hex": "#FF0000"},
            {"id": 2, "name": "Azul", "aliases": ["Azul", "Blue"], "hex": "#0000FF"},
            {"id": 3, "name": "Amarillo", "aliases": ["Amarillo", "Yellow"], "hex": "#FFFF00"},
            {"id": 4, "name": "Verde", "aliases": ["Verde", "Green"], "hex": "#008000"},
            {"id": 5, "name": "Naranja", "aliases": ["Naranja", "Anaranjado", "Orange"], "hex": "#FFA500"},
            {"id": 6, "name": "Morado", "aliases": ["Morado", "Púrpura", "Purpura", "Violeta", "Purple"], "hex": "#800080"},
            {"id": 7, "name": "Rosa", "aliases": ["Rosa", "Rosado", "Pink"], "hex": "#FFC0CB"},
            {"id": 8, "name": "Blanco", "aliases": ["Blanco", "White"], "hex": "#FFFFFF"},
            {"id": 9, "name": "Negro", "aliases": ["Negro", "Black"], "hex": "#000000"},
            {"id": 10, "name": "Gris", "aliases": ["Gris", "Grey", "Gray"], "hex": "#808080"},
            {"id": 11, "name": "Marrón", "aliases": ["Marrón", "Marron", "Café", "Cafe", "Castaño", "Brown"], "hex": "#8B4513"},
            {"id": 12, "name": "Cian", "aliases": ["Cian", "Celeste", "Azul cielo", "Cyan"], "hex": "#00FFFF"},
            {"id": 13, "name": "Magenta", "aliases": ["Magenta", "Fucsia oscuro"], "hex": "#FF00FF"},
            {"id": 14, "name": "Turquesa", "aliases": ["Turquesa", "Azul turquesa", "Turquoise"], "hex": "#40E0D0"},
            {"id": 15, "name": "Dorado", "aliases": ["Dorado", "Oro", "Gold", "Color oro"], "hex": "#FFD700"},
            {"id": 16, "name": "Plateado", "aliases": ["Plateado", "Plata", "Silver", "Color plata"], "hex": "#C0C0C0"},
            {"id": 17, "name": "Beige", "aliases": ["Beige", "Beis", "Arena", "Color arena"], "hex": "#F5F5DC"},
            {"id": 18, "name": "Granate", "aliases": ["Granate", "Burdeos", "Vino", "Rojo vino", "Maroon"], "hex": "#800000"},
            {"id": 19, "name": "Verde lima", "aliases": ["Verde lima", "Lima", "Lime", "Verde fluorescente"], "hex": "#32CD32"},
            {"id": 20, "name": "Verde oliva", "aliases": ["Verde oliva", "Oliva", "Verde militar", "Olive"], "hex": "#808000"},
            {"id": 21, "name": "Coral", "aliases": ["Coral", "Rojo coral"], "hex": "#FF7F50"},
            {"id": 22, "name": "Añil", "aliases": ["Añil", "Anil", "Índigo", "Indigo", "Azul marino oscuro"], "hex": "#4B0082"},
            {"id": 23, "name": "Fucsia", "aliases": ["Fucsia", "Fuchsia", "Rosa fuerte"], "hex": "#FF1493"},
            {"id": 24, "name": "Lavanda", "aliases": ["Lavanda", "Lila", "Lavender"], "hex": "#E6E6FA"},
            {"id": 25, "name": "Mostaza", "aliases": ["Mostaza", "Amarillo mostaza", "Mustard"], "hex": "#FFDB58"},
            {"id": 26, "name": "Salmón", "aliases": ["Salmón", "Salmon", "Color salmón"], "hex": "#FA8072"},
            {"id": 27, "name": "Ocre", "aliases": ["Ocre", "Amarillo ocre", "Ochre"], "hex": "#CC7722"},
            {"id": 28, "name": "Caqui", "aliases": ["Caqui", "Khaki", "Color caqui"], "hex": "#C3B091"},
            {"id": 29, "name": "Bronce", "aliases": ["Bronce", "Bronze", "Color bronce"], "hex": "#CD7F32"},
            {"id": 30, "name": "Aguamarina", "aliases": ["Aguamarina", "Verde agua", "Aquamarine"], "hex": "#7FFFD4"}
        ]
    },
    "tabla_periodica": {
        "name": "Tabla Periódica",
        "description": "Identifica los elementos químicos por su forma pura, mineral o símbolo",
        "icon": "🧪",
        "items": [
            {"id": 1, "name": "Oro", "aliases": ["Oro", "Au", "Gold", "Elemento oro"], "query": "Native gold nugget mineral specimen crystalline"},
            {"id": 2, "name": "Plata", "aliases": ["Plata", "Ag", "Silver", "Elemento plata"], "query": "Native silver wire mineral specimen crystal"},
            {"id": 3, "name": "Cobre", "aliases": ["Cobre", "Cu", "Copper", "Elemento cobre"], "query": "Native copper mineral specimen shiny metallic"},
            {"id": 4, "name": "Hierro", "aliases": ["Hierro", "Fe", "Iron", "Elemento hierro"], "query": "Iron pure metal electrolytic crystal specimen"},
            {"id": 5, "name": "Azufre", "aliases": ["Azufre", "S", "Sulfur", "Elemento azufre"], "query": "Native sulfur yellow mineral crystal specimen"},
            {"id": 6, "name": "Carbono", "aliases": ["Carbono", "C", "Diamante", "Grafito", "Elemento carbono"], "query": "Rough uncut diamond in kimberlite mineral"},
            {"id": 7, "name": "Mercurio", "aliases": ["Mercurio", "Hg", "Mercury", "Azogue"], "query": "Liquid mercury metal drops in petri dish"},
            {"id": 8, "name": "Plomo", "aliases": ["Plomo", "Pb", "Lead", "Elemento plomo"], "query": "Lead pure metal heavy grey specimen cube"},
            {"id": 9, "name": "Aluminio", "aliases": ["Aluminio", "Al", "Aluminium", "Aluminum"], "query": "Aluminium metal disc foil shiny cylinder"},
            {"id": 10, "name": "Silicio", "aliases": ["Silicio", "Si", "Silicon"], "query": "Silicon pure crystal specimen semiconductor shiny"},
            {"id": 11, "name": "Titanio", "aliases": ["Titanio", "Ti", "Titanium"], "query": "Titanium metal crystal bar lightweight metal"},
            {"id": 12, "name": "Platino", "aliases": ["Platino", "Pt", "Platinum"], "query": "Platinum pure metal nugget mineral crystal"},
            {"id": 13, "name": "Zinc", "aliases": ["Zinc", "Zn", "Cinc"], "query": "Zinc metal crystal shard fragment shiny"},
            {"id": 14, "name": "Estaño", "aliases": ["Estaño", "Estano", "Sn", "Tin"], "query": "Tin pure metal ingot crystal bar"},
            {"id": 15, "name": "Níquel", "aliases": ["Níquel", "Niquel", "Ni", "Nickel"], "query": "Nickel pure metal sphere pellet balls"},
            {"id": 16, "name": "Bismuto", "aliases": ["Bismuto", "Bi", "Bismuth"], "query": "Bismuth iridescent rainbow crystal hopper metal"},
            {"id": 17, "name": "Yodo", "aliases": ["Yodo", "I", "Iodine"], "query": "Iodine crystals purple violet solid element"},
            {"id": 18, "name": "Uranio", "aliases": ["Uranio", "U", "Uranium", "Autunita"], "query": "Autunite uranium mineral glowing green ultraviolet"},
            {"id": 19, "name": "Magnesio", "aliases": ["Magnesio", "Mg", "Magnesium"], "query": "Magnesium metal ribbon shiny turnings"},
            {"id": 20, "name": "Calcio", "aliases": ["Calcio", "Ca", "Calcium"], "query": "Calcium metal dendritic crystal pure element"},
            {"id": 21, "name": "Sodio", "aliases": ["Sodio", "Na", "Sodium"], "query": "Sodium metal chunks under mineral oil fresh cut"},
            {"id": 22, "name": "Potasio", "aliases": ["Potasio", "K", "Potassium"], "query": "Potassium metal under paraffin oil cut shiny"},
            {"id": 23, "name": "Fósforo", "aliases": ["Fósforo", "Fosforo", "P", "Fósforo blanco", "Fósforo rojo", "Phosphorus"], "query": "Red phosphorus powder chemical element"},
            {"id": 24, "name": "Cobalto", "aliases": ["Cobalto", "Co", "Cobalt"], "query": "Cobalt metal electrolytic cube blue metallic"},
            {"id": 25, "name": "Cromo", "aliases": ["Cromo", "Cr", "Chromium"], "query": "Chromium metal crystals shiny reflective pure"},
            {"id": 26, "name": "Wolframio", "aliases": ["Wolframio", "Volframio", "Tungsteno", "W", "Tungsten"], "query": "Tungsten incandescent lamp filament wire glowing"},
            {"id": 27, "name": "Neón", "aliases": ["Neón", "Neon", "Ne"], "query": "Neon discharge tube glowing reddish orange light"},
            {"id": 28, "name": "Helio", "aliases": ["Helio", "He", "Helium"], "query": "Helium gas discharge spectrum tube glowing orange"},
            {"id": 29, "name": "Bromo", "aliases": ["Bromo", "Br", "Bromine"], "query": "Bromine liquid vapor red brown sealed ampoule"},
            {"id": 30, "name": "Litio", "aliases": ["Litio", "Li", "Lithium"], "query": "Lithium metal ingots under mineral oil floating"}
        ]
    }
}

HEADERS = {'User-Agent': 'TheFloorTriviaGame/2.0 (trivia@thefloor.app; contact@thefloor.app) Python/3.14'}

def fetch_summary_image(title, lang='es'):
    try:
        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if 'originalimage' in data:
                return data['originalimage']['source']
            if 'thumbnail' in data:
                return data['thumbnail']['source']
    except Exception:
        pass
    return None

def fetch_wiki_search_image(query, lang='en'):
    try:
        search_url = f"https://{lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&format=json"
        req = urllib.request.Request(search_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data.get('query', {}).get('search'):
                return None
            title = data['query']['search'][0]['title']
        return fetch_summary_image(title, lang)
    except Exception:
        pass
    return None

def fetch_commons_image_url(query):
    try:
        url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for _, v in sorted(pages.items(), key=lambda x: x[1].get('index', 999)):
                info = v.get('imageinfo', [{}])[0]
                thumb = info.get('thumburl') or info.get('url')
                if thumb and not thumb.lower().endswith('.svg'):
                    return thumb
    except Exception:
        pass
    return None

def create_color_image(hex_color, output_path):
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    ppm_path = output_path + ".ppm"
    width, height = 800, 800
    with open(ppm_path, "wb") as f:
        f.write(f"P6\n{width} {height}\n255\n".encode('ascii'))
        row = bytes([r, g, b]) * width
        for _ in range(height):
            f.write(row)
    subprocess.run(["sips", "-s", "format", "jpeg", ppm_path, "--out", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(ppm_path):
        os.remove(ppm_path)

def download_and_convert(url, output_path):
    tmp_path = output_path + ".tmp"
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                with open(tmp_path, "wb") as out:
                    out.write(resp.read())
            subprocess.run(["sips", "-s", "format", "jpeg", tmp_path, "--out", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            return True
        except Exception as e:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            if "429" in str(e) and attempt < 3:
                time.sleep(random.uniform(2.0, 4.5))
            elif attempt == 3:
                raise e
    return False

def process_item(item, slug, cat_dir):
    num_str = f"{item['id']:02d}"
    img_filename = f"{slug}_{num_str}.jpg"
    img_path = os.path.join(cat_dir, img_filename)
    
    if os.path.exists(img_path) and os.path.getsize(img_path) > 1000:
        return f"[{slug}] {num_str} Ya existe"
    
    if "hex" in item:
        create_color_image(item["hex"], img_path)
        return f"[{slug}] {num_str} Color generado: {item['name']}"
    
    query = item.get("query", item["name"])
    
    # 1. Summary en ES
    img_url = fetch_summary_image(item["name"], 'es')
    # 2. Search en ES
    if not img_url:
        img_url = fetch_wiki_search_image(item["name"], 'es')
    # 3. Search en EN con query
    if not img_url:
        img_url = fetch_wiki_search_image(query, 'en')
    # 4. Search en EN con name
    if not img_url:
        img_url = fetch_wiki_search_image(item["name"], 'en')
    # 5. Commons search
    if not img_url:
        img_url = fetch_commons_image_url(query)
    
    if img_url:
        try:
            download_and_convert(img_url, img_path)
            return f"[{slug}] {num_str} ✔ {item['name']}"
        except Exception as e:
            return f"[{slug}] {num_str} ❌ Error en {item['name']}: {e}"
    
    # Si todo falla, creamos un placeholder visual estilizado
    create_color_image("#2A2D34", img_path)
    return f"[{slug}] {num_str} ⚠️ Creado fallback para: {item['name']}"

def process_all():
    base_dir = "/Users/ryuusei3/Downloads/the_floor/public/categories"
    tasks = []
    
    for slug, cat in CATEGORIES_DATA.items():
        cat_dir = os.path.join(base_dir, slug)
        os.makedirs(cat_dir, exist_ok=True)
        
        # 1. Guardar JSON
        json_items = []
        for item in cat["items"]:
            num_str = f"{item['id']:02d}"
            json_items.append({
                "id": item["id"],
                "name": item["name"],
                "aliases": item["aliases"],
                "category": slug,
                "image": f"{slug}_{num_str}.jpg"
            })
        
        json_path = os.path.join(cat_dir, f"{slug}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(json_items, f, ensure_ascii=False, indent=2)
        
        for item in cat["items"]:
            tasks.append((item, slug, cat_dir))
            
    print(f"Total items a procesar: {len(tasks)} con pool controlado...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(process_item, item, slug, cat_dir) for (item, slug, cat_dir) in tasks]
        for f in concurrent.futures.as_completed(futures):
            res = f.result()
            print(res)

if __name__ == "__main__":
    process_all()
