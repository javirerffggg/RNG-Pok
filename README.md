# 🌟 Shiny RNG Manipulation Tool

PWA para la manipulación del Generador de Números Aleatorios (RNG) en los juegos de Pokémon (Generaciones 3, 4 y 5), con el objetivo de obtener Pokémon Variocolor (Shiny) de forma eficiente.

## ✨ Características

- **Módulo A – Seed Finder:** Identifica la semilla inicial a partir de los datos de tu consola y Pokémon capturado.
- **Módulo B – Target Finder:** Escanea millones de frames para encontrar el frame objetivo con tus filtros (Shiny, Naturaleza, IVs, Género, Habilidad).
- **Módulo C – Eon Timer:** Temporizador de precisión con alertas visuales y sonoras para sincronizar la pulsación.
- **Módulo D – Event Database:** Base de datos de cuántos frames avanza cada acción en el juego.
- **Perfiles de consola:** GBA, DS Lite, DSi, 3DS con sus delays específicos.
- **OCR Scanner:** Lectura automática de stats via cámara para calcular IVs.
- **Visualizador de avance:** Seguimiento interactivo del frame actual.
- **Modos de encuentro:** Stationary, Wild, Eggs (Masuda/RNG), Cute Charm.

## 🛠️ Stack Tecnológico

- **Frontend:** React + TypeScript
- **PWA:** Vite PWA Plugin + Service Worker
- **Estilos:** Tailwind CSS
- **RNG Engine:** Web Workers (multi-threading)
- **OCR:** Tesseract.js
- **Timer:** Web Audio API (alta precisión)
- **Almacenamiento:** IndexedDB (perfiles y configuración offline)

## 📐 Fundamentos Teóricos

### PRNG por Generación

| Generación | Algoritmo | Notas |
|---|---|---|
| Gen 3 & 4 | LCG (Linear Congruential Generator) | `seed = seed * 0x41C64E6D + 0x6073` |
| Gen 5+ | Mersenne Twister | Más complejo, usa parámetros de hardware |

### Ecuación Shiny

Para que un Pokémon sea Shiny:
```
(TID XOR SID XOR PID_upper XOR PID_lower) < 8   → probabilidad 1/8192
(TID XOR SID XOR PID_upper XOR PID_lower) < 16  → juegos modernos
```

## 🚀 Instalación y Desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/javirerffggg/RNG-Pok.git
cd RNG-Pok

# Instalar dependencias
npm install

# Arrancar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📦 Despliegue

La app está configurada para desplegarse en **Vercel** o **GitHub Pages** como PWA instalable.

## 📂 Estructura del Proyecto

```
RNG-Pok/
├── public/
│   ├── icons/          # Iconos PWA (192x192, 512x512)
│   └── screenshots/    # Screenshots para manifest
├── src/
│   ├── modules/
│   │   ├── SeedFinder/     # Módulo A
│   │   ├── TargetFinder/   # Módulo B
│   │   ├── EonTimer/       # Módulo C
│   │   └── EventDB/        # Módulo D
│   ├── workers/
│   │   └── rngWorker.ts    # Web Worker para cálculos pesados
│   ├── utils/
│   │   ├── lcg.ts          # Algoritmo LCG Gen 3/4
│   │   ├── mt.ts           # Mersenne Twister Gen 5
│   │   └── shiny.ts        # Ecuación Shiny
│   ├── hooks/
│   ├── components/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 📄 Licencia

MIT © 2026 javirerffggg
