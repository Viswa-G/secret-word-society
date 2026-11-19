import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Users,
  Globe,
  ChevronRight,
  Shield,
  Zap,
  Vote,
  Target,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useGame, type MatchHistoryEntry, type MatchHistoryPlayer } from "@/lib/game-store";
import { sounds } from "@/lib/sounds";

export const Route = createFileRoute("/history")({
  component: MatchHistoryPage,
});

function formatTimestamp(timestamp: number) {
  try {
    const date = new Date(timestamp);
    const rel = formatDistanceToNow(date, { addSuffix: true });
    const full = format(date, "MMM d, yyyy · h:mm a");
    return { rel, full };
  } catch {
    const d = new Date(timestamp);
    return { rel: "", full: d.toLocaleString() };
  }
}

function RoleBadge({ player }: { player: MatchHistoryPlayer }) {
  if (player.isImposter) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-destructive/15 text-destructive border border-destructive/30">
        🕵️ Impostor
      </span>
    );
  }

  if (player.specialRole === "guardian_angel") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
        <Shield className="h-3 w-3" /> Angel · Crew
      </span>
    );
  }

  if (player.specialRole === "initiator") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
        <Zap className="h-3 w-3" /> Initiator · Crew
      </span>
    );
  }

  if (player.specialRole === "extra_voter") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
        <Vote className="h-3 w-3" /> Extra Voter · Crew
      </span>
    );
  }

  if (player.specialRole === "bounty_hunter") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
        <Target className="h-3 w-3" /> Bounty Hunter · Crew
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary text-muted-foreground border border-border/60">
      🧑‍🚀 Crewmate
    </span>
  );
}

/* ---------------- MATCH DETAILS VIEW ---------------- */

function MatchDetailView({ match, onBack }: { match: MatchHistoryEntry; onBack: () => void }) {
  const { rel, full } = formatTimestamp(match.timestamp);
  const imposters = match.players.filter((p) => p.isImposter);

  return (
    <div className="min-h-dvh bg-background flex flex-col animate-in fade-in">
      {/* Top Bar - No delete button on single page history */}
      <div className="mx-auto w-full max-w-md px-4">
        <div className="flex items-center justify-between pt-4 pb-2">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onBack();
            }}
            className="text-muted-foreground hover:text-foreground flex items-center justify-center p-2 rounded-2xl hover:bg-secondary/60 active:scale-95 transition"
            aria-label="Back to match list"
            title="Back to list"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <h1 className="font-display text-lg font-black uppercase tracking-tight text-foreground">
            MATCH DETAILS
          </h1>

          <div className="w-10" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-2 flex flex-col gap-3.5 pb-8">
        {/* Match Header Tag */}
        <div className="flex items-center justify-between gap-2 px-1 text-xs font-semibold text-muted-foreground">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-display font-extrabold uppercase tracking-wide border ${
              match.gameMode === "online"
                ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
                : "bg-secondary text-foreground/80 border-border"
            }`}
          >
            {match.gameMode === "online" ? (
              <>
                <Globe className="h-3 w-3" /> Online
              </>
            ) : (
              <>
                <Users className="h-3 w-3" /> Classic
              </>
            )}
          </span>
          <span title={full}>
            {rel} • {full}
          </span>
        </div>

        {/* Secret Word & Category */}
        <div className="rounded-2xl bg-card p-4 card-shadow border border-border/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase block">
              Secret Word
            </span>
            <span className="font-display text-2xl font-black text-pink tracking-tight">
              {match.word}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase block">
              Category
            </span>
            <span className="font-bold text-foreground text-sm">{match.category}</span>
          </div>
        </div>

        {/* Impostors Spotlight - Clean: no escaped/caught pills, no voted out count */}
        <div className="rounded-2xl bg-pink/10 border border-pink/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-display font-black uppercase text-pink tracking-wider flex items-center gap-1.5">
              🕵️ THE IMPOSTORS ({imposters.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {imposters.map((imp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card/85 border border-pink/20"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-7 w-7 rounded-full bg-pink/20 text-pink flex items-center justify-center font-black text-xs shrink-0">
                    {imp.playerName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <span className="font-display font-black text-sm text-foreground truncate block">
                      {imp.playerName}
                    </span>
                    {imp.clue && (
                      <span className="text-xs text-muted-foreground italic truncate block">
                        Hint: “{imp.clue}”
                      </span>
                    )}
                  </div>
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-pink/20 text-pink border border-pink/30 shrink-0">
                  Impostor
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Members & Full Role Roster */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-display font-extrabold uppercase text-muted-foreground tracking-wider block px-0.5">
            👥 ALL PLAYERS & ROLES ({match.players.length})
          </span>

          <div className="space-y-2">
            {match.players.map((p, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                  p.isImposter ? "bg-pink/5 border-pink/30" : "bg-card border-border/70"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-black text-xs text-foreground shrink-0 border border-border/70">
                    {p.playerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="font-display font-black text-sm text-foreground truncate block">
                      {p.playerName}
                    </span>
                    {p.specialRole === "guardian_angel" && p.guardianAngelClue && (
                      <span className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold block truncate">
                        Saw hint: “{p.guardianAngelClue}”
                      </span>
                    )}
                    {p.specialRole === "bounty_hunter" && p.bountyTargetName && (
                      <span className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold block truncate">
                        Target: {p.bountyTargetName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <RoleBadge player={p} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button at Bottom */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onBack();
            }}
            className="w-full rounded-2xl bg-secondary py-3.5 font-display font-bold text-foreground card-shadow hover:bg-secondary/70 active:scale-95 transition"
          >
            ← Back to History List
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- MATCH HISTORY MAIN LIST PAGE ---------------- */

function MatchHistoryPage() {
  const g = useGame();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const history = g.matchHistory;

  const handleClearAll = () => {
    sounds.playTap();
    g.clearMatchHistory();
    setSelectedMatchId(null);
    setShowClearConfirm(false);
    toast.success("All match history cleared");
  };

  // If a match is selected, show the Detail Screen
  const selectedMatch = history.find((m) => m.id === selectedMatchId);
  if (selectedMatch) {
    return <MatchDetailView match={selectedMatch} onBack={() => setSelectedMatchId(null)} />;
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <div className="mx-auto w-full max-w-md px-4">
        <div className="flex items-center justify-between pt-4 pb-2">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground flex items-center justify-center p-2 rounded-2xl hover:bg-secondary/60 active:scale-95 transition"
            aria-label="Back to Lobby"
            title="Back to Lobby"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>

          <h1 className="font-display text-lg font-black uppercase tracking-tight text-foreground">
            MATCH HISTORY
          </h1>

          {history.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setShowClearConfirm(true);
              }}
              className="text-muted-foreground/70 hover:text-destructive p-2 rounded-2xl hover:bg-destructive/10 transition active:scale-95"
              aria-label="Clear all match history"
              title="Clear all history"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-2 flex flex-col gap-3 pb-8">
        {history.length > 0 ? (
          <div className="space-y-2.5">
            {history.map((match) => {
              const { rel, full } = formatTimestamp(match.timestamp);

              return (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setSelectedMatchId(match.id);
                  }}
                  className="w-full text-left rounded-2xl bg-card p-4 card-shadow border border-border/80 hover:border-pink/50 active:scale-[0.99] transition flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Mode & Date & Time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-display font-black uppercase tracking-wider border ${
                          match.gameMode === "online"
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
                            : "bg-secondary text-foreground/80 border-border"
                        }`}
                      >
                        {match.gameMode === "online" ? (
                          <>
                            <Globe className="h-3 w-3" /> Online
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3" /> Classic
                          </>
                        )}
                      </span>

                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {rel} • {full}
                      </span>
                    </div>

                    {/* Secret Word & Impostor Count */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-display font-black text-sm text-foreground truncate">
                          {match.word}
                        </span>
                        <span className="text-[10px] text-muted-foreground/75 truncate hidden sm:inline">
                          ({match.category})
                        </span>
                      </div>

                      <span className="text-xs font-black text-pink shrink-0">
                        🕵️ {match.imposterCount}{" "}
                        {match.imposterCount === 1 ? "Impostor" : "Impostors"}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pl-1 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty History */
          <div className="rounded-3xl bg-card p-8 card-shadow text-center space-y-4 border border-border/80 mt-6">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-secondary/80 flex items-center justify-center text-3xl">
              📜
            </div>
            <div>
              <h3 className="font-display font-black text-xl uppercase text-foreground">
                NO MATCH HISTORY YET
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                Play a round in Classic or Online mode! Completed matches will appear in this list.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lime px-6 py-3.5 font-display text-sm font-black uppercase text-foreground btn-3d"
            >
              Start a New Game
            </Link>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs rounded-3xl bg-card p-5 card-shadow border-2 border-border space-y-4 text-center">
            <span className="text-3xl block">⚠️</span>
            <div>
              <h3 className="font-display font-black text-lg uppercase text-foreground">
                Clear All History?
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                This will delete all saved match records permanently.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setShowClearConfirm(false);
                }}
                className="rounded-xl bg-secondary py-2.5 text-xs font-display font-black uppercase text-foreground hover:bg-secondary/80 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-xl bg-destructive py-2.5 text-xs font-display font-black uppercase text-destructive-foreground hover:bg-destructive/90 transition"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
