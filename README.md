# 🎵 YouTube Lyrics Game

<div align="center">

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![YouTube API](https://img.shields.io/badge/YouTube-API-FF0000?style=flat-square&logo=youtube&logoColor=white)
![LRCLIB](https://img.shields.io/badge/LRCLIB-API-9B59B6?style=flat-square)

**¡Memoriza las letras de tus canciones favoritas de forma divertida y desafiante! 🎤**

</div>

---

## 🌟 Características Principales

### 🎮 **Gameplay Interactivo**
- **Sincronización perfecta** entre el video de YouTube y las letras
- **Sistema de blanks** que se revelan progresivamente
- **Pausa automática** en cada verso con palabras faltantes
- **Feedback visual y sonoro** para aciertos y errores

### 🎯 **Niveles de Dificultad**
- **🟢 Fácil:** Pocas palabras ocultas, salto completa toda la línea
- **🟡 Medio:** Dificultad balanceada  
- **🔴 Difícil:** Muchas palabras ocultas, máximo desafío

### 🎨 **Interfaz Moderna**
- **🌓 Tema claro/oscuro** con toggle animado
- **🎨 Colores aleatorios** para el panel de letras
- **📱 Diseño responsivo** en grid layout
- **✨ Animaciones fluidas** y efectos visuales

### 🎵 **Audio y Efectos**
- **🔊 Sonidos dinámicos** generados con Web Audio API
- **⏰ Cuenta regresiva** con beeps antes de empezar
- **🎉 Lluvia de emojis** para celebrar logros y errores
- **🎶 Efectos sonoros** diferenciados por acción

## 🚀 Demo en Vivo

🎮 **¡Juega ahora!** → [https://andres-lyric-learner.vercel.app](https://andres-lyric-learner.vercel.app)

### Instalación Local

```bash
# Clona el repositorio
git clone https://github.com/tuusuario/youtube-lyrics-game.git

# Instala las dependencias
cd youtube-lyrics-game
npm install

# Inicia el servidor de desarrollo
npm start
```

## 🎯 Cómo Jugar

### 1️⃣ **Configuración Inicial**
```
🔗 Pega la URL de YouTube de tu canción favorita
🎵 Introduce el nombre de la canción
👨‍🎤 Añade el nombre del artista
⚙️ Selecciona la dificultad (Fácil/Medio/Difícil)
❤️ Configura vidas iniciales (1-10)
⏭️ Configura saltos disponibles (0-10)
```

### 2️⃣ **¡A Jugar!**
- Presiona **▶️ Play** en el video para comenzar
- El juego pausará automáticamente en cada verso con blanks
- **Escribe la palabra faltante** y presiona `Enter`
- Usa **⏭️ Saltos** cuando te quedes atascado
- ¡Completa toda la canción sin quedarte sin vidas!

### 3️⃣ **Controles del Juego**
| Acción | Control |
|--------|---------|
| Confirmar palabra | `Enter` |
| Saltar blank | Botón **⏭️ Salto** |
| Cambiar tema | 🌗 Toggle superior derecha |
| Reiniciar juego | 🔄 **Reset** |

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- ⚛️ **React 18** - Biblioteca principal
- 🎨 **CSS-in-JS** - Estilos dinámicos y temas
- 📱 **Responsive Grid** - Layout adaptable

### **APIs Externas**
- 🎬 **YouTube IFrame API** - Reproductor de video integrado
- 🎵 **LRCLIB API** - Letras sincronizadas de canciones
- 🎯 **Noembed API** - Extracción de metadatos de video

### **Características Técnicas**
- 🔊 **Web Audio API** - Generación de sonidos dinámicos
- ⏱️ **Sincronización temporal** - Control preciso del timing
- 🎨 **Animaciones CSS** - Efectos visuales fluidos
- 💾 **Estado local** - Gestión completa con React hooks

## 📁 Estructura del Proyecto

```
src/
├── App.js                 # Componente principal
├── utils/
│   ├── extractVideoId()   # Extrae ID de URLs de YouTube  
│   ├── extractVideoInfo() # Obtiene metadatos del video
│   └── normalizeText()    # Normaliza texto para comparaciones
├── hooks/
│   ├── useYouTubePlayer() # Manejo del reproductor de YouTube
│   ├── useAudioEffects()  # Efectos de sonido dinámicos
│   └── useGameState()     # Estado global del juego
└── components/
    ├── VideoPanel.js      # Panel izquierdo con video
    ├── LyricsPanel.js     # Panel derecho con letras
    ├── GameControls.js    # Controles del juego
    └── ThemeToggle.js     # Interruptor de tema
```

## ⚙️ Configuración y Personalización

### 🎨 **Personalizar Colores**
```javascript
const colors = [
  "#e74c3c", "#9b59b6", "#2980b9", "#27ae60",
  "#f39c12", "#d35400", "#16a085", "#8e44ad",
  "#2ecc71", "#e67e22"
];
```

### 🔊 **Ajustar Efectos de Sonido**
```javascript
// Frecuencias de audio personalizables
const playBeep = (freq = 880, duration = 250, gain = 0.2) => {
  // Personaliza tus efectos sonoros aquí
};
```

### 🎯 **Configurar Dificultades**
- **Fácil:** 1-2 blanks por línea, salto completa línea completa
- **Medio:** 2-4 blanks por línea, salto por palabra
- **Difícil:** 4+ blanks por línea, salto por palabra

## 🎵 APIs y Servicios

### **LRCLIB Integration**
```javascript
const endpoint = `/api/captions?track_name=${trackName}&artist_name=${artistName}&difficulty=${difficulty}`;
```

### **YouTube Data Extraction**
```javascript
const extractVideoId = (url) => {
  // Soporta formatos:
  // - youtube.com/watch?v=VIDEO_ID
  // - youtu.be/VIDEO_ID  
  // - VIDEO_ID directo
};
```

## 🎉 Características Especiales

### 🌈 **Sistema de Efectos Visuales**
- **Lluvia de emojis** diferenciada por contexto:
  - 😢 Emojis tristes al perder vidas
  - 🎉 Emojis de celebración al ganar
  - ⏩ Emoji de salto al usar skips

### 🔊 **Audio Procedural**
- **Sonidos generados dinámicamente** sin archivos de audio
- **Diferentes tonos** para cada acción del juego
- **Arpeggios y glides** para mayor expresividad

### ⏰ **Sincronización Inteligente**
- **Scroll automático** que centra la línea actual
- **Pausa predictiva** antes de cada blank
- **Tolerancia de timing** para mejor UX

## 🔮 Roadmap y Futuras Características

### 🎯 **Próximos Modos de Juego**
- **⚡ Modo Rápido:** Completa la canción en tiempo récord
- **🎯 Modo Precisión:** Sin vidas, perfección absoluta requerida
- **🎵 Modo Karaoke:** Canta junto con las letras reveladas
- **🔀 Modo Aleatorio:** Blanks en posiciones impredecibles
- **📚 Modo Playlist:** Juega canciones consecutivas

### 📊 **Sistema de Puntuación (Próximamente)**
- **🏆 Puntuación por canción** basada en:
  - Aciertos consecutivos
  - Tiempo de respuesta  
  - Dificultad seleccionada
  - Vidas restantes

### ✨ **Mejoras Planificadas**
- **🎨 Más temas visuales** y personalizaciones
- **📱 Optimización móvil**
- **🔍 Búsqueda avanzada** de canciones

### ❌ **Video no carga**
- ✅ Verifica que la URL de YouTube sea válida
- ✅ Comprueba que el video sea público
- ✅ Asegúrate de tener conexión a internet

### ❌ **No encuentra letras**
- ✅ Verifica la ortografía del artista y canción
- ✅ Prueba con variantes del nombre (ej: "feat.", "ft.")
- ✅ Asegúrate de que la canción tenga letras en LRCLIB

### ❌ **Audio no funciona**
- ✅ Verifica que tu navegador soporte Web Audio API
- ✅ Comprueba que no tengas el audio muteado
- ✅ Interactúa con la página antes de comenzar (política de autoplay)

## 🐛 Resolución de Problemas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ve el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- 🎵 **LRCLIB** por proporcionar letras sincronizadas gratuitas
- 🎬 **YouTube** por su API de reproductor embebido
- ⚛️ **React Team** por esta increíble biblioteca
- 🎨 **Comunidad Open Source** por la inspiración constante

---

<div align="center">

**¡Hecho con ❤️ para los amantes de la música!**

🎵 **¿Qué tan bien conoces las letras de tus canciones favoritas?** 🎵

⭐ **¡No olvides dar una estrella si te gustó el proyecto!** ⭐

</div>
