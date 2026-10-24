import { useEffect, useRef, useState } from "react";
import {
  X,
  ChevronRight,
  Hand,
  Play,
  Send,
  Crown,
  Shield,
  Zap,
  Vote,
  Target,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  Plus,
  Pause,
  RotateCcw,
  Check,
  AlertCircle,
  Trophy,
  Users,
} from "lucide-react";
import { useGame, type Player, type ChatMessage, type Assignment } from "@/lib/game-store";
import { sounds } from "@/lib/sounds";
import { toast } from "sonner";
import { TimerModal } from "@/components/game/TimerModal";
import { formatDuration } from "@/lib/utils";

function LogoBadge() {
  return (
    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-lime card-shadow">
      <div className="text-center font-display font-extrabold leading-none">
        <div className="text-[10px]">IMPOSTER</div>
        <div className="text-lg">WHO?</div>
      </div>
    </div>
  );
}

function TopBar({ onClose }: { onClose: () => void }) {
  const [muted, setMuted] = useState(() => sounds.isMuted());

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setMuted(next);
  };

  return (
    <div className="flex items-center justify-between pt-4">
      <button
        type="button"
        onClick={handleToggleSound}
        aria-label={muted ? "Unmute sounds" : "Mute sounds"}
        className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary/60 active:scale-95 transition"
      >
        {muted ? (
          <VolumeX className="h-7 w-7 text-destructive" />
        ) : (
          <Volume2 className="h-7 w-7 text-foreground" />
        )}
      </button>
      <LogoBadge />
      <button
        type="button"
        onClick={onClose}
        aria-label="Exit"
        className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary/60 active:scale-95 transition"
      >
        <X className="h-8 w-8" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ---------------- ONLINE HELPERS ---------------- */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1 text-xs">
      {children}
    </span>
  );
}

function SpecialRolesReveal({ assignments }: { assignments: Assignment[] }) {
  const guardianAngel = assignments.find((a) => a.specialRole === "guardian_angel");
  const initiator = assignments.find((a) => a.specialRole === "initiator");
  const extraVoter = assignments.find((a) => a.specialRole === "extra_voter");
  const bountyHunter = assignments.find((a) => a.specialRole === "bounty_hunter");

  if (!guardianAngel && !initiator && !extraVoter && !bountyHunter) return null;

  return (
    <div className="rounded-2xl bg-card p-4 card-shadow border border-border/80 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <p className="font-display text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-pink" /> SPECIAL ROLES REVEALED
        </p>
        <span className="text-[10px] bg-secondary font-bold px-2 py-0.5 rounded-full text-foreground/70">
          Match Roles
        </span>
      </div>

      <div className="space-y-2.5">
        {guardianAngel && (
          <div className="rounded-xl bg-secondary/50 p-3 border border-border/60 flex items-start gap-3">
            <span className="text-2xl shrink-0">👼</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-display font-extrabold text-sm text-foreground">
                  {guardianAngel.playerName}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-yellow/20 text-foreground border border-yellow/40">
                  GUARDIAN ANGEL · CREWMATE
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                Defended the Impostor during discussion so others wouldn't vote them out.
                {guardianAngel.guardianAngelClue && (
                  <span className="block mt-0.5 font-bold text-pink">
                    Impostor Clue seen: “{guardianAngel.guardianAngelClue}”
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {initiator && (
          <div className="rounded-xl bg-secondary/50 p-3 border border-border/60 flex items-start gap-3">
            <span className="text-2xl shrink-0">⚡</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-display font-extrabold text-sm text-foreground">
                  {initiator.playerName}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    initiator.isImposter
                      ? "bg-destructive/15 text-destructive border-destructive/30"
                      : "bg-lime/20 text-foreground border-lime/30"
                  }`}
                >
                  INITIATOR · {initiator.isImposter ? "IMPOSTOR" : "CREWMATE"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Chose which player spoke first during clue discussion.
              </p>
            </div>
          </div>
        )}

        {extraVoter && (
          <div className="rounded-xl bg-secondary/50 p-3 border border-border/60 flex items-start gap-3">
            <span className="text-2xl shrink-0">🗳️</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-display font-extrabold text-sm text-foreground">
                  {extraVoter.playerName}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    extraVoter.isImposter
                      ? "bg-destructive/15 text-destructive border-destructive/30"
                      : "bg-lime/20 text-foreground border-lime/30"
                  }`}
                >
                  EXTRA VOTER · {extraVoter.isImposter ? "IMPOSTOR" : "CREWMATE"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Held an extra vote during the voting phase.
              </p>
            </div>
          </div>
        )}

        {bountyHunter && (
          <div className="rounded-xl bg-secondary/50 p-3 border border-border/60 flex items-start gap-3">
            <span className="text-2xl shrink-0">🎯</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-display font-extrabold text-sm text-foreground">
                  {bountyHunter.playerName}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                  BOUNTY HUNTER · CREWMATE
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                Secret Mission: Convince everyone to eliminate{" "}
                <span className="font-bold text-foreground">{bountyHunter.bountyTargetName}</span>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClueBoard({
  players,
  turnOrder,
  clues,
}: {
  players: Player[];
  turnOrder: string[];
  clues: { [pid: string]: { [rnd: number]: string } };
}) {
  return (
    <div className="w-full rounded-2xl bg-card p-4 card-shadow overflow-x-auto my-3 max-h-[30vh] border border-border/40">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 font-display font-extrabold pr-4 text-foreground/70 uppercase">
              Player
            </th>
            <th className="py-2 font-display font-extrabold text-center text-foreground/70 uppercase">
              Round 1
            </th>
            <th className="py-2 font-display font-extrabold text-center text-foreground/70 uppercase">
              Round 2
            </th>
            <th className="py-2 font-display font-extrabold text-center text-foreground/70 uppercase">
              Round 3
            </th>
          </tr>
        </thead>
        <tbody>
          {turnOrder.map((pid) => {
            const p = players.find((pl) => pl.id === pid);
            if (!p) return null;
            const pClues = clues[pid] || {};
            return (
              <tr
                key={pid}
                className={`border-b border-border/40 last:border-0 ${p.eliminated ? "opacity-40 bg-destructive/5" : ""}`}
              >
                <td className="py-2 font-bold flex items-center gap-1 pr-4 truncate max-w-27.5">
                  <span>{p.avatar}</span>
                  <span className="truncate">{p.name}</span>
                  {p.eliminated && (
                    <span className="text-[8px] font-extrabold bg-destructive/15 text-destructive px-1.5 py-0.2 rounded shrink-0">
                      OUT
                    </span>
                  )}
                </td>
                <td className="py-2 text-center font-bold text-foreground/80">
                  {pClues[1] || "—"}
                </td>
                <td className="py-2 text-center font-bold text-foreground/80">
                  {pClues[2] || "—"}
                </td>
                <td className="py-2 text-center font-bold text-foreground/80">
                  {pClues[3] || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ChatPanel({
  chat,
  localPlayerId,
  onSend,
}: {
  chat: ChatMessage[];
  localPlayerId: string;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="w-full flex-1 flex flex-col rounded-2xl bg-card card-shadow border border-border overflow-hidden min-h-55">
      {/* Header */}
      <div className="bg-secondary/60 px-4 py-2 border-b border-border flex items-center gap-2 select-none">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime"></span>
        </span>
        <span className="font-display text-xs font-extrabold tracking-wider text-foreground/75 uppercase">
          Live Chat
        </span>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-50">
        {chat.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-semibold text-muted-foreground/60 italic py-6 select-none">
            No messages yet. Chat here to identify the Imposters!
          </div>
        ) : (
          chat.map((msg) => {
            const isMe = msg.playerId === localPlayerId;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                <span className="text-2xl select-none">{msg.playerAvatar}</span>
                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  <span className="text-[9px] font-bold text-muted-foreground/70 mb-0.5 px-0.5">
                    {msg.playerName}
                  </span>
                  <div
                    className={`rounded-xl px-3 py-2 font-semibold text-xs leading-relaxed ${isMe ? "bg-pink text-white rounded-tr-none" : "bg-secondary text-foreground rounded-tl-none"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Form */}
      <form onSubmit={submit} className="border-t border-border p-1.5 bg-secondary/10 flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-background rounded-xl px-3.5 py-2 font-semibold text-xs outline-none border border-border focus:border-pink transition"
        />
        <button
          type="submit"
          className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-xl bg-pink text-white btn-3d active:scale-95 transition"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

/* ---------------- PHASE SCREENS ---------------- */

export function RevealScreen() {
  const g = useGame();
  const [flipped, setFlipped] = useState(false);
  const [flippedOnce, setFlippedOnce] = useState(false);
  const holdTimer = useRef<number | null>(null);

  const isOnline = g.gameMode === "online";

  const me = isOnline ? g.onlinePlayers.find((p) => p.id === g.localPlayer.id) : null;
  const isSpectator = isOnline ? (me ? me.spectator : false) : false;

  useEffect(() => {
    setFlipped(false);
    setFlippedOnce(false);
  }, [g.currentPlayerIndex]);

  const assignment = g.assignments[g.currentPlayerIndex];

  if (isOnline && isSpectator) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <div className="mx-auto w-full max-w-md px-4">
          <TopBar onClose={g.exitToLobby} />
        </div>
        <div className="mx-auto w-full max-w-md flex-1 px-4 flex flex-col items-center justify-center text-center">
          <div className="rounded-3xl bg-card p-8 card-shadow space-y-4 border-2 border-dashed border-primary/20">
            <span className="text-6xl animate-pulse">🍿</span>
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              SPECTATING ROUND
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The game has started. You are spectating this round! You can watch clues and
              participate in chat once the clue rounds end.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const cardColor = assignment.isImposter ? "bg-[oklch(0.82_0.15_60)]" : "bg-yellow";
  const softColor = assignment.isImposter ? "bg-[oklch(0.9_0.1_60)]" : "bg-[oklch(0.94_0.11_100)]";

  const startHold = () => {
    sounds.playTap();
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      setFlipped(true);
      setFlippedOnce(true);
      sounds.playCardFlip();
      if (!isOnline) {
        g.markViewed();
      }
    }, 120);
  };

  const endHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (flipped) {
      sounds.playCardFlip();
    }
    setFlipped(false);
  };

  const isReady = isOnline ? g.cardViewed : false;
  const canNext = !isOnline && g.cardViewed && !flipped;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 flex flex-col items-center justify-center pb-6">
        {/* 3D Perspective Card Container */}
        <div
          className="relative w-full aspect-3/4 max-h-[60vh] select-none touch-none"
          style={{ perspective: "1200px" }}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
        >
          <div
            className="w-full h-full relative rounded-3xl cursor-pointer transition-transform duration-500 ease-out"
            style={{
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* FRONT FACE (Facedown: Player Name + Hold prompt) */}
            <div
              className={`absolute inset-0 rounded-3xl card-shadow overflow-hidden p-6 flex flex-col items-center justify-between text-center ${cardColor} card-ray-bg`}
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <div className="pt-4">
                <span className="text-[10px] font-extrabold tracking-widest text-foreground/60 uppercase block">
                  PASS DEVICE TO
                </span>
                <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-foreground drop-shadow-sm mt-0.5">
                  {assignment.playerName}
                </h2>
                <p className="mt-2 text-sm font-semibold text-foreground/80 max-w-60 mx-auto leading-snug">
                  Keep your card secret from everyone else!
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 my-auto">
                <div className="h-24 w-24 rounded-full bg-foreground/10 grid place-items-center animate-pulse border-2 border-foreground/20">
                  <Hand className="h-14 w-14 text-foreground" strokeWidth={2.2} />
                </div>
                <div className="rounded-full bg-foreground/15 px-5 py-2 border border-foreground/25 card-shadow">
                  <p className="font-display text-base sm:text-lg font-black tracking-wider text-foreground">
                    HOLD TO REVEAL
                  </p>
                </div>
              </div>

              <div className="pb-1 text-center">
                <span className="text-[10px] font-extrabold text-foreground/50 uppercase tracking-widest">
                  🔄 3D Card • Release to hide
                </span>
              </div>
            </div>

            {/* BACK FACE (Faceup: Word / Role Reveal) */}
            <div
              className={`absolute inset-0 rounded-3xl card-shadow overflow-hidden p-6 flex flex-col items-center justify-center text-center ${softColor} card-ray-bg`}
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="absolute top-6 left-0 right-0 text-center">
                <h3 className="font-display text-2xl font-black uppercase tracking-tight text-foreground/75">
                  {assignment.playerName}
                </h3>
              </div>

              <div className="w-full flex items-center justify-center pointer-events-none">
                {assignment.specialRole === "guardian_angel" ? (
                  <div className="mx-4 rounded-3xl border-2 border-foreground bg-white px-6 py-6 text-center card-shadow space-y-3 w-full max-w-70">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow/25 border border-yellow/50 px-3.5 py-1 text-xs font-display font-black text-foreground uppercase tracking-wider">
                      👼 GUARDIAN ANGEL
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        SECRET WORD
                      </p>
                      <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mt-0.5">
                        {g.word}
                      </p>
                    </div>
                    {assignment.guardianAngelClue && (
                      <div className="rounded-xl bg-pink/10 border border-pink/30 px-3 py-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          IMPOSTOR CLUE
                        </p>
                        <p className="font-display text-base font-extrabold text-pink mt-0.5">
                          “{assignment.guardianAngelClue}”
                        </p>
                      </div>
                    )}
                  </div>
                ) : assignment.specialRole === "initiator" ? (
                  <div className="mx-4 rounded-3xl border-2 border-foreground bg-white px-6 py-6 text-center card-shadow space-y-3 w-full max-w-70">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-display font-black uppercase tracking-wider border ${
                        assignment.isImposter
                          ? "bg-destructive/15 text-destructive border-destructive/30"
                          : "bg-yellow/25 text-foreground border-yellow/50"
                      }`}
                    >
                      <Zap className="h-4 w-4 fill-yellow text-yellow" /> INITIATOR
                    </div>
                    {assignment.isImposter ? (
                      <div className="space-y-1">
                        <p className="font-display text-3xl font-extrabold leading-tight text-destructive">
                          IMPOSTOR!
                        </p>
                        {assignment.clue && (
                          <p className="font-display text-base font-bold text-foreground/80">
                            Hint: “{assignment.clue}”
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          SECRET WORD
                        </p>
                        <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mt-0.5">
                          {g.word}
                        </p>
                      </div>
                    )}
                  </div>
                ) : assignment.specialRole === "extra_voter" ? (
                  <div className="mx-4 rounded-3xl border-2 border-foreground bg-white px-6 py-6 text-center card-shadow space-y-3 w-full max-w-70">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-display font-black uppercase tracking-wider border ${
                        assignment.isImposter
                          ? "bg-destructive/15 text-destructive border-destructive/30"
                          : "bg-purple-100 text-purple-900 border-purple-300"
                      }`}
                    >
                      <Vote className="h-4 w-4 text-purple-700" /> EXTRA VOTER
                    </div>
                    {assignment.isImposter ? (
                      <div className="space-y-1">
                        <p className="font-display text-3xl font-extrabold leading-tight text-destructive">
                          IMPOSTOR!
                        </p>
                        {assignment.clue && (
                          <p className="font-display text-base font-bold text-foreground/80">
                            Hint: “{assignment.clue}”
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          SECRET WORD
                        </p>
                        <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mt-0.5">
                          {g.word}
                        </p>
                      </div>
                    )}
                  </div>
                ) : assignment.specialRole === "bounty_hunter" ? (
                  <div className="mx-4 rounded-3xl border-2 border-foreground bg-white px-6 py-6 text-center card-shadow space-y-3 w-full max-w-70">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 border border-red-300 px-3.5 py-1 text-xs font-display font-black uppercase tracking-wider">
                      <Target className="h-4 w-4" /> BOUNTY HUNTER
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        SECRET WORD
                      </p>
                      <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mt-0.5">
                        {g.word}
                      </p>
                    </div>
                    {assignment.bountyTargetName && (
                      <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                          BOUNTY TARGET
                        </p>
                        <p className="font-display text-lg font-black text-red-700 mt-0.5 uppercase">
                          {assignment.bountyTargetName}
                        </p>
                        <p className="text-[10px] font-semibold text-red-800/80">
                          Convince everyone to vote them out!
                        </p>
                      </div>
                    )}
                  </div>
                ) : assignment.isImposter ? (
                  <div className="mx-4 rounded-3xl border-2 border-foreground bg-white px-6 py-6 text-center card-shadow space-y-1 w-full max-w-70">
                    <p className="font-display text-3xl font-extrabold leading-tight text-destructive">
                      IMPOSTOR!
                    </p>
                    {assignment.clue && (
                      <p className="mt-2 font-display text-base font-bold text-foreground/80">
                        Hint: “{assignment.clue}”
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mx-4 rounded-3xl border-2 border-foreground bg-white px-8 py-6 text-center card-shadow w-full max-w-70">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      SECRET WORD
                    </p>
                    <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mt-0.5">
                      {g.word}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isOnline ? (
          <div className="w-full mt-6 space-y-4">
            <button
              onClick={() => {
                sounds.playTap();
                g.markReadyAction();
              }}
              disabled={isReady || !flippedOnce}
              className="w-full max-w-sm mx-auto rounded-full bg-foreground py-4 font-display text-lg font-extrabold text-background flex items-center justify-center gap-2 btn-3d disabled:opacity-40"
            >
              {isReady ? "WAITING FOR OTHERS..." : "READY"}
            </button>

            {/* Ready Players indicators */}
            <div className="flex flex-wrap gap-1.5 justify-center max-w-sm mx-auto">
              {g.onlinePlayers
                .filter((p) => !p.spectator && p.connected)
                .map((p) => (
                  <span
                    key={p.id}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${
                      p.ready
                        ? "bg-lime/20 text-foreground"
                        : "bg-secondary text-muted-foreground/60"
                    }`}
                  >
                    {p.name} {p.ready ? "✓" : "..."}
                  </span>
                ))}
            </div>
          </div>
        ) : (
          (() => {
            const isLastPlayer = g.currentPlayerIndex >= g.assignments.length - 1;
            const hasInitiator =
              g.initiatorEnabled && g.assignments.some((a) => a.specialRole === "initiator");
            const hasExtraVoter =
              g.extraVoterEnabled && g.assignments.some((a) => a.specialRole === "extra_voter");
            const hasSpecialReveal = hasInitiator || hasExtraVoter;

            let specialButtonText = "START DISCUSSION";
            if (hasInitiator && hasExtraVoter) {
              specialButtonText = "REVEAL INITIATOR & VOTER";
            } else if (hasInitiator) {
              specialButtonText = "REVEAL INITIATOR";
            } else if (hasExtraVoter) {
              specialButtonText = "REVEAL EXTRA VOTER";
            }

            return (
              <button
                onClick={() => {
                  sounds.playTap();
                  g.nextPlayer();
                }}
                disabled={!canNext}
                className="mt-8 w-full max-w-sm rounded-full bg-foreground py-4 font-display text-lg font-extrabold text-background flex items-center justify-center gap-2 btn-3d disabled:opacity-40"
              >
                {isLastPlayer ? (
                  hasSpecialReveal ? (
                    <>
                      <Zap className="h-5 w-5 fill-yellow text-yellow" /> {specialButtonText}
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 fill-current" /> START DISCUSSION
                    </>
                  )
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-current" /> NEXT PLAYER
                  </>
                )}
              </button>
            );
          })()
        )}
      </div>
    </div>
  );
}

export function ClueScreen() {
  const g = useGame();
  const [text, setText] = useState("");

  const activePlayerId = g.turnOrder[g.currentTurnIndex];
  const activePlayer = g.onlinePlayers.find((p) => p.id === activePlayerId);
  const isMyTurn = activePlayerId === g.localPlayer.id;

  const me = g.onlinePlayers.find((p) => p.id === g.localPlayer.id);
  const isHost = me ? me.isHost : false;

  const myAssignment = g.assignments.find((a) => a.playerId === g.localPlayer.id);
  const displayWord = myAssignment?.isImposter ? myAssignment.clue || "Imposter Hint" : g.word;

  const submit = () => {
    if (!text.trim()) return;
    g.submitClueAction(g.currentRound, text);
    setText("");
  };

  const handleSkip = () => {
    g.skipTurnAction();
  };

  if (!activePlayer) return null;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-4 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Turn Alert */}
          <div className="rounded-2xl bg-card p-4 card-shadow text-center flex flex-col items-center justify-center border-2 border-yellow/30">
            <p className="font-display text-[10px] font-extrabold tracking-widest text-pink uppercase">
              ROUND {g.currentRound} OF 3
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl animate-bounce">{activePlayer.avatar}</span>
              <h2 className="font-display text-xl font-extrabold text-foreground">
                {isMyTurn ? "IT'S YOUR TURN!" : `${activePlayer.name.toUpperCase()} IS TYPING...`}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-70">
              {isMyTurn
                ? "Enter a one-word clue that describes your card without revealing it directly."
                : "Wait for the active player. All clues appear instantly below."}
            </p>
          </div>

          {/* Live Clue Board */}
          <ClueBoard players={g.onlinePlayers} turnOrder={g.turnOrder} clues={g.clues} />
        </div>

        {/* Input box / skip timer */}
        <div className="mt-4 gap-3 select-none">
          {isMyTurn ? (
            <div className="rounded-2xl bg-card p-4 card-shadow space-y-3 border-2 border-pink/30">
              <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase text-center">
                YOUR CARD WORD:{" "}
                <span className="text-sm text-pink font-extrabold tracking-normal font-body">
                  {displayWord}
                </span>
              </p>
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter one-word clue..."
                  className="flex-1 bg-secondary/50 rounded-xl px-4 py-3 font-semibold text-sm outline-none border border-border focus:border-pink transition"
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <button
                  onClick={submit}
                  disabled={!text.trim()}
                  className="rounded-xl bg-lime px-6 py-3 font-display font-extrabold text-foreground/90 btn-3d disabled:opacity-40 shrink-0 text-sm"
                >
                  SUBMIT
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-2xl bg-secondary/40 py-4 font-display text-xs font-bold text-center text-muted-foreground/80 card-shadow border border-border/50 animate-pulse uppercase">
                ⏳ WAITING FOR {activePlayer.name} TO TYPE CLUE
              </div>
              {isHost && (
                <button
                  onClick={handleSkip}
                  className="w-full rounded-2xl bg-destructive/10 border border-destructive/20 py-3 font-display text-sm font-bold text-destructive hover:bg-destructive/15 active:scale-95 transition"
                >
                  SKIP TURN (HOST ONLY)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OnlineDiscussScreen() {
  const g = useGame();
  const me = g.onlinePlayers.find((p) => p.id === g.localPlayer.id);
  const isReady = me ? me.ready : false;
  const isSpectator = me ? me.spectator : false;

  const handleReadyToVote = () => {
    g.markReadyToVoteAction();
  };

  const starter =
    g.onlinePlayers.find((p) => {
      const asg = g.assignments.find((a) => a.playerId === p.id);
      return asg && !asg.isImposter;
    })?.name ?? "Someone";

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-4 flex flex-col gap-3">
        {/* Starter Banner */}
        <div className="rounded-2xl bg-card p-4 card-shadow text-center border-2 border-yellow/30 flex flex-col items-center select-none">
          <p className="font-display text-[10px] font-extrabold tracking-widest text-pink uppercase">
            DISCUSSION PHASE
          </p>
          <p className="text-sm font-semibold mt-1">
            <span className="rounded bg-lime px-2 py-0.5 font-extrabold text-foreground">
              {starter}
            </span>{" "}
            starts the conversation!
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 max-w-75">
            Chat, debate clues, and catch the Imposter. Press "Ready to Vote" when ready to proceed.
          </p>
        </div>

        {/* Clue Board */}
        <ClueBoard players={g.onlinePlayers} turnOrder={g.turnOrder} clues={g.clues} />

        {/* Discussion Chat */}
        <ChatPanel
          chat={g.onlineChat}
          localPlayerId={g.localPlayer.id}
          onSend={g.sendChatMessage}
        />

        {/* Ready system */}
        <div className="space-y-2 mt-auto">
          {!isSpectator && (
            <button
              onClick={handleReadyToVote}
              disabled={isReady}
              className="w-full rounded-2xl bg-lime py-4 font-display font-extrabold text-foreground/90 flex items-center justify-center gap-2 btn-3d disabled:opacity-40"
            >
              {isReady ? "WAITING FOR OTHERS..." : "READY TO VOTE"}
            </button>
          )}

          <div className="flex flex-wrap gap-1.5 justify-center">
            {g.onlinePlayers
              .filter((p) => !p.spectator && p.connected)
              .map((p) => (
                <span
                  key={p.id}
                  className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${
                    p.ready ? "bg-lime/20 text-foreground" : "bg-secondary text-muted-foreground/60"
                  }`}
                >
                  {p.name} {p.ready ? "✓" : "..."}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassicDiscussScreen() {
  const g = useGame();
  const actualImposterCount =
    g.assignments.filter((a) => a.isImposter).length || g.imposterCount || 1;

  const starter =
    g.assignments.find((a) => !a.isImposter)?.playerName ??
    g.assignments[0]?.playerName ??
    "Someone";

  const [timeLeft, setTimeLeft] = useState(() => g.timeLimitDuration || 90);
  const [isRunning, setIsRunning] = useState(true);
  const [isAccusing, setIsAccusing] = useState(false);
  const [isSettingTimer, setIsSettingTimer] = useState(false);
  const [selectedAccused, setSelectedAccused] = useState<Assignment[]>([]);
  const [suspenseState, setSuspenseState] = useState<"idle" | "drumroll" | "revealed">("idle");

  // Timer countdown effect
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          sounds.playBuzzer();
          return 0;
        }
        if (prev <= 6 && prev > 1) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleAddTime = (seconds: number = 30) => {
    sounds.playTap();
    setTimeLeft((prev) => prev + seconds);
    toast.success(`+${seconds}s added to discussion timer!`);
  };

  const handleToggleTimer = () => {
    sounds.playTap();
    setIsRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    sounds.playTap();
    setTimeLeft(g.timeLimitDuration || 90);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = timeLeft > 0 && timeLeft <= 15;
  const isExpired = timeLeft === 0;

  const handleOpenAccuse = () => {
    sounds.playTap();
    setIsAccusing(true);
    setSelectedAccused([]);
    setSuspenseState("idle");
  };

  const handleTogglePlayer = (assignment: Assignment) => {
    sounds.playTap();
    setSelectedAccused((prev) => {
      const isAlreadySelected = prev.some((a) => a.playerName === assignment.playerName);
      if (isAlreadySelected) {
        return prev.filter((a) => a.playerName !== assignment.playerName);
      }
      if (prev.length < actualImposterCount) {
        return [...prev, assignment];
      }
      if (actualImposterCount === 1) {
        return [assignment];
      }
      return [...prev.slice(1), assignment];
    });
    setSuspenseState("idle");
  };

  const handleRevealAccused = () => {
    if (selectedAccused.length === 0) return;
    sounds.playDrumroll();
    setSuspenseState("drumroll");
    window.setTimeout(() => {
      setSuspenseState("revealed");
      const anyImposter = selectedAccused.some((a) => a.isImposter);
      if (anyImposter) {
        sounds.playVictory();
      } else {
        sounds.playDefeat();
      }
      g.setClassicAccusedPlayerNames(selectedAccused.map((a) => a.playerName));
    }, 700);
  };

  const handleGoToFullResults = () => {
    sounds.playTap();
    g.revealResult();
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-4 flex flex-col justify-between text-center animate-in fade-in">
        <div className="space-y-4 pt-2">
          {/* Header */}
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-pink uppercase block">
              DISCUSSION &amp; CLUES
            </span>
            <h1 className="font-display text-3xl font-black leading-tight text-foreground mt-0.5">
              Time to talk &amp; catch the imposter!
            </h1>
          </div>

          {/* Starter Banner */}
          <div className="rounded-2xl bg-secondary/60 p-3 border border-border/70 flex items-center justify-center gap-2 text-sm font-semibold">
            <span>🗣️</span>
            <span>
              <span className="rounded-md bg-lime px-2 py-0.5 font-black text-foreground">
                {starter}
              </span>{" "}
              starts the conversation!
            </span>
          </div>

          {/* Discussion Countdown Timer Card */}
          <div
            className={`rounded-3xl p-5 card-shadow border-2 transition-all ${
              isExpired
                ? "bg-destructive/15 border-destructive/60 animate-pulse"
                : isUrgent
                  ? "bg-orange-100/70 border-orange-400"
                  : "bg-card border-border/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-foreground/80" /> DISCUSSION TIMER
              </span>
              <span>{isRunning ? "RUNNING" : "PAUSED"}</span>
            </div>

            {/* Big Timer Digits */}
            <div
              className="py-2 cursor-pointer group select-none"
              onClick={() => {
                sounds.playTap();
                setIsSettingTimer(true);
              }}
              title="Tap to change timer"
            >
              <span
                className={`font-display text-5xl sm:text-6xl font-black tracking-tight group-hover:opacity-85 inline-block transition ${
                  isExpired ? "text-destructive" : isUrgent ? "text-orange-600" : "text-foreground"
                }`}
              >
                {formattedTime}
              </span>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-0.5 group-hover:text-pink transition">
                Tap to adjust timer ⏱️
              </p>
              {isExpired && (
                <p className="text-xs font-black text-destructive uppercase tracking-wider mt-1">
                  ⏰ TIME'S UP! CAST YOUR VOTES!
                </p>
              )}
            </div>

            {/* Timer Controls: Play/Pause, +30s, Set, Reset */}
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={handleToggleTimer}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 font-display font-extrabold text-xs text-foreground card-shadow active:scale-95 transition"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" /> Resume
                  </>
                )}
              </button>

              {/* +30s Button */}
              <button
                type="button"
                onClick={() => handleAddTime(30)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime hover:bg-lime/90 font-display font-black text-xs text-foreground card-shadow active:scale-95 transition"
              >
                <Plus className="h-4 w-4" strokeWidth={3} /> +30s
              </button>

              {/* Set Timer Button */}
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setIsSettingTimer(true);
                }}
                title="Change timer duration"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 font-display font-black text-xs text-foreground card-shadow active:scale-95 transition"
              >
                <Clock className="h-3.5 w-3.5 text-pink" /> Set
              </button>

              <button
                type="button"
                onClick={handleResetTimer}
                title="Reset timer"
                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-6 pb-2">
          <button
            type="button"
            onClick={handleOpenAccuse}
            className="w-full rounded-2xl bg-pink text-white py-4 font-display font-black text-lg card-shadow btn-3d active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Target className="h-6 w-6" /> 🎯 ACCUSE &amp; VOTE OUT
          </button>

          <button
            type="button"
            onClick={handleGoToFullResults}
            className="w-full rounded-2xl bg-white py-3.5 font-display font-bold text-foreground card-shadow border border-border/80 hover:bg-secondary/50 active:scale-95 transition text-sm"
          >
            REVEAL ALL ROLES &amp; WORD DIRECTLY
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              g.newGame();
            }}
            className="mx-auto block text-xs underline underline-offset-4 font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel &amp; New Game
          </button>
        </div>
      </div>

      {/* Room Accusation Modal */}
      {isAccusing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card rounded-3xl p-5 card-shadow border-2 border-foreground space-y-3.5 animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <div>
                <span className="text-[10px] font-black tracking-widest text-pink uppercase block">
                  ROOM ACCUSATION &amp; VOTING
                </span>
                <h3 className="font-display text-xl font-black text-foreground">
                  Who did the room vote out?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAccusing(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {suspenseState === "revealed" && selectedAccused.length > 0 ? (
              <div className="space-y-3.5 py-1 animate-in zoom-in-95 max-h-[70vh] overflow-y-auto pr-1">
                {/* Overall Group Verdict */}
                {(() => {
                  const caughtCount = selectedAccused.filter((a) => a.isImposter).length;
                  const totalAccused = selectedAccused.length;
                  const allCaught = caughtCount === actualImposterCount;
                  const noneCaught = caughtCount === 0;

                  return (
                    <div
                      className={`rounded-2xl p-4 text-center card-shadow border-2 ${
                        allCaught
                          ? "bg-lime/25 border-lime text-foreground"
                          : noneCaught
                            ? "bg-destructive/15 border-destructive text-destructive"
                            : "bg-amber-500/15 border-amber-500 text-foreground"
                      }`}
                    >
                      <span className="text-3xl block mb-1">
                        {allCaught ? "🏆" : noneCaught ? "😱" : "⚖️"}
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase mb-1 bg-background/80">
                        {allCaught ? (
                          <span className="text-foreground flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5" /> FLAWLESS CREWMATE WIN!
                          </span>
                        ) : noneCaught ? (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> IMPOSTORS ESCAPED!
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5" /> PARTIAL CATCH ({caughtCount}/
                            {actualImposterCount})
                          </span>
                        )}
                      </div>
                      <p className="font-display text-lg font-black mt-1">
                        {allCaught
                          ? `The room caught all ${actualImposterCount} Impostor${actualImposterCount > 1 ? "s" : ""}!`
                          : noneCaught
                            ? totalAccused > 1
                              ? "Both accused players were innocent! Impostors deceived everyone!"
                              : "The accused player was innocent! Impostor deceived everyone!"
                            : `Caught ${caughtCount} Impostor, but ${actualImposterCount - caughtCount} escaped!`}
                      </p>
                    </div>
                  );
                })()}

                {/* Individual Cards for each accused player */}
                <div
                  className={`grid ${selectedAccused.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-2.5`}
                >
                  {selectedAccused.map((accused) => (
                    <div
                      key={accused.playerName}
                      className={`rounded-2xl p-3.5 text-center card-shadow border-2 flex flex-col justify-between ${
                        accused.isImposter
                          ? "bg-lime/20 border-lime text-foreground"
                          : "bg-destructive/15 border-destructive text-destructive"
                      }`}
                    >
                      <div>
                        <span className="text-3xl block mb-1">
                          {accused.isImposter ? "🎉" : "😱"}
                        </span>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mb-1 ${
                            accused.isImposter
                              ? "bg-lime text-foreground"
                              : "bg-destructive text-white"
                          }`}
                        >
                          {accused.isImposter ? "IMPOSTOR" : "INNOCENT"}
                        </span>
                        <h4 className="font-display text-xl font-black mt-0.5 truncate">
                          {accused.playerName}
                        </h4>
                      </div>

                      <div className="mt-2 text-xs font-semibold opacity-90">
                        {accused.isImposter ? (
                          accused.clue ? (
                            <span className="italic font-bold">Hint: “{accused.clue}”</span>
                          ) : (
                            <span>Impostor caught!</span>
                          )
                        ) : (
                          <span>Innocent crewmate</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bounty Hunter alert if applicable */}
                {(() => {
                  const bh = g.assignments.find((a) => a.specialRole === "bounty_hunter");
                  if (bh && selectedAccused.some((a) => a.playerName === bh.bountyTargetName)) {
                    return (
                      <div className="rounded-xl bg-red-100 text-red-800 p-2.5 text-xs font-bold border border-red-300 text-center">
                        🎯 BOUNTY COLLECTED! {bh.playerName} successfully eliminated{" "}
                        {bh.bountyTargetName}!
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGoToFullResults}
                    className="w-full rounded-2xl bg-lime py-4 font-display font-black text-foreground btn-3d text-base"
                  >
                    VIEW FULL MATCH RESULTS &amp; WORD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccused([]);
                      setSuspenseState("idle");
                    }}
                    className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground py-2"
                  >
                    Change Accused Players
                  </button>
                </div>
              </div>
            ) : suspenseState === "drumroll" && selectedAccused.length > 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="text-5xl animate-bounce">🥁</div>
                <h4 className="font-display text-xl font-black text-foreground">
                  Revealing {selectedAccused.map((a) => a.playerName).join(" & ")}...
                </h4>
                <p className="text-xs font-bold text-muted-foreground animate-pulse">
                  Tension is rising in the room!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Match Imposter Count & Selection Counter */}
                <div
                  className={`rounded-2xl p-2.5 border flex items-center justify-between ${
                    actualImposterCount > 1
                      ? "bg-amber-500/10 border-amber-500/30 text-foreground"
                      : "bg-secondary/60 border-border text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-7 w-7 rounded-lg grid place-items-center text-xs font-black ${
                        actualImposterCount > 1
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          : "bg-primary/20 text-foreground"
                      }`}
                    >
                      {actualImposterCount > 1 ? "👥" : "🎯"}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider leading-none">
                        {actualImposterCount > 1
                          ? `${actualImposterCount} IMPOSTORS IN THIS MATCH`
                          : "1 IMPOSTOR IN THIS MATCH"}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                        {actualImposterCount > 1
                          ? `Select 1 or up to ${actualImposterCount} suspects`
                          : "Tap the player the room agreed to eliminate"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-display font-black border transition-all ${
                      selectedAccused.length > 0
                        ? "bg-pink text-white border-pink card-shadow"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {selectedAccused.length} / {actualImposterCount}
                  </div>
                </div>

                {/* Player Selection Cards */}
                <div className="grid grid-cols-2 gap-2.5 max-h-[42vh] overflow-y-auto pr-1 py-1">
                  {g.assignments.map((assignment, index) => {
                    const selectedIndex = selectedAccused.findIndex(
                      (a) => a.playerName === assignment.playerName,
                    );
                    const isSelected = selectedIndex !== -1;

                    const avatarTints = [
                      "bg-pink/15 text-pink border-pink/30",
                      "bg-blue-500/15 text-blue-600 border-blue-500/30",
                      "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
                      "bg-purple-500/15 text-purple-600 border-purple-500/30",
                      "bg-amber-500/15 text-amber-600 border-amber-500/30",
                      "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
                    ];
                    const tint = avatarTints[index % avatarTints.length];

                    return (
                      <button
                        key={assignment.playerName}
                        type="button"
                        onClick={() => handleTogglePlayer(assignment)}
                        className={`relative p-3 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-2.5 cursor-pointer select-none active:scale-[0.97] ${
                          isSelected
                            ? "bg-pink text-white border-pink card-shadow ring-2 ring-pink/30 shadow-md"
                            : "bg-card hover:bg-secondary/70 text-foreground border-border/80 card-shadow hover:border-border"
                        }`}
                      >
                        {/* Avatar Badge */}
                        <div
                          className={`h-9 w-9 rounded-xl border flex items-center justify-center font-display font-black text-sm shrink-0 transition-colors ${
                            isSelected ? "bg-white/20 text-white border-white/40" : tint
                          }`}
                        >
                          {assignment.playerName.charAt(0).toUpperCase()}
                        </div>

                        {/* Name & Selected order badge */}
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-display font-extrabold text-sm sm:text-base leading-tight">
                            {assignment.playerName}
                          </span>
                          {actualImposterCount > 1 && isSelected && (
                            <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-white/25 text-white px-1.5 py-0.5 rounded-sm mt-0.5">
                              Suspect #{selectedIndex + 1}
                            </span>
                          )}
                        </div>

                        {/* Checkbox indicator */}
                        <div
                          className={`h-5 w-5 rounded-md border grid place-items-center shrink-0 transition-all ${
                            isSelected
                              ? "bg-white text-pink border-white font-black scale-105"
                              : "border-border/80 bg-secondary/30 text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Reveal Action Button */}
                {selectedAccused.length > 0 ? (
                  <div className="pt-2 space-y-2 animate-in fade-in">
                    <button
                      type="button"
                      onClick={handleRevealAccused}
                      className="w-full rounded-2xl bg-destructive py-4 font-display font-black text-white btn-3d text-base flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.98] transition"
                    >
                      <Users className="h-5 w-5" />
                      {selectedAccused.length === 1
                        ? `REVEAL ${selectedAccused[0].playerName.toUpperCase()}'S IDENTITY`
                        : `REVEAL BOTH IDENTITIES (${selectedAccused.map((a) => a.playerName.toUpperCase()).join(" & ")})`}
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-2xl bg-secondary py-3.5 font-display font-bold text-muted-foreground/60 text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-border"
                    >
                      SELECT{" "}
                      {actualImposterCount > 1
                        ? `UP TO ${actualImposterCount} SUSPECTS`
                        : "A SUSPECT"}
                    </button>
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={handleGoToFullResults}
                        className="text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        Skip straight to full reveal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Set Timer Modal */}
      {isSettingTimer && (
        <TimerModal
          onClose={() => setIsSettingTimer(false)}
          initialDuration={timeLeft > 0 ? timeLeft : g.timeLimitDuration || 90}
          title="Adjust Discussion Timer"
          showToggle={false}
          onSave={(duration) => {
            setTimeLeft(duration);
            g.setTimeLimitDuration(duration);
            setIsRunning(true);
            toast.success(`Timer set to ${formatDuration(duration)}!`);
          }}
        />
      )}
    </div>
  );
}

export function DiscussScreen() {
  const g = useGame();
  if (g.gameMode === "online") {
    return <OnlineDiscussScreen />;
  }
  return <ClassicDiscussScreen />;
}

export function VoteScreen() {
  const g = useGame();
  const me = g.onlinePlayers.find((p) => p.id === g.localPlayer.id);
  const myAssignment = g.assignments.find((a) => a.playerId === g.localPlayer.id);
  const isExtraVoter = myAssignment?.specialRole === "extra_voter";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [extraSelectedId, setExtraSelectedId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);

  const myVote = me ? (isExtraVoter ? !!me.votedFor && !!me.extraVotedFor : !!me.votedFor) : false;
  const isSpectator = me ? me.spectator : false;
  const isEliminated = me ? me.eliminated : false;

  const submitVote = () => {
    if (!selectedId) return;
    if (isExtraVoter) {
      g.submitVoteAction(selectedId, extraSelectedId || selectedId);
    } else {
      g.submitVoteAction(selectedId);
    }
  };

  const candidates = g.onlinePlayers.filter((p) => !p.spectator && !p.eliminated);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-4 flex flex-col gap-3">
        {/* Status Indicator */}
        <div className="rounded-2xl bg-card p-4 card-shadow text-center border-2 border-pink/30 flex flex-col items-center select-none">
          <p className="font-display text-[10px] font-extrabold tracking-widest text-pink uppercase">
            VOTING PHASE — ROUND {g.currentVoteIndex + 1}
          </p>
          <h2 className="font-display text-xl font-extrabold text-foreground mt-0.5">
            {myVote
              ? "VOTE REGISTERED!"
              : isSpectator || isEliminated
                ? "WATCHING VOTES..."
                : isExtraVoter
                  ? "CAST YOUR 2 BALLOTS!"
                  : "CAST YOUR BALLOT!"}
          </h2>
          <p className="text-[10px] text-muted-foreground mt-1">
            {myVote
              ? "Your vote is locked. Waiting for other players to submit."
              : isSpectator
                ? "You are spectating. You can chat but cannot vote."
                : isEliminated
                  ? "You are eliminated. You can chat but cannot vote."
                  : isExtraVoter
                    ? "You are The Extra Voter! You have 2 votes (same player or different players)."
                    : "Tap a player below to choose them, then confirm your vote."}
          </p>
        </div>

        {/* Extra Voter Slot Selection */}
        {!(isSpectator || isEliminated) && !myVote && isExtraVoter && (
          <div className="rounded-xl bg-pink/10 border border-pink/30 p-2.5 space-y-1.5 select-none">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-display font-extrabold text-pink uppercase flex items-center gap-1">
                <Vote className="h-3.5 w-3.5" /> EXTRA VOTER (2 VOTES)
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Vote same or different
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveSlot(1)}
                className={`rounded-lg py-1.5 px-2 text-xs font-bold text-left border transition ${
                  activeSlot === 1
                    ? "bg-pink text-white border-pink"
                    : "bg-card text-foreground/80 border-border"
                }`}
              >
                <span className="text-[9px] block opacity-80 uppercase">
                  Vote 1 (Click to set):
                </span>
                <span className="truncate block font-extrabold">
                  {candidates.find((c) => c.id === selectedId)?.name || "— Select player —"}
                </span>
              </button>
              <button
                onClick={() => setActiveSlot(2)}
                className={`rounded-lg py-1.5 px-2 text-xs font-bold text-left border transition ${
                  activeSlot === 2
                    ? "bg-pink text-white border-pink"
                    : "bg-card text-foreground/80 border-border"
                }`}
              >
                <span className="text-[9px] block opacity-80 uppercase">
                  Vote 2 (Click to set):
                </span>
                <span className="truncate block font-extrabold">
                  {candidates.find((c) => c.id === extraSelectedId)?.name ||
                    (selectedId
                      ? `${candidates.find((c) => c.id === selectedId)?.name} (same)`
                      : "— Select player —")}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Voting Ballot Box */}
        {!(isSpectator || isEliminated) && !myVote && (
          <div className="space-y-1.5 select-none">
            <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
              {isExtraVoter ? `Choose target for Vote ${activeSlot}:` : "Ballot:"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {candidates.map((p) => {
                const isSelectedSlot1 = selectedId === p.id;
                const isSelectedSlot2 = extraSelectedId === p.id;
                const isSelected = isExtraVoter
                  ? activeSlot === 1
                    ? isSelectedSlot1
                    : isSelectedSlot2
                  : isSelectedSlot1;
                const isSelf = p.id === g.localPlayer.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (isExtraVoter) {
                        if (activeSlot === 1) {
                          setSelectedId(p.id);
                          if (!extraSelectedId) setActiveSlot(2);
                        } else {
                          setExtraSelectedId(p.id);
                        }
                      } else {
                        setSelectedId(p.id);
                      }
                    }}
                    className={`rounded-2xl p-2.5 card-shadow flex flex-col items-center gap-1 border-2 text-center transition ${
                      isSelected
                        ? "bg-pink border-pink text-white"
                        : isSelectedSlot1 || isSelectedSlot2
                          ? "bg-pink/20 border-pink/40 text-foreground"
                          : "bg-card border-border text-foreground hover:border-pink/50"
                    }`}
                  >
                    <span className="text-3xl">{p.avatar}</span>
                    <span className="font-display font-extrabold truncate max-w-full text-xs">
                      {p.name}
                      {isSelf && " (YOU)"}
                    </span>
                    {isExtraVoter && (isSelectedSlot1 || isSelectedSlot2) && (
                      <span className="text-[9px] font-extrabold bg-pink text-white px-1.5 rounded-full">
                        {isSelectedSlot1 && isSelectedSlot2
                          ? "VOTES 1 & 2"
                          : isSelectedSlot1
                            ? "VOTE 1"
                            : "VOTE 2"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={submitVote}
              disabled={!selectedId}
              className="w-full mt-2 rounded-2xl bg-lime py-4 font-display font-extrabold text-foreground/90 flex items-center justify-center gap-2 btn-3d disabled:opacity-40"
            >
              {isExtraVoter ? "CONFIRM BOTH VOTES (2)" : "CONFIRM VOTE"}
            </button>
          </div>
        )}

        {/* Waiting Status / Voted List */}
        {(myVote || isSpectator || isEliminated) && (
          <div className="rounded-2xl bg-card p-3 card-shadow space-y-2 border border-border select-none">
            <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase text-center">
              Voter list:
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {candidates.map((p) => {
                const hasVoted = !!p.votedFor;
                return (
                  <span
                    key={p.id}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                      hasVoted
                        ? "bg-lime/20 text-foreground"
                        : "bg-secondary text-muted-foreground/60"
                    }`}
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                    {hasVoted ? (
                      <span className="text-[9px] text-lime font-extrabold">✓</span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground animate-pulse font-bold">
                        ...
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Clue Board */}
        <ClueBoard players={g.onlinePlayers} turnOrder={g.turnOrder} clues={g.clues} />

        {/* Chat window */}
        <ChatPanel
          chat={g.onlineChat}
          localPlayerId={g.localPlayer.id}
          onSend={g.sendChatMessage}
        />
      </div>
    </div>
  );
}

function OnlineResultScreen() {
  const g = useGame();
  const imposters = g.assignments.filter((a) => a.isImposter);
  const me = g.onlinePlayers.find((p) => p.id === g.localPlayer.id);
  const isHost = me ? me.isHost : false;

  const secretWord = g.word;
  const hintWord = imposters.find((imp) => imp.clue)?.clue;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-4 flex flex-col gap-3">
        {/* Winner Banner */}
        <div className="rounded-3xl bg-card p-5 card-shadow text-center border-4 border-yellow/60 card-ray-bg select-none">
          <p className="font-display text-[10px] font-extrabold tracking-widest text-pink/85 uppercase">
            GAME OVER
          </p>
          <h2 className="mt-1 font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
            {g.onlineWinner === "crew" ? "CREWMATES WIN!" : "IMPOSTOR WINS!"}
          </h2>
          <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-foreground/80">Impostors:</span>
            {imposters.map((imp) => (
              <span
                key={imp.playerId}
                className="rounded-full bg-pink/15 text-pink font-extrabold px-2.5 py-0.5 text-xs border border-pink/20"
              >
                {imp.playerName}
              </span>
            ))}
          </div>
          {hintWord && (
            <p className="mt-2 text-xs text-foreground/75 italic">Hint given: “{hintWord}”</p>
          )}
        </div>

        {/* Secret Word */}
        <div className="rounded-2xl bg-card p-4.5 card-shadow flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">
              SECRET WORD
            </p>
            <p className="font-display text-2xl font-extrabold text-pink mt-0.5">{secretWord}</p>
          </div>
          {g.category && (
            <div className="text-right">
              <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">
                CATEGORY
              </p>
              <p className="font-bold text-foreground/80 text-sm mt-0.5">{g.category}</p>
            </div>
          )}
        </div>

        {/* Special Roles Reveal */}
        <SpecialRolesReveal assignments={g.assignments} />

        {/* Vote breakdown */}
        {g.votingHistory.length > 0 && (
          <div className="rounded-2xl bg-card p-4 card-shadow border border-border/70 space-y-2.5 max-h-[22vh] overflow-y-auto select-none">
            <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase text-center">
              VOTING ROUND HISTORY:
            </p>
            {g.votingHistory.map((history, idx) => {
              const elimPlayer = g.onlinePlayers.find((p) => p.id === history.eliminatedPlayerId);
              return (
                <div
                  key={idx}
                  className="text-xs border-b border-border/40 last:border-0 pb-2 last:pb-0 space-y-1.5"
                >
                  <p className="font-bold text-foreground/80">
                    Vote #{history.voteIndex + 1}:{" "}
                    {elimPlayer ? (
                      <>
                        Eliminated{" "}
                        <span className="text-pink font-extrabold">{elimPlayer.name}</span>
                        {history.wasImposter ? (
                          <span className="ml-1 bg-destructive/15 text-destructive font-bold px-1.5 py-0.2 rounded text-[8px] uppercase">
                            IMPOSTOR
                          </span>
                        ) : (
                          <span className="ml-1 bg-secondary text-muted-foreground font-bold px-1.5 py-0.2 rounded text-[8px] uppercase">
                            CREWMATE
                          </span>
                        )}
                      </>
                    ) : (
                      "No one eliminated (Tie)"
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-x-2.5 gap-y-0.5 pl-2 border-l border-border/50 text-[10px] text-muted-foreground/80 font-semibold">
                    {history.votes.map((vote, vIdx) => {
                      const voter = g.onlinePlayers.find((p) => p.id === vote.voterId);
                      const target = g.onlinePlayers.find((p) => p.id === vote.targetId);
                      if (!voter || !target) return null;
                      return (
                        <div key={vIdx} className="truncate flex items-center gap-1">
                          <span>
                            {voter.name} → {target.name}
                          </span>
                          {vote.isExtraVote && (
                            <span className="text-[8px] bg-pink/20 text-pink font-extrabold px-1 rounded">
                              +1
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Clue Board */}
        <ClueBoard players={g.onlinePlayers} turnOrder={g.turnOrder} clues={g.clues} />

        {/* Chat panel */}
        <ChatPanel
          chat={g.onlineChat}
          localPlayerId={g.localPlayer.id}
          onSend={g.sendChatMessage}
        />

        {/* New Game trigger */}
        <div className="mt-2 space-y-2 select-none">
          {isHost ? (
            <button
              onClick={g.newGame}
              className="w-full rounded-2xl bg-lime py-4.5 font-display text-xl font-extrabold text-foreground btn-3d"
            >
              START NEW GAME
            </button>
          ) : (
            <div className="rounded-2xl bg-secondary/80 py-4 font-display text-md font-bold text-center text-muted-foreground card-shadow animate-pulse">
              🎮 WAITING FOR HOST TO RESTART GAME
            </div>
          )}

          <button
            onClick={g.exitToLobby}
            className="w-full rounded-2xl bg-secondary py-3.5 font-display font-bold text-foreground card-shadow hover:bg-secondary/70 active:scale-95 transition"
          >
            BACK TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassicResultScreen() {
  const g = useGame();
  const imposters = g.assignments.filter((a) => a.isImposter);

  const accusedNames =
    g.classicAccusedPlayerNames && g.classicAccusedPlayerNames.length > 0
      ? g.classicAccusedPlayerNames
      : g.classicAccusedPlayerName
        ? [g.classicAccusedPlayerName]
        : [];

  const accusedAssignments = accusedNames
    .map((name) => g.assignments.find((a) => a.playerName === name))
    .filter(Boolean) as Assignment[];

  const imposterAccusedCount = accusedAssignments.filter((a) => a.isImposter).length;
  const totalAccused = accusedAssignments.length;
  const allCaught = imposterAccusedCount === imposters.length && imposterAccusedCount > 0;
  const partialCaught = imposterAccusedCount > 0 && imposterAccusedCount < imposters.length;

  useEffect(() => {
    if (accusedAssignments.length > 0) {
      if (allCaught || partialCaught) {
        sounds.playVictory();
      } else {
        sounds.playDefeat();
      }
    }
  }, [accusedAssignments.length, allCaught, partialCaught]);

  return (
    <div className="min-h-dvh bg-background flex flex-col animate-in fade-in">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-6 text-center space-y-4">
        {/* Accused Room Verdict Banner if players were voted out */}
        {accusedAssignments.length > 0 && (
          <div
            className={`rounded-3xl p-5 card-shadow text-center border-2 ${
              allCaught
                ? "bg-lime/20 border-lime text-foreground"
                : partialCaught
                  ? "bg-amber-500/15 border-amber-500/40 text-foreground"
                  : "bg-destructive/15 border-destructive/40 text-destructive"
            }`}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase mb-1 bg-background/80">
              {allCaught ? (
                <span className="text-foreground flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-lime fill-lime" /> FLAWLESS CREWMATE VICTORY
                </span>
              ) : partialCaught ? (
                <span className="text-amber-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> PARTIAL CATCH ({imposterAccusedCount}/
                  {imposters.length} IMPOSTORS)
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> IMPOSTORS ESCAPED
                </span>
              )}
            </div>
            <h3 className="font-display text-2xl font-black mt-1">
              {accusedNames.length === 1
                ? `${accusedNames[0]} was eliminated!`
                : `${accusedNames.join(" & ")} were eliminated!`}
            </h3>

            {/* Suspect individual role chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {accusedAssignments.map((a) => (
                <span
                  key={a.playerId}
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    a.isImposter
                      ? "bg-destructive text-white border-destructive shadow-sm"
                      : "bg-secondary text-foreground/80 border-border"
                  }`}
                >
                  {a.playerName}: {a.isImposter ? "🚨 Impostor" : "🕊️ Innocent"}
                </span>
              ))}
            </div>

            <p className="text-xs font-semibold text-foreground/80 mt-2">
              {allCaught
                ? "Every suspect voted out was an Impostor! Outstanding detective work."
                : partialCaught
                  ? "The room caught an Impostor, but another escaped unnoticed!"
                  : "The room eliminated innocent player(s). The Impostors survived!"}
            </p>
          </div>
        )}

        {/* Impostor Reveal Card */}
        <div className="rounded-3xl bg-card p-5 card-shadow border border-border/80">
          <p className="font-display text-xs font-extrabold tracking-widest text-muted-foreground uppercase">
            THE IMPOSTORS WERE:
          </p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl font-black text-destructive">
            {imposters.map((i) => i.playerName).join(", ")}
          </h2>
          {imposters.some((i) => i.clue) && (
            <p className="mt-2 text-foreground/80 text-xs font-medium">
              Hints:{" "}
              {imposters
                .filter((i) => i.clue)
                .map((i) => `${i.playerName} → “${i.clue}”`)
                .join(" · ")}
            </p>
          )}
        </div>

        {/* Secret Word Card */}
        <div className="rounded-2xl bg-card p-4 card-shadow border border-border/80 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] font-extrabold text-muted-foreground tracking-wider uppercase">
              SECRET WORD
            </p>
            <p className="font-display text-2xl sm:text-3xl font-black text-pink mt-0.5">
              {g.word}
            </p>
          </div>
          {g.category && (
            <div className="text-right">
              <p className="text-[10px] font-extrabold text-muted-foreground tracking-wider uppercase">
                CATEGORY
              </p>
              <p className="font-bold text-foreground/80 text-sm mt-0.5">{g.category}</p>
            </div>
          )}
        </div>

        {/* Special Roles Reveal */}
        <div>
          <SpecialRolesReveal assignments={g.assignments} />
        </div>

        {/* Quick Rematch & Navigation */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              g.newGame();
            }}
            className="w-full rounded-2xl bg-lime py-4.5 font-display text-xl font-extrabold text-foreground btn-3d flex items-center justify-center gap-2"
          >
            <Zap className="h-5 w-5 fill-foreground text-foreground" />
            PLAY AGAIN (NEW WORD)
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              g.exitToLobby();
            }}
            className="w-full rounded-2xl bg-secondary py-3.5 font-display font-bold text-foreground card-shadow hover:bg-secondary/70 active:scale-95 transition"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResultScreen() {
  const g = useGame();
  if (g.gameMode === "online") {
    return <OnlineResultScreen />;
  }
  return <ClassicResultScreen />;
}

/* ---------------- INITIATOR SCREEN ---------------- */

export function InitiatorScreen() {
  const g = useGame();
  const isOnline = g.gameMode === "online";
  const me = isOnline ? g.onlinePlayers.find((p) => p.id === g.localPlayer.id) : null;
  const isHost = isOnline ? (me ? me.isHost : false) : true;

  const initiatorAssignment = g.assignments.find((a) => a.specialRole === "initiator");
  const extraVoterAssignment = g.assignments.find((a) => a.specialRole === "extra_voter");

  const initiatorName = initiatorAssignment?.playerName;
  const extraVoterName = extraVoterAssignment?.playerName;

  const handleRevealRoles = () => {
    if (isOnline) {
      g.revealRolesFromInitiatorAction();
    } else {
      g.revealResult();
    }
  };

  const handleProceedToClues = () => {
    if (isOnline) {
      g.proceedFromInitiatorAction();
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col animate-in fade-in">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-4 flex flex-col justify-between">
        <div className="space-y-4 pt-2">
          {/* Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow/20 border border-yellow/40 px-3.5 py-1 text-xs font-display font-extrabold text-foreground tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 text-pink" /> PUBLIC ROLES REVEAL
            </span>
          </div>

          {/* Initiator Spotlight Card */}
          {initiatorName && (
            <div className="rounded-3xl bg-card p-5 card-shadow text-center border-2 border-yellow/60 card-ray-bg space-y-2">
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow/20 border border-yellow/50 px-3 py-0.5 text-xs font-display font-black text-foreground uppercase tracking-wider">
                  <Zap className="h-3.5 w-3.5 text-yellow fill-yellow" /> THE INITIATOR
                </span>
              </div>
              <div className="py-1">
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground drop-shadow-sm">
                  {initiatorName}
                </h2>
              </div>
              <p className="text-xs font-semibold text-foreground/80 leading-snug">
                <span className="font-extrabold text-foreground">{initiatorName}</span> chooses
                which player speaks first during clue discussion!
              </p>
            </div>
          )}

          {/* Extra Voter Spotlight Card */}
          {extraVoterName && (
            <div className="rounded-3xl bg-card p-5 card-shadow text-center border-2 border-purple-400/60 card-ray-bg space-y-2">
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 px-3 py-0.5 text-xs font-display font-black uppercase tracking-wider">
                  <Vote className="h-3.5 w-3.5 text-purple-700" /> THE EXTRA VOTER
                </span>
              </div>
              <div className="py-1">
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground drop-shadow-sm">
                  {extraVoterName}
                </h2>
              </div>
              <p className="text-xs font-semibold text-foreground/80 leading-snug">
                <span className="font-extrabold text-foreground">{extraVoterName}</span> gets an
                extra vote (2 votes total) during voting!
              </p>
            </div>
          )}

          {/* Note Card */}
          <div className="rounded-2xl bg-yellow/15 border-2 border-yellow/40 p-3.5 card-shadow">
            <div className="flex items-start gap-2.5">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <p className="text-xs font-display font-extrabold uppercase tracking-wide text-foreground">
                  IMPORTANT NOTE
                </p>
                <p className="text-xs font-semibold text-foreground/85 mt-0.5 leading-relaxed">
                  {initiatorName && extraVoterName
                    ? "Both roles can be either an "
                    : "This role can be either an "}
                  <span className="font-extrabold text-destructive">IMPOSTOR</span> or a{" "}
                  <span className="font-extrabold text-foreground">CREWMATE</span>. Listen closely
                  to what they say and watch how they vote!
                </p>
              </div>
            </div>
          </div>

          {/* Online Chat if online mode */}
          {isOnline && (
            <ChatPanel
              chat={g.onlineChat}
              localPlayerId={g.localPlayer.id}
              onSend={g.sendChatMessage}
            />
          )}

          {/* In-person prompt if classic mode */}
          {!isOnline && (
            <div className="rounded-2xl bg-secondary/40 p-3.5 border border-border/50 text-center">
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                {initiatorName ? "The Initiator chooses who speaks first. " : ""}
                Take turns giving your clues in order. Once everyone has discussed and voted, tap
                below to reveal all roles!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2.5 select-none pb-4">
          {!isOnline && (
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                g.goToDiscuss();
              }}
              className="w-full rounded-2xl bg-lime py-4.5 font-display text-xl font-extrabold text-foreground/90 card-shadow btn-3d active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Play className="h-6 w-6 fill-current" /> START DISCUSSION &amp; TIMER
            </button>
          )}

          {/* Main button: REVEAL ALL ROLES */}
          <button
            type="button"
            onClick={handleRevealRoles}
            className={`w-full rounded-2xl py-3.5 font-display text-base font-extrabold card-shadow active:scale-[0.98] transition flex items-center justify-center gap-2 ${
              isOnline
                ? "bg-lime text-foreground/90 btn-3d py-4.5 text-xl"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <Sparkles className="h-5 w-5" /> REVEAL ALL ROLES DIRECTLY
          </button>

          {isOnline && isHost && (
            <button
              onClick={handleProceedToClues}
              className="w-full rounded-2xl bg-secondary py-3.5 font-display font-bold text-foreground card-shadow hover:bg-secondary/70 active:scale-95 transition"
            >
              PROCEED TO CLUE ROUNDS (ONLINE)
            </button>
          )}

          <button
            onClick={() => {
              sounds.playTap();
              g.newGame();
            }}
            className="mx-auto block text-xs underline underline-offset-4 font-semibold text-muted-foreground hover:text-foreground"
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
}
