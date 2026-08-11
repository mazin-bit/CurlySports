"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Crown } from "lucide-react";

interface DrawParticipant {
  userId: string;
  username: string;
  avatar: string | null;
  referrals: number;
}

/* ── Sound Effects (Web Audio API) ────────────────────── */

function createAudioContext() {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch { return null; }
}

function playTick(ctx: AudioContext | null, pitch = 800) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = pitch;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch { /* ignore */ }
}

function playWinFanfare(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    // Big chord
    const chord = [523, 659, 784, 1047];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = ctx.currentTime + 0.65;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t);
      osc.stop(t + 1.2);
    });
  } catch { /* ignore */ }
}

/* ── Jackpot Machine Spinner ──────────────────────────── */

function JackpotMachineSpinner({
  participants, winner, title, prizeName, onComplete,
}: {
  participants: DrawParticipant[];
  winner: DrawParticipant;
  title: string;
  prizeName: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<"spinning" | "slowing" | "done">("spinning");
  const [offset, setOffset] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);
  const fanfarePlayed = useRef(false);
  const CARD_H = 90;
  const VISIBLE = 3;

  // Init audio on mount
  useEffect(() => {
    audioCtxRef.current = createAudioContext();
    return () => { audioCtxRef.current?.close(); };
  }, []);

  const reel = useMemo(() => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const list: DrawParticipant[] = [];
    for (let i = 0; i < 10; i++) {
      list.push(...shuffled.sort(() => Math.random() - 0.5));
    }
    list.push(participants[0] || winner);
    list.push(winner);
    list.push(participants[1] || participants[0] || winner);
    return list;
  }, [participants, winner]);

  const winnerIdx = reel.length - 2;
  const finalOffset = winnerIdx * CARD_H - CARD_H;

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const TOTAL_DURATION = 6000;

    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / TOTAL_DURATION, 1);
      // Cubic ease-out for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const newOffset = eased * finalOffset;
      setOffset(newOffset);

      // Play tick sound when crossing a card boundary
      const currentCard = Math.floor(newOffset / CARD_H);
      if (currentCard > lastTickRef.current) {
        lastTickRef.current = currentCard;
        const pitch = progress > 0.8 ? 600 + Math.random() * 200 : 700 + Math.random() * 400;
        playTick(audioCtxRef.current, pitch);
      }

      if (progress < 0.5) setPhase("spinning");
      else if (progress < 1) setPhase("slowing");

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setOffset(finalOffset);
        setPhase("done");
        if (!fanfarePlayed.current) {
          fanfarePlayed.current = true;
          playWinFanfare(audioCtxRef.current);
        }
        setTimeout(onComplete, 5000);
      }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [finalOffset, onComplete]);

  // Blinking lights around the machine
  const lightCount = 24;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(12,10,29,0.7)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, flexDirection: "column",
    }}>
      {/* Jackpot Machine Frame */}
      <div style={{
        position: "relative",
        width: 380, maxWidth: "92vw",
        background: "linear-gradient(180deg, #fffdf7 0%, #f6ede0 100%)",
        borderRadius: 24,
        border: "4px solid #0c0a1d",
        boxShadow: "8px 8px 0 #0c0a1d, 0 0 60px rgba(200,255,61,0.15)",
        overflow: "visible",
        padding: "0 0 24px 0",
      }}>
        {/* Blinking lights border */}
        <div style={{
          position: "absolute", inset: -14,
          borderRadius: 32, pointerEvents: "none", zIndex: 1,
        }}>
          {Array.from({ length: lightCount }).map((_, i) => {
            const angle = (i / lightCount) * 360;
            const colors = ["#c8ff3d", "#ff5b3d", "#ffb74d", "#7c5cff", "#38c9ff"];
            return (
              <div key={i} style={{
                position: "absolute",
                width: 10, height: 10,
                borderRadius: "50%",
                background: colors[i % colors.length],
                border: "2px solid #0c0a1d",
                left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 50}% - 5px)`,
                top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 50}% - 5px)`,
                animation: `csJackpotBlink 0.6s ease-in-out ${i * 0.08}s infinite alternate`,
                boxShadow: `0 0 6px ${colors[i % colors.length]}`,
              }} />
            );
          })}
        </div>

        {/* Top banner */}
        <div style={{
          background: "linear-gradient(135deg, #ff5b3d 0%, #ff8c3d 100%)",
          borderRadius: "20px 20px 0 0",
          padding: "18px 20px 14px",
          textAlign: "center",
          borderBottom: "4px solid #0c0a1d",
          position: "relative",
          zIndex: 2,
        }}>
          {/* Stars decoration */}
          <div style={{
            fontSize: 10, letterSpacing: 6, color: "rgba(255,255,255,0.6)",
            marginBottom: 4, fontFamily: "monospace",
          }}>
            ★ ★ ★ LUCKY DRAW ★ ★ ★
          </div>
          <div style={{
            fontFamily: "var(--display, 'Bricolage Grotesque', sans-serif)",
            fontSize: 26, fontWeight: 900, color: "#fff",
            textShadow: "2px 2px 0 rgba(0,0,0,0.2)",
            letterSpacing: 1,
          }}>
            {title}
          </div>
        </div>

        {/* Prize display */}
        <div style={{
          margin: "16px auto 14px",
          width: "fit-content",
          padding: "8px 24px",
          background: "#c8ff3d",
          border: "3px solid #0c0a1d",
          borderRadius: 10,
          boxShadow: "3px 3px 0 #0c0a1d",
          position: "relative", zIndex: 2,
        }}>
          <div style={{
            fontSize: 9, fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            textTransform: "uppercase", letterSpacing: 3, color: "rgba(12,10,29,0.5)",
            fontWeight: 700, textAlign: "center", marginBottom: 2,
          }}>
            Grand Prize
          </div>
          <div style={{
            fontSize: 16, fontWeight: 900, color: "#0c0a1d",
            fontFamily: "var(--display, 'Bricolage Grotesque', sans-serif)",
            textAlign: "center",
          }}>
            {prizeName}
          </div>
        </div>

        {/* Slot machine window */}
        <div style={{
          margin: "0 20px",
          position: "relative", zIndex: 2,
        }}>
          {/* Machine window frame */}
          <div style={{
            border: "4px solid #0c0a1d",
            borderRadius: 14,
            overflow: "hidden",
            background: "#fffdf7",
            boxShadow: "inset 0 4px 12px rgba(12,10,29,0.1), 4px 4px 0 #0c0a1d",
          }}>
            {/* Top gradient fade */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 30,
              background: "linear-gradient(180deg, rgba(255,253,247,0.9) 0%, transparent 100%)",
              zIndex: 3, pointerEvents: "none", borderRadius: "10px 10px 0 0",
            }} />
            {/* Bottom gradient fade */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 30,
              background: "linear-gradient(0deg, rgba(255,253,247,0.9) 0%, transparent 100%)",
              zIndex: 3, pointerEvents: "none", borderRadius: "0 0 10px 10px",
            }} />

            {/* Selection indicator arrows */}
            <div style={{
              position: "absolute", top: CARD_H - 4, left: -2, right: -2, height: CARD_H + 8,
              zIndex: 4, pointerEvents: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              {/* Left arrow */}
              <div style={{
                width: 0, height: 0,
                borderTop: "12px solid transparent",
                borderBottom: "12px solid transparent",
                borderLeft: "14px solid #ff5b3d",
                filter: "drop-shadow(1px 0 0 #0c0a1d)",
              }} />
              {/* Right arrow */}
              <div style={{
                width: 0, height: 0,
                borderTop: "12px solid transparent",
                borderBottom: "12px solid transparent",
                borderRight: "14px solid #ff5b3d",
                filter: "drop-shadow(-1px 0 0 #0c0a1d)",
              }} />
            </div>

            {/* Center highlight bar */}
            <div style={{
              position: "absolute", top: CARD_H, left: 0, right: 0, height: CARD_H,
              border: "3px solid #ff5b3d", borderRadius: 0,
              background: phase === "done" ? "rgba(255,91,61,0.1)" : "rgba(255,91,61,0.03)",
              zIndex: 2, pointerEvents: "none", transition: "all 0.3s ease",
              boxShadow: phase === "done" ? "inset 0 0 30px rgba(255,91,61,0.12), 0 0 20px rgba(255,91,61,0.1)" : "none",
            }} />

            {/* Scrolling reel container */}
            <div style={{
              height: CARD_H * VISIBLE,
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{
                transform: `translateY(-${offset}px)`,
                willChange: "transform",
              }}>
                {reel.map((p, i) => {
                  const isWinner = phase === "done" && i === winnerIdx;
                  return (
                    <div key={`${p.userId}-${i}`} style={{
                      height: CARD_H, display: "flex", alignItems: "center",
                      gap: 14, padding: "0 20px",
                      background: isWinner ? "rgba(255,91,61,0.08)" : "transparent",
                      borderBottom: "1px solid rgba(12,10,29,0.08)",
                      transition: isWinner ? "background 0.5s ease" : "none",
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 50, height: 50, borderRadius: 14,
                        background: "#0c0a1d", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontWeight: 900, fontSize: 16, color: "#c8ff3d",
                        flexShrink: 0, overflow: "hidden",
                        border: isWinner ? "3px solid #ff5b3d" : "3px solid #0c0a1d",
                        boxShadow: isWinner ? "0 0 12px rgba(255,91,61,0.3)" : "2px 2px 0 rgba(12,10,29,0.15)",
                        transition: "all 0.3s ease",
                      }}>
                        {p.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          (p.username || "?").slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {/* Name + referrals */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "var(--display, 'Bricolage Grotesque', sans-serif)",
                          fontWeight: 800, fontSize: 16,
                          color: isWinner ? "#ff5b3d" : "#0c0a1d",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          transition: "color 0.3s ease",
                        }}>{p.username}</div>
                        <div style={{
                          fontSize: 11, color: "rgba(12,10,29,0.4)",
                          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                          marginTop: 2,
                        }}>
                          {p.referrals} referral{p.referrals !== 1 ? "s" : ""}
                        </div>
                      </div>
                      {/* Ticket badge */}
                      <div style={{
                        fontSize: 10, fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontWeight: 700,
                        color: "#0c0a1d", flexShrink: 0,
                        padding: "5px 12px", borderRadius: 8,
                        background: isWinner ? "#c8ff3d" : "#f6ede0",
                        border: `2px solid ${isWinner ? "#0c0a1d" : "rgba(12,10,29,0.12)"}`,
                        boxShadow: isWinner ? "2px 2px 0 #0c0a1d" : "none",
                        textTransform: "uppercase",
                        transition: "all 0.3s ease",
                      }}>
                        {p.referrals} ticket{p.referrals !== 1 ? "s" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          margin: "16px 20px 0",
          padding: "10px 16px",
          borderRadius: 10,
          background: phase === "done" ? "rgba(255,91,61,0.08)" : "#f6ede0",
          border: `2px solid ${phase === "done" ? "#ff5b3d" : "rgba(12,10,29,0.1)"}`,
          textAlign: "center",
          position: "relative", zIndex: 2,
          transition: "all 0.3s ease",
        }}>
          {phase === "spinning" && (
            <div style={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 13,
              color: "rgba(12,10,29,0.5)", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 2,
              animation: "csJackpotPulse 0.5s ease-in-out infinite alternate",
            }}>
              Spinning...
            </div>
          )}
          {phase === "slowing" && (
            <div style={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 13,
              color: "#ff5b3d", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 2,
            }}>
              Almost there...
            </div>
          )}
          {phase === "done" && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <Crown size={22} style={{ color: "#ff5b3d" }} />
              <span style={{
                color: "#ff5b3d", fontWeight: 900, fontSize: 22,
                fontFamily: "var(--display, 'Bricolage Grotesque', sans-serif)",
              }}>
                {winner.username} wins!
              </span>
              <Crown size={22} style={{ color: "#ff5b3d" }} />
            </div>
          )}
        </div>
      </div>

      {/* Confetti */}
      {phase === "done" && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10001,
          overflow: "hidden",
        }}>
          {Array.from({ length: 80 }).map((_, i) => {
            const colors = ["#c8ff3d", "#ff5b3d", "#7c5cff", "#ffb74d", "#38c9ff", "#ff5d9e", "#fff"];
            const size = Math.random() * 10 + 4;
            return (
              <div key={i} style={{
                position: "absolute",
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 15 + 5}%`,
                width: size,
                height: size * (Math.random() > 0.3 ? 1.5 : 1),
                background: colors[i % colors.length],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animation: `csJackpotConfetti ${2 + Math.random() * 2.5}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.8}s`,
                opacity: 0.95,
              }} />
            );
          })}
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes csJackpotBlink {
          0% { opacity: 0.4; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes csJackpotPulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        @keyframes csJackpotConfetti {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          50% { opacity: 0.9; }
          100% { transform: translateY(100vh) rotate(${360 + Math.random() * 720}deg) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Global Lucky Draw Overlay ───────────────────────── */

export default function LuckyDrawOverlay() {
  const [spinData, setSpinData] = useState<{
    id?: string;
    title: string;
    prizeName: string;
    winner: DrawParticipant;
    participants: DrawParticipant[];
  } | null>(null);
  const [spinDone, setSpinDone] = useState(false);
  const spinIdRef = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/lucky-draw");
      if (!res.ok) return;
      const data = await res.json();
      if (data.spinning && data.spinning.winner && data.spinning.participants?.length > 0 && !spinDone) {
        const newId = data.spinning.id || "spin";
        if (spinIdRef.current !== newId) {
          spinIdRef.current = newId;
          setSpinData({
            id: newId,
            title: data.spinning.title,
            prizeName: data.spinning.prizeName,
            winner: data.spinning.winner,
            participants: data.spinning.participants,
          });
        }
      } else if (!data.spinning) {
        spinIdRef.current = null;
        setSpinData(null);
      }
    } catch { /* ignore */ }
  }, [spinDone]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  if (!spinData || spinDone) return null;

  return (
    <JackpotMachineSpinner
      participants={spinData.participants}
      winner={spinData.winner}
      title={spinData.title}
      prizeName={spinData.prizeName}
      onComplete={() => {
        setSpinDone(true);
        setSpinData(null);
        setTimeout(() => setSpinDone(false), 5000);
      }}
    />
  );
}
