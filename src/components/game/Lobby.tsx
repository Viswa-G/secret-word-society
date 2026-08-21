import { useState, useEffect } from "react";
import {
  HelpCircle,
  Settings,
  Users,
  Globe,
  Pencil,
  ChevronRight,
  Play,
  Crown,
  Share2,
  Star,
  Lightbulb,
  AlarmClock,
  X,
  Plus,
  Box,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useGame } from "@/lib/game-store";
import { toast } from "sonner";

type Sheet = null | "players" | "categories" | "imposters";

const AVATARS = [
  "🐱",
  "🐶",
  "🦊",
  "🦁",
  "🐯",
  "🐼",
  "🐨",
  "🐸",
  "🐰",
  "🐵",
  "🐣",
  "🦄",
  "🐙",
  "🦖",
  "🦈",
  "🦘",
  "🦥",
];

export function Lobby() {
  const g = useGame();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(g.localPlayer.name);

  // Auto-connect if gameMode is online and roomId is present
  useEffect(() => {
    if (g.gameMode === "online" && g.roomId) {
      g.initializeOnline(g.roomId);
    }
  }, []);

  const isOnline = g.gameMode === "online";

  // Who is the host?
  const me = isOnline ? g.onlinePlayers.find((p) => p.id === g.localPlayer.id) : null;
  const isHost = isOnline ? (me ? me.isHost : false) : true;

  // Connected active players count (exclude spectators)
  const activePlayersCount = isOnline
    ? g.onlinePlayers.filter((p) => p.connected && !p.spectator).length
    : g.players.length;

  const canStart = isOnline
    ? isHost && activePlayersCount >= 3 && g.categories.length >= 1
    : g.players.length >= 3 && g.categories.length >= 1;

  const onStart = () => {
    if (isOnline) {
      if (activePlayersCount < 3) return toast.error("Need at least 3 players to start");
      if (g.categories.length < 1) return toast.error("Select at least 1 category");
      g.startGame();
    } else {
      if (g.players.length < 3) return toast.error("Add at least 3 players");
      if (g.categories.length < 1) return toast.error("Select at least 1 category");
      g.startGame();
    }
  };

  const toggleMode = (mode: "classic" | "online") => {
    if (mode === "classic") {
      g.setGameMode("classic");
    } else {
      // Connect to online mode
      const newRoom = crypto.randomUUID();
      g.initializeOnline(newRoom);
      toast.success("Online Lobby created!");
    }
  };

  const cycleAvatar = () => {
    const idx = AVATARS.indexOf(g.localPlayer.avatar);
    const nextIdx = (idx + 1) % AVATARS.length;
    g.updateLocalIdentity(g.localPlayer.name, AVATARS[nextIdx]);
  };

  const saveName = () => {
    const clean = editName.trim();
    if (!clean) return setIsEditingName(false);
    g.updateLocalIdentity(clean, g.localPlayer.avatar);
    setIsEditingName(false);
  };

  const copyInviteLink = () => {
    if (!g.roomId) return;
    const url = `${window.location.origin}/?room=${g.roomId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Invite link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  return (
    <div className="min-h-dvh bg-background pb-8">
      <div className="mx-auto max-w-md px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button className="text-muted-foreground/70 hover:text-foreground" aria-label="Help">
            <HelpCircle className="h-8 w-8" strokeWidth={2} />
          </button>
          <h1 className="font-display text-5xl leading-[0.9] font-extrabold text-center text-foreground/85 tracking-tight">
            IMPOSTER
            <br />
            <span className="text-6xl">WHO?</span>
          </h1>
          <div className="flex items-center gap-2">
            <Link
              to="/word-box"
              className="text-muted-foreground/70 hover:text-foreground flex items-center justify-center p-1 relative"
              aria-label="Word Box"
              title="Word Box"
            >
              <Box className="h-7 w-7" strokeWidth={2.5} />
            </Link>
            <button
              className="text-muted-foreground/70 hover:text-foreground flex items-center justify-center p-1"
              aria-label="Settings"
            >
              <Settings className="h-8 w-8" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {/* Player Profile Setup */}
          <div className="rounded-2xl bg-card p-4 card-shadow flex items-center justify-between border-2 border-dashed border-primary/20">
            <div className="flex items-center gap-3">
              <button
                onClick={cycleAvatar}
                className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center text-3xl hover:scale-105 active:scale-95 transition"
                title="Tap to change avatar"
              >
                {g.localPlayer.avatar}
              </button>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider">
                  YOUR IDENTITY (TAP NAME TO EDIT)
                </p>
                {isEditingName ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="font-display text-lg font-bold bg-transparent border-b-2 border-primary outline-none py-0.5 max-w-[180px] text-foreground"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditName(g.localPlayer.name);
                      setIsEditingName(true);
                    }}
                    className="font-display text-lg font-bold flex items-center gap-1.5 text-foreground hover:text-primary transition text-left"
                  >
                    {g.localPlayer.name} <Pencil className="h-4 w-4 text-muted-foreground/60" />
                  </button>
                )}
              </div>
            </div>
            <div className="text-[10px] bg-secondary font-extrabold px-2.5 py-1 rounded-full text-foreground/70 uppercase">
              You
            </div>
          </div>

          {/* Game Mode */}
          <Section icon="🎮" title="GAME MODE">
            <div className="grid grid-cols-2 gap-2">
              <ModeBtn
                active={g.gameMode === "classic"}
                onClick={() => toggleMode("classic")}
                icon={<Users className="h-5 w-5" />}
                label="Classic"
              />
              <ModeBtn
                active={g.gameMode === "online"}
                onClick={() => toggleMode("online")}
                icon={<Globe className="h-5 w-5" />}
                label="Online"
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">
              <strong>Classic:</strong> Pass the device between players in the same room.
            </p>
            <p className="text-sm leading-relaxed text-foreground/80">
              <strong>Online:</strong> Play with friends in real-time. Share the invite link to
              join!
            </p>
          </Section>

          {/* Invite Link Row */}
          {isOnline && g.roomId && (
            <div className="rounded-2xl bg-card p-4 card-shadow border-2 border-yellow/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="mb-0.5 flex items-center gap-1.5 text-sm font-bold tracking-wider text-foreground/70">
                    <Globe className="h-4.5 w-4.5 text-pink animate-pulse" /> INVITE LINK
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Players join instantly upon clicking this link!
                  </p>
                </div>
                <button
                  onClick={copyInviteLink}
                  className="rounded-xl bg-yellow px-4.5 py-2.5 font-display text-sm font-extrabold text-foreground/90 flex items-center gap-1.5 btn-3d shrink-0"
                >
                  <Share2 className="h-4 w-4" /> COPY LINK
                </button>
              </div>
            </div>
          )}

          {/* Players */}
          <SheetRow icon="✋" title="PLAYERS" onClick={() => setSheet("players")}>
            <div className="mt-1 flex flex-wrap gap-2">
              {isOnline
                ? g.onlinePlayers.map((p) => {
                    const isMe = p.id === g.localPlayer.id;
                    return (
                      <Chip key={p.id}>
                        <span className="text-base">{p.avatar}</span>
                        <span
                          className={`font-bold ${p.connected ? "text-foreground/90" : "text-muted-foreground/50 line-through"} flex items-center gap-1`}
                        >
                          {p.name}
                          {isMe && (
                            <span className="text-[10px] text-pink font-extrabold">(YOU)</span>
                          )}
                          {p.isHost && (
                            <Crown className="h-3 w-3 text-yellow fill-yellow shrink-0" />
                          )}
                          {p.spectator && (
                            <span className="text-[10px] font-extrabold text-muted-foreground/60">
                              (SPEC)
                            </span>
                          )}
                          {!p.connected && (
                            <span className="text-[10px] font-extrabold text-destructive/80">
                              (OFF)
                            </span>
                          )}
                        </span>
                      </Chip>
                    );
                  })
                : g.players.map((p, i) => (
                    <Chip key={i}>
                      <span className="font-bold text-foreground/90">{p}</span>
                    </Chip>
                  ))}
            </div>
          </SheetRow>

          {/* Categories */}
          <SheetRow
            icon="🐔"
            title="CATEGORIES"
            onClick={() => {
              if (isOnline && !isHost) {
                toast.info("Only the Host can edit categories");
                return;
              }
              setSheet("categories");
            }}
          >
            <div className="mt-1 flex flex-wrap gap-2">
              {g.categories.map((cid) => {
                const c = g.customCategories.find((x) => x.id === cid);
                if (!c) return null;
                return (
                  <Chip key={cid}>
                    <span>{c.emoji}</span>
                    <span className="font-bold text-foreground/90">{c.name}</span>
                  </Chip>
                );
              })}
            </div>
          </SheetRow>

          {/* Imposters */}
          <SheetRow
            icon="🥷"
            title="IMPOSTERS"
            onClick={() => {
              if (isOnline && !isHost) {
                toast.info("Only the Host can edit imposter count");
                return;
              }
              setSheet("imposters");
            }}
          >
            <p className="text-sm font-semibold text-foreground/80 mt-0.5">
              {g.imposterCount} Imposter{g.imposterCount > 1 ? "s" : ""}
            </p>
          </SheetRow>

          {/* Time Limit */}
          <ToggleRow
            icon={<AlarmClock className="h-5 w-5 text-destructive" />}
            title="TIME LIMIT"
            subtitle={g.timeLimitEnabled ? "Enabled" : "Disabled"}
            checked={g.timeLimitEnabled}
            onChange={(b) => {
              if (isOnline && !isHost) {
                toast.info("Only the Host can change this option");
                return;
              }
              g.setTimeLimitEnabled(b);
            }}
          />

          {/* Imposter Hint */}
          <ToggleRow
            icon={<Lightbulb className="h-5 w-5 text-yellow" />}
            title="IMPOSTER HINT"
            subtitle="Give imposters a hint about the word to help them blend in better."
            checked={g.imposterHintEnabled}
            onChange={(b) => {
              if (isOnline && !isHost) {
                toast.info("Only the Host can change this option");
                return;
              }
              g.setImposterHintEnabled(b);
            }}
          />
        </div>
      </div>

      {/* Sticky Start / Waiting Bar */}
      <div className="sticky bottom-0 left-0 right-0 mt-6">
        <div className="mx-auto max-w-md px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
          {isOnline && !isHost ? (
            <div className="rounded-2xl bg-secondary/80 py-4.5 font-display text-md font-bold text-center text-muted-foreground card-shadow animate-pulse">
              🎮 WAITING FOR HOST TO START GAME
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-pink text-white shadow-lg shrink-0">
                <Crown className="h-7 w-7" />
              </div>
              <button
                onClick={onStart}
                disabled={!canStart}
                className="flex-1 rounded-2xl bg-lime py-4 font-display text-xl font-extrabold text-foreground/90 flex items-center justify-center gap-2 btn-3d disabled:opacity-60"
              >
                <Play className="h-6 w-6 fill-current" /> START GAME
              </button>
            </div>
          )}
        </div>
      </div>

      {sheet === "players" && (
        <PlayersSheet onClose={() => setSheet(null)} isOnline={isOnline} isHost={isHost} />
      )}
      {sheet === "categories" && <CategoriesSheet onClose={() => setSheet(null)} />}
      {sheet === "imposters" && <ImpostersSheet onClose={() => setSheet(null)} />}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 card-shadow">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wider text-foreground/70">
        <span className="text-base">{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function SheetRow({
  icon,
  title,
  children,
  onClick,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-card p-4 card-shadow active:scale-[0.99] transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold tracking-wider text-foreground/70">
            <span className="text-base">{icon}</span> {title}
          </div>
          {children}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground mt-1" />
      </div>
    </button>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 card-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold tracking-wider text-foreground/70">
            {icon} {title}
          </div>
          <p className="text-sm text-foreground/70">{subtitle}</p>
        </div>
        <button
          onClick={() => onChange(!checked)}
          className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-pink" : "bg-muted-foreground/30"}`}
          role="switch"
          aria-checked={checked}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`}
          />
        </button>
      </div>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-full py-3 font-bold transition flex-1 ${
        active ? "bg-foreground text-background" : "bg-secondary text-foreground/80"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1.5 text-sm">
      {children}
    </span>
  );
}

function BottomSheet({
  children,
  onClose,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-md rounded-t-3xl bg-card p-5 pb-6 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <h2 className="text-center font-display text-xl font-extrabold">{title}</h2>
        {subtitle && <p className="mt-1 text-center text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function PlayersSheet({
  onClose,
  isOnline,
  isHost,
}: {
  onClose: () => void;
  isOnline: boolean;
  isHost: boolean;
}) {
  const g = useGame();
  const [name, setName] = useState("");

  const add = () => {
    if (!name.trim()) return;
    if (g.players.length >= 20) return toast.error("Max 20 players");
    g.addPlayer(name);
    setName("");
  };

  if (isOnline) {
    return (
      <BottomSheet
        title="CONNECTED PLAYERS"
        subtitle={`${g.onlinePlayers.length} in lobby • Players join via link`}
        onClose={onClose}
      >
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {g.onlinePlayers.map((p) => {
            const isMe = p.id === g.localPlayer.id;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-full bg-background px-5 py-3.5 card-shadow border border-border"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.avatar}</span>
                  <span
                    className={`font-bold ${p.connected ? "text-foreground" : "text-muted-foreground/50 line-through"} flex items-center gap-1.5`}
                  >
                    {p.name}
                    {isMe && <span className="text-xs text-pink font-extrabold">(YOU)</span>}
                    {p.isHost && <Crown className="h-3.5 w-3.5 text-yellow fill-yellow shrink-0" />}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.spectator && (
                    <span className="text-[10px] bg-secondary text-muted-foreground font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Spectator
                    </span>
                  )}
                  {p.connected ? (
                    <span className="h-2 w-2 rounded-full bg-lime" />
                  ) : (
                    <span className="text-[10px] text-destructive font-bold uppercase">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-foreground py-4 font-display font-extrabold text-background"
        >
          CLOSE
        </button>
      </BottomSheet>
    );
  }

  // Classic Player Sheet (original)
  return (
    <BottomSheet
      title="EDIT PLAYERS"
      subtitle="3-20 players • Tap a name to edit"
      onClose={onClose}
    >
      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
        {g.players.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-full bg-background px-4 py-3 card-shadow">
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <input
                value={p}
                onChange={(e) => g.updatePlayer(i, e.target.value)}
                className="flex-1 bg-transparent font-bold outline-none"
              />
            </div>
            <button onClick={() => g.removePlayer(i)} className="text-pink p-2" aria-label="Remove">
              <X className="h-6 w-6" strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-yellow bg-background p-1 pl-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add player name"
          className="flex-1 bg-transparent py-3 outline-none"
        />
        <button onClick={add} className="grid h-10 w-12 place-items-center rounded-xl bg-yellow">
          <Plus className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>

      <button
        onClick={onClose}
        className="mt-4 w-full rounded-2xl bg-foreground py-4 font-display font-extrabold text-background"
      >
        CONFIRM
      </button>
    </BottomSheet>
  );
}

function CategoriesSheet({ onClose }: { onClose: () => void }) {
  const g = useGame();
  return (
    <BottomSheet
      title="SELECT CATEGORIES"
      subtitle="Choose one or more categories for the game."
      onClose={onClose}
    >
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {g.customCategories.map((c) => {
          const selected = g.categories.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => g.toggleCategory(c.id)}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 card-shadow transition ${
                selected ? "bg-yellow" : "bg-card"
              }`}
            >
              <span className="text-xl">{c.emoji}</span>
              <span className="flex-1 text-left font-bold">{c.name}</span>
              {selected && <span className="font-bold">✓</span>}
            </button>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-2xl bg-foreground py-4 font-display font-extrabold text-background"
      >
        CONFIRM
      </button>
    </BottomSheet>
  );
}

function ImpostersSheet({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const playerCount =
    g.gameMode === "online"
      ? g.onlinePlayers.filter((p) => p.connected && !p.spectator).length
      : g.players.length;

  const max = Math.max(1, Math.floor((playerCount - 1) / 3) + 1);
  const options = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <BottomSheet
      title="SELECT IMPOSTER COUNT"
      subtitle={`With ${playerCount} players, you can have up to ${max} imposter${max > 1 ? "s" : ""}.`}
      onClose={onClose}
    >
      <div className="space-y-2">
        {options.map((n) => {
          const sel = g.imposterCount === n;
          return (
            <button
              key={n}
              onClick={() => g.setImposterCount(n)}
              className={`w-full flex items-center rounded-2xl px-5 py-4 card-shadow ${sel ? "bg-yellow" : "bg-card"}`}
            >
              <span className="flex-1 text-left font-bold">
                {n} Imposter{n > 1 ? "s" : ""}
              </span>
              {sel && <span className="font-bold">✓</span>}
            </button>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-2xl bg-foreground py-4 font-display font-extrabold text-background"
      >
        CONFIRM
      </button>
    </BottomSheet>
  );
}
