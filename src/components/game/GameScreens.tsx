import { useEffect, useRef, useState } from "react";
import { X, ChevronRight, Hand, Play, Send, Crown } from "lucide-react";
import { useGame, type Player, type ChatMessage } from "@/lib/game-store";

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
  return (
    <div className="flex items-center justify-between pt-4">
      <div className="w-10" />
      <LogoBadge />
      <button onClick={onClose} aria-label="Exit" className="text-muted-foreground p-2">
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
                <td className="py-2 font-bold flex items-center gap-1 pr-4 truncate max-w-[110px]">
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
    <div className="w-full flex-1 flex flex-col rounded-2xl bg-card card-shadow border border-border overflow-hidden min-h-[220px]">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[200px]">
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
    holdTimer.current = window.setTimeout(() => {
      setFlipped(true);
      setFlippedOnce(true);
      if (!isOnline) {
        g.markViewed();
      }
    }, 180);
  };

  const endHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
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
        <div
          className={`relative w-full aspect-[3/4] max-h-[60vh] rounded-3xl card-shadow overflow-hidden select-none touch-none ${flipped ? softColor : cardColor} card-ray-bg transition-colors`}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
        >
          {/* Player name */}
          <div className="absolute top-10 left-0 right-0 text-center">
            <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
              {assignment.playerName}
            </h2>
            {!flipped && (
              <p className="mt-2 text-base font-semibold text-foreground/80">
                Do not tell the word to other players.
              </p>
            )}
          </div>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!flipped ? (
              <div className="flex flex-col items-center gap-3">
                <Hand className="h-20 w-20 text-foreground" strokeWidth={2} />
                <p className="font-display text-lg font-extrabold">HOLD TO REVEAL</p>
              </div>
            ) : assignment.isImposter ? (
              <div className="mx-6 rounded-2xl border-2 border-foreground bg-white px-6 py-8 text-center card-shadow">
                <p className="font-display text-2xl font-extrabold leading-tight text-destructive">
                  YOU ARE THE<br />IMPOSTER!
                </p>
                {assignment.clue && (
                  <p className="mt-3 text-lg text-foreground/80">Hint: {assignment.clue}</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-foreground bg-white px-8 py-4">
                <p className="font-display text-3xl font-extrabold">{g.word}</p>
              </div>
            )}
          </div>
        </div>

        {isOnline ? (
          <div className="w-full mt-6 space-y-4">
            <button
              onClick={g.markReadyAction}
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
          <button
            onClick={g.nextPlayer}
            disabled={!canNext}
            className="mt-8 w-full max-w-sm rounded-full bg-foreground py-4 font-display text-lg font-extrabold text-background flex items-center justify-center gap-2 btn-3d disabled:opacity-40"
          >
            <Play className="h-5 w-5 fill-current" /> NEXT PLAYER
          </button>
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
  const displayWord = myAssignment?.isImposter ? (myAssignment.clue || "Imposter Hint") : g.word;

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
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
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
                YOUR CARD WORD: <span className="text-sm text-pink font-extrabold tracking-normal font-body">{displayWord}</span>
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

export function DiscussScreen() {
  const g = useGame();

  if (g.gameMode === "online") {
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
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[300px]">
              Chat, debate clues, and catch the Imposter. Press "Ready to Vote" when ready to
              proceed.
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
        </div>
      </div>
    );
  }

  // Classic Discuss Screen (original)
  const starter =
    g.assignments.find((a) => !a.isImposter)?.playerName ??
    g.assignments[0]?.playerName ??
    "Someone";

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>
      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-8 text-center animate-in fade-in">
        <h1 className="font-display text-3xl font-extrabold leading-tight">
          Game started! Time to talk and catch the imposter.
        </h1>
        <p className="mt-6 text-lg">
          <span className="rounded bg-lime px-2 py-0.5 font-bold text-foreground">{starter}</span>{" "}
          starts the conversation!
        </p>

        <button
          onClick={g.revealResult}
          className="mt-12 w-full rounded-2xl bg-white py-5 font-display font-extrabold text-foreground card-shadow btn-3d active:scale-[0.98] transition"
        >
          REVEAL IMPOSTER &amp; WORD
        </button>
        <button
          onClick={g.newGame}
          className="mt-4 mx-auto block underline underline-offset-4 font-semibold"
        >
          New Game
        </button>
      </div>
    </div>
  );
}

export function VoteScreen() {
  const g = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const me = g.onlinePlayers.find((p) => p.id === g.localPlayer.id);
  const myVote = me ? me.votedFor : undefined;
  const isSpectator = me ? me.spectator : false;
  const isEliminated = me ? me.eliminated : false;

  const submitVote = () => {
    if (!selectedId) return;
    g.submitVoteAction(selectedId);
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
                : "CAST YOUR BALLOT!"}
          </h2>
          <p className="text-[10px] text-muted-foreground mt-1">
            {myVote
              ? "Your vote is locked. Waiting for other players to submit."
              : isSpectator
                ? "You are spectating. You can chat but cannot vote."
                : isEliminated
                  ? "You are eliminated. You can chat but cannot vote."
                  : "Tap a player below to choose them, then confirm your vote."}
          </p>
        </div>

        {/* Voting Ballot Box */}
        {!(isSpectator || isEliminated) && !myVote && (
          <div className="space-y-1.5 select-none">
            <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase ml-1">
              Ballot:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {candidates.map((p) => {
                const isSelected = selectedId === p.id;
                const isSelf = p.id === g.localPlayer.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`rounded-2xl p-2.5 card-shadow flex flex-col items-center gap-1 border-2 text-center transition ${
                      isSelected
                        ? "bg-pink border-pink text-white"
                        : "bg-card border-border text-foreground hover:border-pink/50"
                    }`}
                  >
                    <span className="text-3xl">{p.avatar}</span>
                    <span className="font-display font-extrabold truncate max-w-full text-xs">
                      {p.name}
                      {isSelf && " (YOU)"}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={submitVote}
              disabled={!selectedId}
              className="w-full mt-2 rounded-2xl bg-lime py-4 font-display font-extrabold text-foreground/90 flex items-center justify-center gap-2 btn-3d disabled:opacity-40"
            >
              CONFIRM VOTE
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

export function ResultScreen() {
  const g = useGame();
  const imposters = g.assignments.filter((a) => a.isImposter);

  if (g.gameMode === "online") {
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
                          <div key={vIdx} className="truncate">
                            {voter.name} → {target.name}
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

  // Classic Result Screen (original)
  return (
    <div className="min-h-dvh bg-background flex flex-col animate-in fade-in">
      <div className="mx-auto w-full max-w-md px-4">
        <TopBar onClose={g.exitToLobby} />
      </div>
      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-10 text-center">
        <p className="font-display text-sm font-extrabold tracking-widest text-foreground/70">
          IMPOSTERS:
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold">
          {imposters.map((i) => i.playerName).join(", ")}
        </h2>
        {imposters.some((i) => i.clue) && (
          <p className="mt-3 text-foreground/70">
            Hints:{" "}
            {imposters
              .filter((i) => i.clue)
              .map((i) => `${i.playerName} → “${i.clue}”`)
              .join(" · ")}
          </p>
        )}

        <div className="mx-auto my-6 h-px w-4/5 bg-border" />

        <p className="font-display text-sm font-extrabold tracking-widest text-foreground/70">
          WORD:
        </p>
        <p className="mt-2 font-display text-4xl font-extrabold text-pink">{g.word}</p>
        {g.category && <p className="mt-1 text-sm text-muted-foreground">{g.category}</p>}

        <button
          onClick={g.newGame}
          className="mt-10 rounded-2xl bg-lime px-10 py-4 font-display font-extrabold text-foreground btn-3d"
        >
          NEW GAME
        </button>
        <button
          onClick={g.exitToLobby}
          className="mt-4 mx-auto block underline underline-offset-4 font-semibold text-muted-foreground"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
