// App.jsx
import React, { useState, useRef, useEffect } from "react";

// ------------------ Utils ------------------
const generateBlanks = (lines, difficulty) => {
  return lines.map(line => {
    const words = line.text.split(" ");
    let count = 1;
    if (difficulty === "Medio") count = Math.max(1, Math.floor(words.length / 3));
    if (difficulty === "Difícil") count = Math.max(1, Math.floor(words.length / 2));

    let blankIndices = [];
    while (blankIndices.length < count) {
      const idx = Math.floor(Math.random() * words.length);
      if (!blankIndices.includes(idx)) blankIndices.push(idx);
    }

    const blanks = words.map((w, i) =>
      blankIndices.includes(i) ? "_____" : w
    );

    return {
      start: line.start,
      text: line.text,
      displayText: blanks.join(" "),
      blanks: blankIndices.map(i => words[i])
    };
  });
};

// ------------------ Component ------------------
export default function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [player, setPlayer] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [difficulty, setDifficulty] = useState("Fácil");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputWord, setInputWord] = useState("");
  const [lives, setLives] = useState(3);
  const rectangleRef = useRef(null);

  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");

  // ------------------ YouTube IFrame ------------------
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      if (videoId) createPlayer(videoId);
    };
  }, [videoId]);

  const extractVideoId = (url) => {
    if (!url) return "";
    if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
    if (url.includes("youtube.com/watch")) {
      const params = new URLSearchParams(url.split("?")[1]);
      return params.get("v");
    }
    return "";
  };

  const createPlayer = (id) => {
    if (player) player.destroy();
    const ytPlayer = new window.YT.Player("player", {
      height: "315",
      width: "100%",
      videoId: id,
      events: { onReady: () => {} },
    });
    setPlayer(ytPlayer);
  };

  // ------------------ Cargar video y letras ------------------
  const handleLoadVideo = async () => {
    const id = extractVideoId(videoUrl);
    if (!id) return alert("URL inválida");
    setVideoId(id);

    if (!trackName || !artistName) {
      alert("Debes poner nombre de canción y artista");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/captions?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`
      );
      const data = await res.json();
      const linesWithBlanks = generateBlanks(data, difficulty);
      setCaptions(linesWithBlanks);
      setCurrentIndex(0);
      setLives(3);
    } catch (err) {
      console.error(err);
      alert("No se pudieron obtener subtítulos desde LRCLIB");
    }
  };

  const handlePlay = () => { if (player) player.playVideo(); };
  const handlePause = () => { if (player) player.pauseVideo(); };

  // ------------------ Letra animada ------------------
  useEffect(() => {
    let interval;
    if (player && captions.length > 0) {
      interval = setInterval(() => {
        const time = player.getCurrentTime();
        if (!waitingInput) {
          let index = 0;
          for (let i = 0; i < captions.length; i++) {
            if (time >= captions[i].start) index = i;
          }
          setCurrentIndex(index);

          // Pausar si hay blanks
          if (captions[index]?.blanks?.length > 0 && !waitingInput) {
            player.pauseVideo();
            setWaitingInput(true);
          }

          // Animación de desplazamiento
          rectangleRef.current?.scrollTo({ top: index * 30, behavior: "smooth" });
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [player, captions, waitingInput]);

  // ------------------ Validar input ------------------
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && waitingInput) {
      const correctWord = captions[currentIndex].blanks[0];
      if (inputWord.trim().toLowerCase() === correctWord.toLowerCase()) {
        setWaitingInput(false);
        setInputWord("");
        if (player) player.playVideo();
      } else {
        setLives(prev => prev - 1);
        setInputWord("");
        if (lives - 1 <= 0) alert("💀 Has perdido. Recarga el juego.");
      }
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh" }}>
      {/* Video */}
      <div style={{ borderRight: "2px solid #ddd", padding: "20px" }}>
        <h2>🎬 Video</h2>
        <input
          type="text"
          placeholder="URL de YouTube"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
          onKeyPress={(e) => { if (e.key === "Enter") handleLoadVideo(); }}
        />
        <input
          type="text"
          placeholder="Nombre de la canción"
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
        <input
          type="text"
          placeholder="Nombre del artista"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
        <button onClick={handleLoadVideo}>🔗 Cargar Video + Letras</button>
        <button onClick={handlePlay}>▶ Play</button>
        <button onClick={handlePause}>⏸ Pause</button>

        <div id="player" style={{ marginTop: "20px" }}></div>
      </div>

      {/* Juego de letras */}
      <div style={{ padding: "20px" }}>
        <h2>🎮 Juego de Letras</h2>
        <p>Dificultad:</p>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option>Fácil</option>
          <option>Medio</option>
          <option>Difícil</option>
        </select>

        <div
          ref={rectangleRef}
          style={{
            marginTop: "20px",
            backgroundColor: "#FF5733",
            borderRadius: "20px",
            height: "60vh",
            overflowY: "auto",
            padding: "20px",
            color: "#ccc",
            fontSize: "18px",
            fontWeight: "bold"
          }}
          tabIndex={0}
          onKeyDown={handleKeyPress}
        >
          {captions.map((line, idx) => (
            <div
              key={idx}
              style={{
                color: idx === currentIndex ? "#ffffff" : "#555555",
                fontSize: idx === currentIndex ? "24px" : "18px",
                marginBottom: "10px",
                transition: "all 0.3s ease"
              }}
            >
              {idx === currentIndex ? line.displayText : line.text}
            </div>
          ))}
        </div>

        <p>Vidas: {lives}</p>
        {waitingInput && <input
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder="Escribe la palabra..."
          onKeyDown={handleKeyPress}
          autoFocus
          style={{ marginTop: "10px", padding: "5px", width: "100%" }}
        />}
      </div>
    </div>
  );
}
