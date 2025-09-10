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

  // 🎨 color de fondo aleatorio (una sola vez al cargar) para el panel de letras
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

  // ⚙️ selector de vidas/saltos iniciales
  const [initialLives, setInitialLives] = useState(3);
  const [initialSkips, setInitialSkips] = useState(3);
  const [skips, setSkips] = useState(3);

  // 🔔 Cuenta regresiva al primer play
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [count, setCount] = useState(null);
  const firstPlayHandledRef = useRef(false);
  const audioCtxRef = useRef(null);

  // 🌟 FX de lluvia de emojis
  const [fxParticles, setFxParticles] = useState([]); // array de spans
  const fxTimeoutRef = useRef(null);

  // 🌗 Tema (claro/oscuro)
  const [theme, setTheme] = useState("light"); // "light" | "dark"
  const isDark = theme === "dark";
  const pageBg = isDark ? "#333841" : "#ffffff"; // plomo en oscuro, blanco en claro
  const pageFg = isDark ? "#ffffff" : "#111111"; // blanco en oscuro, negro en claro
  const panelLeftBg = isDark ? "#2b2f36" : "#f8f9fa"; // columna video
  const borderCol = isDark ? "#3f4652" : "#ddd";
  const softText = isDark ? "#c9ced6" : "#6c757d";
  const inputBg = isDark ? "#3a3f47" : "#ffffff";
  const inputBorder = isDark ? "#555c66" : "#ddd";
  const inputColor = isDark ? "#eef2f6" : "#111";

  useEffect(() => {
    document.body.style.backgroundColor = pageBg;
    document.body.style.color = pageFg;
    document.body.style.margin = 0;
  }, [pageBg, pageFg]);

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

      new window.YT.Player("youtube-player", {
        height: "315",
        width: "100%",
        videoId: id,
        playerVars: {
          playsinline: 1,
          controls: 1,
          rel: 0
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
          },
          onStateChange: (event) => {
            // ▶️ Primera vez que el usuario presiona Play en el reproductor
            if (
              event.data === window.YT.PlayerState.PLAYING &&
              !firstPlayHandledRef.current &&
              !isCountingDown
            ) {
              firstPlayHandledRef.current = true;
              try { event.target.pauseVideo(); } catch {}
              startCountdown(() => {
                try { event.target.playVideo(); } catch {}
              });
            }
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

  // ====== AUDIO HELPERS ======
  const ensureAudioCtx = async () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state !== "running") {
      try { await audioCtxRef.current.resume(); } catch {}
    }
    return audioCtxRef.current;
  };

  const playTone = async (freq = 880, durationMs = 250, gain = 0.2, type = "sine") => {
    const ctx = await ensureAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
    return new Promise(r => setTimeout(r, durationMs));
  };

  const playBeep = (freq = 880, durationMs = 250, gain = 0.2) => playTone(freq, durationMs, gain, "sine");

  const playAwww = async () => {
    // un glide descendente estilo "awww"
    await playTone(600, 200, 0.25, "triangle");
    await playTone(480, 200, 0.22, "triangle");
    await playTone(360, 400, 0.2, "sine");
  };

  const playCelebrate = async () => {
    // arpegio alegre
    await playTone(880, 160, 0.22, "sine");
    await playTone(1175, 160, 0.22, "sine");
    await playTone(1568, 320, 0.24, "triangle");
  };

  const playChime = async () => {
    // campanilla breve
    await playTone(1200, 180, 0.22, "sine");
  };

  // ====== COUNTDOWN ======
  const startCountdown = async (onFinish) => {
    setIsCountingDown(true);

    setCount(3);
    await playBeep(820, 220);
    await new Promise(r => setTimeout(r, 600));

    setCount(2);
    await playBeep(900, 220);
    await new Promise(r => setTimeout(r, 600));

    setCount(1);
    await playBeep(980, 700); // beeeeep
    await new Promise(r => setTimeout(r, 800));

    setIsCountingDown(false);
    setCount(null);
    if (typeof onFinish === "function") onFinish();
  };

  // ====== FX EMOJI RAIN ======
  const makeParticles = (emojis, count = 60) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const left = Math.random() * 100; // %
      const size = 18 + Math.random() * 38; // px
      const duration = 1.2 + Math.random() * 1.6; // s
      const delay = Math.random() * 0.9; // s
      const rotate = (Math.random() * 360) * (Math.random() > 0.5 ? 1 : -1);
      arr.push({ id: `${Date.now()}-${i}`, emoji, left, size, duration, delay, rotate });
    }
    return arr;
  };

  const triggerFx = async (type) => {
    // seleccionar emojis y sonido
    let emojis = [];
    if (type === "lose") {
      emojis = ["😥","😣","😓","😔","😢","😭","😰"];
      playAwww();
    } else if (type === "win") {
      emojis = ["😀","😁","😉","🤗","🥳","🎉","🎈"];
      playCelebrate();
    } else if (type === "skip") {
      emojis = ["⏩"];
      playChime();
    } else {
      return;
    }

    const parts = makeParticles(emojis, type === "skip" ? 40 : 70);
    setFxParticles(parts);

    // limpiar después del máximo duration + delay
    if (fxTimeoutRef.current) clearTimeout(fxTimeoutRef.current);
    const maxMillis = Math.max(...parts.map(p => (p.duration + p.delay) * 1000)) + 200;
    fxTimeoutRef.current = setTimeout(() => {
      setFxParticles([]);
    }, maxMillis);
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
    if (!id) return alert("URL de YouTube inválida");
    if (!trackName.trim() || !artistName.trim()) return alert("Debes poner nombre de canción y artista");

    setLoading(true);
    try {
      if (!player || player.getVideoData().video_id !== id) {
        setVideoId(id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const res = await fetch(
        `http://localhost:3001/captions?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}&difficulty=${encodeURIComponent(difficulty)}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (!data || data.length === 0) return alert("No se encontraron letras sincronizadas para esta canción");

      // Ordenar blanks y asegurar currentBlankIndex
      const processed = data.map((line) => {
        if (!line?.blanks || !line?.blankPositions) return line;
        const pairs = line.blankPositions.map((pos, i) => ({ pos, word: line.blanks[i] }));
        pairs.sort((a, b) => a.pos - b.pos);
        return {
          ...line,
          blanks: pairs.map(p => p.word),
          blankPositions: pairs.map(p => p.pos),
          currentBlankIndex: 0,
        };
      });

      setCaptions(processed);
      setRevealedWords({});
      setCurrentIndex(0);
      setLives(initialLives);
      setSkips(initialSkips);
      setGameStarted(true);
      setWaitingInput(false);
      firstPlayHandledRef.current = false; // permitir countdown en nueva carga
    } catch (err) {
      console.error("Error loading captions:", err);
      alert("No se pudieron obtener las letras desde LRCLIB.");
    } finally {
      setLoading(false);
    }
  };

  // Controles internos (UI sin botones)
  const handlePlay = () => { 
    if (player && typeof player.playVideo === 'function') player.playVideo(); 
  };
  const handlePause = () => { 
    if (player && typeof player.pauseVideo === 'function') player.pauseVideo(); 
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

  // Sincroniza tiempo -> línea activa y PAUSA en cada timestamp con blanks (incluye la primera)
  useEffect(() => {
    let interval;
    if (player && captions.length > 0 && gameStarted && !isCountingDown) {
      interval = setInterval(() => {
        if (typeof player.getCurrentTime !== 'function') return;
        const time = player.getCurrentTime();

        // calcular índice de línea actual
        let index = 0;
        for (let i = 0; i < captions.length; i++) {
          if (time >= captions[i].start) index = i;
          else break;
        }

        // actualizar índice/scroll si cambió
        if (index !== currentIndex) {
          setCurrentIndex(index);
          scrollToCenter(index);
        }

        // Pausar al llegar al timestamp si hay blanks pendientes
        const currentLine = captions[index];
        if (!currentLine) return;

        const currentStart = currentLine.start ?? 0;
        const reached = time + 0.05 >= currentStart; // tolerancia 50ms
        const hasBlanks = (currentLine.blanks?.length ?? 0) > 0;
        const cbi = typeof currentLine.currentBlankIndex === 'number' ? currentLine.currentBlankIndex : 0;
        const pending = hasBlanks && cbi < currentLine.blanks.length;

        if (reached && pending && !waitingInput) {
          handlePause();
          setWaitingInput(true);
        }
      }, 100);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [player, captions, currentIndex, waitingInput, gameStarted, isCountingDown]);

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const checkWinIfNeeded = (lineJustCompleted) => {
    // ganar si acabas de completar la última línea con blanks
    if (currentIndex === captions.length - 1 && (lineJustCompleted?.blanks?.length ?? 0) > 0) {
      triggerFx("win");
    }
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
          const updated = [...captions];
          updated[currentIndex] = {
            ...updated[currentIndex],
            currentBlankIndex: currentBlankIndex + 1
          };
          setCaptions(updated);
          setInputWord("");
        } else {
          const updated = [...captions];
          updated[currentIndex] = {
            ...updated[currentIndex],
            currentBlankIndex: currentLine.blanks.length
          };
          setCaptions(updated);
          setWaitingInput(false);
          setInputWord("");
          handlePlay();
          checkWinIfNeeded(currentLine);
        }
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setInputWord("");
        
        if (newLives <= 0) {
          // perder: animación + sonido; parar juego y pausar video
          setGameStarted(false);
          setWaitingInput(false);
          try { handlePause(); } catch {}
          triggerFx("lose");
        }
      }
    }
  };

  // 👇 Lógica del botón de Salto
  const handleSkip = () => {
    if (!waitingInput || skips <= 0 || !captions[currentIndex]) return;

    const updated = [...captions];
    const line = updated[currentIndex];
    const cbi = line.currentBlankIndex || 0;

    const correctWord = line.blanks[cbi];
    const wordIndexInLine = line.blankPositions[cbi];
    const wordKey = `${currentIndex}-${wordIndexInLine}`;

    setRevealedWords(prev => ({
      ...prev,
      [wordKey]: correctWord
    }));

    triggerFx("skip"); // animación + sonido de salto

    if (difficulty === "Fácil" || cbi + 1 >= line.blanks.length) {
      updated[currentIndex] = {
        ...line,
        currentBlankIndex: line.blanks.length
      };
      setCaptions(updated);
      setWaitingInput(false);
      setInputWord("");
      setSkips((s) => s - 1);
      handlePlay();
      // si es la última línea, considerar win
      checkWinIfNeeded(line);
    } else {
      updated[currentIndex] = {
        ...line,
        currentBlankIndex: cbi + 1
      };
      setCaptions(updated);
      setInputWord("");
      setSkips((s) => s - 1);
    }
  };

  const resetGame = () => {
    window.location.reload();
  };

  // 🌗 Toggle de tema (slider con sol/luna)
  const ThemeToggle = () => (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Cambiar tema"
      title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 10000,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer"
      }}
    >
      <div
        style={{
          width: 64,
          height: 32,
          borderRadius: 32,
          background: isDark ? "#1f232a" : "#e6e6e6",
          border: `1px solid ${isDark ? "#3a3f47" : "#d0d0d0"}`,
          position: "relative",
          boxShadow: isDark ? "inset 0 0 0 1px rgba(255,255,255,0.05)" : "inset 0 0 0 1px rgba(0,0,0,0.03)"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: isDark ? 34 : 2,
            width: 28,
            height: 28,
            borderRadius: 28,
            background: isDark ? "#0f1115" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "left 0.22s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
          }}
        >
          <span style={{ fontSize: 16 }}>{isDark ? "🌙" : "☀️"}</span>
        </div>
      </div>
    </button>
  );

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "1fr 1fr", 
      height: "100vh",
      fontFamily: "Arial, sans-serif",
      backgroundColor: pageBg,
      color: pageFg
    }}>
      {/* estilos para animación de caída */}
      <style>{`
        @keyframes emoji-fall {
          0%   { transform: translateY(-12vh) rotate(0deg); opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      <ThemeToggle />

      {/* Video */}
      <div style={{ 
        borderRight: `2px solid ${borderCol}`, 
        padding: "20px",
        backgroundColor: panelLeftBg
      }}>
        <h2 style={{ marginTop: 0 }}>🎬 Video</h2>
        
        <input
          type="text"
          placeholder="URL de YouTube"
          value={videoUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          style={{ 
            width: "100%", marginBottom: "10px", padding: "8px",
            backgroundColor: inputBg, color: inputColor,
            border: `1px solid ${inputBorder}`, borderRadius: "4px"
          }}
        />
        
        <input
          type="text"
          placeholder="Nombre de la canción"
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          style={{ 
            width: "100%", marginBottom: "10px", padding: "8px",
            backgroundColor: inputBg, color: inputColor,
            border: `1px solid ${inputBorder}`, borderRadius: "4px"
          }}
        />
        
        <input
          type="text"
          placeholder="Nombre del artista"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          style={{ 
            width: "100%", marginBottom: "15px", padding: "8px",
            backgroundColor: inputBg, color: inputColor,
            border: `1px solid ${inputBorder}`, borderRadius: "4px"
          }}
        />

        <div style={{ marginBottom: "15px" }}>
          <label style={{ marginRight: "10px", fontWeight: "bold" }}>Dificultad:</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ 
              padding: "5px",
              backgroundColor: inputBg, color: inputColor,
              border: `1px solid ${inputBorder}`, borderRadius: "4px",
              marginRight: "15px"
            }}
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
            style={{ 
              padding: "8px 16px",
              backgroundColor: loading ? "#888" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "⏳ Cargando..." : "🔗 Cargar"}
          </button>

          {/* selector de vidas iniciales */}
          <label style={{ fontWeight: "bold" }}>Vidas iniciales:</label>
          <select
            value={initialLives}
            onChange={(e) => setInitialLives(parseInt(e.target.value, 10))}
            style={{ padding: "5px",
              backgroundColor: inputBg, color: inputColor,
              border: `1px solid ${inputBorder}`, borderRadius: "4px" }}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {/* selector de saltos iniciales */}
          <label style={{ fontWeight: "bold" }}>Saltos iniciales:</label>
          <select
            value={initialSkips}
            onChange={(e) => setInitialSkips(parseInt(e.target.value, 10))}
            style={{ padding: "5px",
              backgroundColor: inputBg, color: inputColor,
              border: `1px solid ${inputBorder}`, borderRadius: "4px" }}
          >
            {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginLeft: "auto"
            }}
            title="Recarga toda la página"
          >
            🔄 Reset
          </button>
        </div>

        <div id="youtube-player" style={{ 
          marginTop: "20px", border: `2px solid ${borderCol}`,
          borderRadius: "8px", overflow: "hidden" }}></div>
        
        {!videoId && (
          <div style={{
            marginTop: "20px", padding: "20px",
            backgroundColor: isDark ? "#262a31" : "#e9ecef",
            borderRadius: "8px", textAlign: "center",
            color: softText
          }}>
            El video aparecerá aquí
          </div>
        )}
      </div>

      {/* Juego de letras */}
      <div style={{ padding: "20px", backgroundColor: isDark ? "#2f343c" : "#f1f3f5" }}>
        <h2 style={{ marginTop: 0 }}>🎮 Juego de Letras</h2>

        <div
          ref={rectangleRef}
          style={{
            backgroundColor: bgColor,
            borderRadius: "15px",
            height: "60vh",
            overflowY: "auto",
            padding: "20px",
            color: "#ecf0f1", // alto contraste con color vívido
            fontSize: "16px",
            fontWeight: "500",
            lineHeight: "1.6",
            position: "relative"
          }}
        >
          {captions.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", marginTop: "50px" }}>
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
          <div style={{ fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "12px" }}>
            <span>❤️ Vidas: {lives}</span>
            <button
              onClick={handleSkip}
              disabled={!waitingInput || skips <= 0}
              style={{
                padding: "6px 12px",
                backgroundColor: (!waitingInput || skips <= 0) ? (isDark ? "#555" : "#888") : "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: (!waitingInput || skips <= 0) ? "not-allowed" : "pointer"
              }}
              title={waitingInput ? "Saltar blank actual" : "Disponible cuando se detiene para escribir"}
            >
              ⏭️ Salto
            </button>
            <span>Saltos: {skips}</span>
          </div>
          
          {gameStarted && (
            <div style={{ color: isDark ? "#7CFC9A" : "#28a745", fontWeight: "bold" }}>
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
              style={{ 
                width: "100%", padding: "10px", fontSize: "16px",
                border: "2px solid #fff", borderRadius: "8px", outline: "none",
                backgroundColor: "rgba(255,255,255,0.15)", color: "#fff"
              }}
            />
            <div style={{ marginTop: "5px", fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
              Presiona Enter para confirmar
            </div>
          </div>
        )}
      </div>

      {/* Overlay de cuenta regresiva */}
      {isCountingDown && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)"
          }}
        >
          <div
            style={{
              color: "#fff",
              fontSize: "18vw",
              fontWeight: 800,
              textShadow: "0 8px 24px rgba(0,0,0,0.5)",
              letterSpacing: "-0.02em"
            }}
          >
            {count}
          </div>
        </div>
      )}

      {/* Overlay de lluvia de emojis (sin fondo) */}
      {fxParticles.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            pointerEvents: "none"
          }}
        >
          {fxParticles.map(p => (
            <span
              key={p.id}
              style={{
                position: "absolute",
                top: "-10vh",
                left: `${p.left}%`,
                fontSize: `${p.size}px`,
                transform: `rotate(${p.rotate}deg)`,
                animation: `emoji-fall ${p.duration}s linear ${p.delay}s forwards`
              }}
            >
              {p.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
