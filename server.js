// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());

// Función para generar blanks en el servidor
const generateBlanksForLine = (text, difficulty) => {
  if (!text || text.trim() === '') {
    return {
      originalText: text,
      displayText: text,
      blanks: [],
      blankPositions: []
    };
  }

  const words = text.split(" ").filter(word => word.trim() !== '');
  if (words.length === 0) {
    return {
      originalText: text,
      displayText: text,
      blanks: [],
      blankPositions: []
    };
  }

  // Determinar cuántas palabras ocultar según dificultad
  let count = 1;
  if (difficulty === "Medio") count = Math.max(1, Math.floor(words.length / 3));
  if (difficulty === "Difícil") count = Math.max(1, Math.floor(words.length / 2));
  
  // Asegurar que siempre haya al menos 1 blank
  count = Math.max(1, Math.min(count, words.length));

  // Seleccionar índices aleatorios para los blanks
  let blankIndices = [];
  while (blankIndices.length < count) {
    const idx = Math.floor(Math.random() * words.length);
    if (!blankIndices.includes(idx)) {
      blankIndices.push(idx);
    }
  }

  // Crear el texto con blanks
  const displayWords = words.map((word, i) =>
    blankIndices.includes(i) ? "_____" : word
  );

  return {
    originalText: text,
    displayText: displayWords.join(" "),
    blanks: blankIndices.map(i => words[i]),
    blankPositions: blankIndices,
    currentBlankIndex: 0
  };
};

// Ruta para obtener letras sincronizadas
app.get("/captions", async (req, res) => {
  const { track_name, artist_name, difficulty = "Fácil" } = req.query;

  if (!track_name || !artist_name) {
    return res.status(400).json({ error: "track_name y artist_name son requeridos" });
  }

  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track_name)}&artist_name=${encodeURIComponent(artist_name)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.syncedLyrics) {
      return res.json([]);
    }

    // Parsear LRC y aplicar blanks
    const lines = data.syncedLyrics.split("\n").map(line => {
      const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
      if (!match) return null;
      
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centis = parseInt(match[3]);
      const text = match[4].trim();
      
      // Generar blanks para esta línea
      const lineWithBlanks = generateBlanksForLine(text, difficulty);
      
      return {
        start: minutes * 60 + seconds + centis / 100,
        text: lineWithBlanks.originalText,  // Texto completo original para comparar
        displayText: lineWithBlanks.displayText,  // Texto con blanks para mostrar
        blanks: lineWithBlanks.blanks,  // Array con las palabras que faltan
        blankPositions: lineWithBlanks.blankPositions,  // Posiciones de los blanks
        currentBlankIndex: 0
      };
    }).filter(l => l !== null && l.text.trim() !== '');

    res.json(lines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener la letra" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});