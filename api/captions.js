// api/captions.js  (CommonJS para Vercel Serverless por defecto)
const fetch = global.fetch || (await import('node-fetch')).default;

// misma función que tenías en server.js
function generateBlanksForLine(text, difficulty) {
  if (!text || text.trim() === '') {
    return { originalText: text, displayText: text, blanks: [], blankPositions: [], currentBlankIndex: 0 };
  }
  const words = text.split(" ").filter(w => w.trim() !== '');
  if (words.length === 0) {
    return { originalText: text, displayText: text, blanks: [], blankPositions: [], currentBlankIndex: 0 };
  }

  let count = 1;
  if (difficulty === "Medio") count = Math.max(1, Math.floor(words.length / 3));
  if (difficulty === "Difícil") count = Math.max(1, Math.floor(words.length / 2));
  count = Math.max(1, Math.min(count, words.length));

  const blankIndices = [];
  while (blankIndices.length < count) {
    const idx = Math.floor(Math.random() * words.length);
    if (!blankIndices.includes(idx)) blankIndices.push(idx);
  }

  const displayWords = words.map((word, i) => (blankIndices.includes(i) ? "_____" : word));

  return {
    originalText: text,
    displayText: displayWords.join(" "),
    blanks: blankIndices.map(i => words[i]),
    blankPositions: blankIndices,
    currentBlankIndex: 0
  };
}

// handler
module.exports = async (req, res) => {
  try {
    const { track_name, artist_name, difficulty = "Fácil" } = req.query || {};
    if (!track_name || !artist_name) {
      res.status(400).json({ error: "track_name y artist_name son requeridos" });
      return;
    }

    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track_name)}&artist_name=${encodeURIComponent(artist_name)}`;
    const r = await fetch(url);
    if (!r.ok) {
      res.status(r.status).json({ error: `LRCLIB error status ${r.status}` });
      return;
    }
    const data = await r.json();

    if (!data.syncedLyrics) {
      res.json([]);
      return;
    }

    const lines = data.syncedLyrics
      .split("\n")
      .map(line => {
        const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
        if (!match) return null;
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centis = parseInt(match[3], 10);
        const text = match[4].trim();

        const withBlanks = generateBlanksForLine(text, difficulty);
        return {
          start: minutes * 60 + seconds + centis / 100,
          text: withBlanks.originalText,
          displayText: withBlanks.displayText,
          blanks: withBlanks.blanks,
          blankPositions: withBlanks.blankPositions,
          currentBlankIndex: 0
        };
      })
      .filter(l => l && l.text.trim() !== "");

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    res.status(200).json(lines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener la letra" });
  }
};
