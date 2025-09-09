import fetch from "node-fetch";

const LRC_API = "https://api.lyrics.ovh/v1";

export async function fetchCaptions(artist, title) {
  try {
    const response = await fetch(`${LRC_API}/${artist}/${title}`);
    const data = await response.json();
    if (!data.lyrics) return [];
    
    const lines = data.lyrics.split("\n").map((text, index) => ({
      start: index,  // tiempo simulado, porque no hay timestamps
      text
    }));

    return lines;
  } catch (err) {
    console.error("Error obteniendo subtítulos:", err);
    return [];
  }
}
