// server.js
import express from "express";
import fetch from "node-fetch"; // npm install node-fetch@3

const app = express();
const PORT = 3001;

// CORS para que tu React pueda hacer fetch
import cors from "cors";
app.use(cors());

// Ruta para obtener letras sincronizadas
app.get("/captions", async (req, res) => {
  const { track_name, artist_name } = req.query;

  if (!track_name || !artist_name) {
    return res.status(400).json({ error: "track_name y artist_name son requeridos" });
  }

  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track_name)}&artist_name=${encodeURIComponent(artist_name)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.syncedLyrics) return res.json([]);

    // Parseamos LRC
    const lines = data.syncedLyrics.split("\n").map(line => {
      const match = line.match(/\[(\d+):(\d+).(\d+)\](.*)/);
      if (!match) return null;
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centis = parseInt(match[3]);
      const text = match[4].trim();
      return { start: minutes * 60 + seconds + centis / 100, text };
    }).filter(l => l !== null);

    res.json(lines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener la letra" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
