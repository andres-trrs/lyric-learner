import React, { useState, useRef, useEffect } from "react";

const extractVideoId = (url) => {
  if (!url) return "";
  url = url.trim();
  
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1].split("?")[0].split("&")[0];
  }
  
  if (url.includes("youtube.com/watch")) {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    } catch (e) {
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? match[1] : "";
    }
  }
  
  if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
    return url;
  }
  
  return "";
};

const extractVideoInfo = async (videoId) => {
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const data = await response.json();
    
    if (data.title) {
      const title = data.title;
      const parts = title.split('-').map(part => part.trim());
      
      if (parts.length >= 2) {
        return {
          artist: parts[0],
          track: parts[1].replace(/\(.*\)/g, '').trim()
        };
      } else {
        return {
          artist: '',
          track: title
        };
      }
    }
  } catch (error) {
    console.error('Error extracting video info:', error);
  }
  
  return { artist: '', track: '' };
};

export default function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [player, setPlayer] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [revealedWords, setRevealedWords] = useState({});
  const [difficulty, setDifficulty] = useState("Fácil");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputWord, setInputWord] = useState("");
  const [lives, setLives] = useState(3);
  const rectangleRef = useRef(null);
  const lineRefs = useRef([]);

  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // 🎨 color de fondo aleatorio (una sola vez al cargar)
  const [bgColor, setBgColor] = useState("#2c3e50");
  useEffect(() => {
    const colors = [
      "#e74c3c", "#9b59b6", "#2980b9", "#27ae60",
      "#f39c12", "#d35400", "#16a085", "#8e44ad",
      "#2ecc71", "#e67e22"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setBgColor(randomColor);
  }, []);

  // ⚙️ selector de vidas iniciales
  const [initialLives, setInitialLives] = useState(3);

  // YouTube IFrame API
  useEffect(() => {
    if (!window.YT && !window.ytApiLoading) {
      window.ytApiLoading = true;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      
      window.onYouTubeIframeAPIReady = () => {
        window.ytApiReady = true;
        if (videoId) {
          createPlayer(videoId);
        }
      };
    } else if (window.ytApiReady && videoId && !player) {
      createPlayer(videoId);
    }
  }, [videoId, player]);

  const createPlayer = (id) => {
    if (!id || !window.YT || !window.YT.Player) {
      return;
    }

    try {
      if (player) {
        player.destroy();
      }

      const ytPlayer = new window.YT.Player("youtube-player", {
        height: "315",
        width: "100%",
        videoId: id,
        playerVars: {
          'playsinline': 1,
          'controls': 1,
          'rel': 0
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
          },
          onError: (event) => {
            console.error("YouTube player error:", event.data);
            alert("Error cargando el video. Verifica que la URL sea válida.");
          }
        }
      });
      
    } catch (error) {
      console.error("Error creating YouTube player:", error);
    }
  };

  const handleUrlChange = async (url) => {
    setVideoUrl(url);
    
    if (url.trim()) {
      const id = extractVideoId(url);
      if (id) {
        setVideoId(id);
        
        const info = await extractVideoInfo(id);
        if (info.artist || info.track) {
          setArtistName(info.artist);
          setTrackName(info.track);
        }
      }
    }
  };

  const getDisplayText = (line, lineIndex) => {
    if (!line.blankPositions || line.blankPositions.length === 0) {
      return line.displayText;
    }

    const words = line.text.split(" ");
    return words.map((word, wordIndex) => {
      if (line.blankPositions.includes(wordIndex)) {
        const wordKey = `${lineIndex}-${wordIndex}`;
        return revealedWords[wordKey] || "_____";
      }
      return word;
    }).join(" ");
  };

  const handleLoadVideo = async () => {
    const id = extractVideoId(videoUrl);
    if (!id) {
      alert("URL de YouTube inválida");
      return;
    }

    if (!trackName.trim() || !artistName.trim()) {
      alert("Debes poner nombre de canción y artista");
      return;
    }

    setLoading(true);
    
    try {
      if (!player || player.getVideoData().video_id !== id) {
        setVideoId(id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const res = await fetch(
        `http://localhost:3001/captions?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}&difficulty=${encodeURIComponent(difficulty)}`
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data || data.length === 0) {
        alert("No se encontraron letras sincronizadas para esta canción");
        return;
      }

      setCaptions(data);
      setRevealedWords({});
      setCurrentIndex(0);
      setLives(initialLives); // 👈 usa el valor seleccionado
      setGameStarted(true);
      setWaitingInput(false);
      
    } catch (err) {
      console.error("Error loading captions:", err);
      alert("No se pudieron obtener las letras desde LRCLIB.");
    } finally {
      setLoading(false);
    }
  };

  // Controles internos para pausar/reproducir (UI removida, pero usados por el juego)
  const handlePlay = () => { 
    if (player && typeof player.playVideo === 'function') {
      player.playVideo(); 
    }
  };
  const handlePause = () => { 
    if (player && typeof player.pauseVideo === 'function') {
      player.pauseVideo(); 
    }
  };

  // Scroll centrado (línea activa en el medio)
  const scrollToCenter = (index) => {
    const container = rectangleRef.current;
    const el = lineRefs.current[index];
    if (!container || !el) return;

    const elTop = el.offsetTop;
    const elHeight = el.offsetHeight;
    const target = elTop - (container.clientHeight / 2) + (elHeight / 2);

    container.scrollTo({
      top: Math.max(0, target),
      behavior: "smooth"
    });
  };

  // Sincroniza tiempo -> línea activa, pausa si hay blanks
  useEffect(() => {
    let interval;
    if (player && captions.length > 0 && gameStarted) {
      interval = setInterval(() => {
        if (typeof player.getCurrentTime !== 'function') {
          return;
        }
        
        const time = player.getCurrentTime();
        
        if (!waitingInput) {
          let index = 0;
          for (let i = 0; i < captions.length; i++) {
            if (time >= captions[i].start) {
              index = i;
            } else {
              break;
            }
          }
          
          if (index !== currentIndex) {
            setCurrentIndex(index);
            scrollToCenter(index);

            const currentLine = captions[index];
            if (currentLine?.blanks?.length > 0 && !waitingInput) {
              handlePause();
              setWaitingInput(true);
            }
          }
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [player, captions, waitingInput, currentIndex, gameStarted]);

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && waitingInput && captions[currentIndex]) {
      const currentLine = captions[currentIndex];
      const currentBlankIndex = currentLine.currentBlankIndex || 0;
      const correctWord = currentLine.blanks[currentBlankIndex];
      
      const normalizedInput = normalizeText(inputWord);
      const normalizedCorrect = normalizeText(correctWord);
      
      if (normalizedInput === normalizedCorrect) {
        const wordIndexInLine = currentLine.blankPositions[currentBlankIndex];
        const wordKey = `${currentIndex}-${wordIndexInLine}`;
        
        setRevealedWords(prev => ({
          ...prev,
          [wordKey]: correctWord
        }));
        
        if (currentBlankIndex + 1 < currentLine.blanks.length) {
          const updatedCaptions = [...captions];
          updatedCaptions[currentIndex].currentBlankIndex = currentBlankIndex + 1;
          setCaptions(updatedCaptions);
          setInputWord("");
        } else {
          setWaitingInput(false);
          setInputWord("");
          handlePlay();
        }
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setInputWord("");
        
        if (newLives <= 0) {
          alert("💀 Has perdido. Reinicia el juego para intentar de nuevo.");
          setGameStarted(false);
          setWaitingInput(false);
        }
      }
    }
  };

  const resetGame = () => {
    // ahora refresca la página completa
    window.location.reload();
  };

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "1fr 1fr", 
      height: "100vh",
      fontFamily: "Arial, sans-serif"
    }}>
      {/* Video */}
      <div style={{ 
        borderRight: "2px solid #ddd", 
        padding: "20px",
        backgroundColor: "#f8f9fa"
      }}>
        <h2>🎬 Video</h2>
        
        <input
          type="text"
          placeholder="URL de YouTube"
          value={videoUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        
        <input
          type="text"
          placeholder="Nombre de la canción"
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        
        <input
          type="text"
          placeholder="Nombre del artista"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          style={{ width: "100%", marginBottom: "15px", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
        />

        <div style={{ marginBottom: "15px" }}>
          <label style={{ marginRight: "10px", fontWeight: "bold" }}>Dificultad:</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ padding: "5px", border: "1px solid #ddd", borderRadius: "4px", marginRight: "15px" }}
          >
            <option value="Fácil">Fácil</option>
            <option value="Medio">Medio</option>
            <option value="Difícil">Difícil</option>
          </select>
        </div>
        
        <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button 
            onClick={handleLoadVideo}
            disabled={loading}
            style={{ padding: "8px 16px", backgroundColor: loading ? "#ccc" : "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "⏳ Cargando..." : "🔗 Cargar"}
          </button>

          {/* selector de vidas iniciales */}
          <label style={{ fontWeight: "bold" }}>Vidas iniciales:</label>
          <select
            value={initialLives}
            onChange={(e) => setInitialLives(parseInt(e.target.value, 10))}
            style={{ padding: "5px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <button 
            onClick={resetGame}
            style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginLeft: "auto" }}
            title="Recarga toda la página"
          >
            🔄 Reset
          </button>
        </div>

        <div id="youtube-player" style={{ marginTop: "20px", border: "2px solid #ddd", borderRadius: "8px", overflow: "hidden" }}></div>
        
        {!videoId && (
          <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#e9ecef", borderRadius: "8px", textAlign: "center", color: "#6c757d" }}>
            El video aparecerá aquí
          </div>
        )}
      </div>

      {/* Juego de letras */}
      <div style={{ padding: "20px", backgroundColor: "#f1f3f5" }}>
        <h2>🎮 Juego de Letras</h2>

        <div
          ref={rectangleRef}
          style={{
            backgroundColor: bgColor,
            borderRadius: "15px",
            height: "60vh",
            overflowY: "auto",
            padding: "20px",
            color: "#ecf0f1",
            fontSize: "16px",
            fontWeight: "500",
            lineHeight: "1.6",
            position: "relative"
          }}
        >
          {captions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#95a5a6", marginTop: "50px" }}>
              Las letras aparecerán aquí
            </div>
          ) : (
            <>
              <div style={{ height: "30vh" }} /> {/* Espaciador superior */}
              {captions.map((line, idx) => (
                <div
                  key={idx}
                  ref={(el) => (lineRefs.current[idx] = el)}
                  style={{
                    color: idx === currentIndex ? "#ffffff" : "#ecf0f1",
                    fontSize: idx === currentIndex ? "20px" : "16px",
                    marginBottom: "15px",
                    padding: "5px",
                    transition: "all 0.3s ease",
                    backgroundColor: idx === currentIndex ? "rgba(255, 255, 255, 0.2)" : "transparent",
                    borderRadius: "5px",
                    borderLeft: idx === currentIndex ? "4px solid #fff" : "4px solid transparent",
                  }}
                >
                  {getDisplayText(line, idx)}
                </div>
              ))}
              <div style={{ height: "30vh" }} /> {/* Espaciador inferior */}
            </>
          )}
        </div>

        <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            ❤️ Vidas: {lives}
          </div>
          
          {gameStarted && (
            <div style={{ color: "#28a745", fontWeight: "bold" }}>
              🎵 {currentIndex + 1} / {captions.length}
            </div>
          )}
        </div>
        
        {waitingInput && (
          <div style={{ marginTop: "15px" }}>
            <input
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder="Escribe la palabra..."
              onKeyDown={handleKeyPress}
              autoFocus
              style={{ width: "100%", padding: "10px", fontSize: "16px", border: "2px solid #fff", borderRadius: "8px", outline: "none" }}
            />
            <div style={{ marginTop: "5px", fontSize: "14px", color: "#ecf0f1" }}>
              Presiona Enter para confirmar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
