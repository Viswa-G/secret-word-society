import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CATEGORIES, type WordEntry, type Category } from "@/data/categories";
import { selectAndMarkWord, selectImposters } from "@/lib/temp-storage";
import { type SpecialRole, assignSpecialRoles, SPECIAL_ROLES_INFO } from "@/lib/special-roles";

export type Phase = "lobby" | "reveal" | "initiator" | "clue" | "discuss" | "vote" | "result";

export type Assignment = {
  playerName: string;
  isImposter: boolean;
  clue?: string;
  playerId?: string; // added to identify assignments in online mode
  specialRole?: SpecialRole | null;
  guardianAngelClue?: string;
  bountyTargetName?: string;
  bountyTargetId?: string;
};

export type Player = {
  id: string;
  name: string;
  avatar: string;
  connected: boolean;
  isHost: boolean;
  ready: boolean;
  spectator: boolean;
  eliminated: boolean;
  votedFor?: string;
  extraVotedFor?: string;
  joinedAt: number;
};

export type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  text: string;
  timestamp: number;
};

export type VotingRoundHistory = {
  voteIndex: number;
  votes: { voterId: string; targetId: string; isExtraVote?: boolean }[];
  eliminatedPlayerId: string | null;
  wasImposter: boolean;
};

type GameState = {
  // Lobby / Config
  gameMode: "classic" | "online";
  players: string[]; // for classic mode names
  categories: string[]; // selected category ids
  customCategories: Category[]; // custom category & words database
  imposterCount: number;
  timeLimitEnabled: boolean;
  imposterHintEnabled: boolean;
  guardianAngelEnabled: boolean;
  initiatorEnabled: boolean;
  extraVoterEnabled: boolean;
  bountyHunterEnabled: boolean;

  // Round / Status
  phase: Phase;
  word: string | null;
  category: string | null;
  assignments: Assignment[];
  currentPlayerIndex: number;
  cardViewed: boolean; // has current player held-to-reveal at least once

  // Online Multiplayer State
  roomId: string | null;
  localPlayer: { id: string; name: string; avatar: string };
  onlinePlayers: Player[];
  onlineChat: ChatMessage[];
  onlineWinner: "crew" | "imposter" | null;
  currentVoteIndex: number;
  votingHistory: VotingRoundHistory[];
  turnOrder: string[];
  currentTurnIndex: number;
  currentRound: number;
  clues: {
    [playerId: string]: {
      [round: number]: string;
    };
  };
  onlineCustomCategories: Category[];

  // Actions
  setGameMode: (m: "classic" | "online") => void;
  setPlayers: (p: string[]) => void;
  addPlayer: (name: string) => void;
  removePlayer: (i: number) => void;
  updatePlayer: (i: number, name: string) => void;
  setCategories: (c: string[]) => void;
  toggleCategory: (id: string) => void;
  setCustomCategories: (cats: Category[]) => void;
  resetCustomCategories: () => void;
  setImposterCount: (n: number) => void;
  setTimeLimitEnabled: (b: boolean) => void;
  setImposterHintEnabled: (b: boolean) => void;
  setGuardianAngelEnabled: (b: boolean) => void;
  setInitiatorEnabled: (b: boolean) => void;
  setExtraVoterEnabled: (b: boolean) => void;
  setBountyHunterEnabled: (b: boolean) => void;

  startGame: () => void;
  markViewed: () => void;
  nextPlayer: () => void;
  goToDiscuss: () => void;
  revealResult: () => void;
  newGame: () => void;
  exitToLobby: () => void;

  // Online Actions
  initializeOnline: (roomId: string) => void;
  disconnectOnline: () => void;
  updateLocalIdentity: (name: string, avatar: string) => void;
  sendChatMessage: (text: string) => void;
  submitClueAction: (round: number, text: string) => void;
  skipTurnAction: () => void;
  submitVoteAction: (targetId: string, extraTargetId?: string) => void;
  markReadyAction: () => void;
  markReadyToVoteAction: () => void;
  proceedFromInitiatorAction: () => void;
  revealRolesFromInitiatorAction: () => void;
};

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

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const shuffleIndexes = (n: number): number[] => {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateLocalPlayer = () => {
  if (typeof window === "undefined") return { id: "", name: "Guest", avatar: "🐱" };
  const stored = localStorage.getItem("imposter-who-player");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // Ignore and generate new
    }
  }
  const id = crypto.randomUUID();
  const name = "Guest " + Math.floor(1000 + Math.random() * 9000);
  const avatar = pickRandom(AVATARS);
  const player = { id, name, avatar };
  localStorage.setItem("imposter-who-player", JSON.stringify(player));
  return player;
};

// SSE stream manager
let eventSource: EventSource | null = null;

const sendAction = async (roomId: string, playerId: string, action: string, data?: unknown) => {
  try {
    const res = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, playerId, action, data }),
    });
    if (!res.ok) {
      console.error(`Action ${action} failed`, await res.text());
    }
  } catch (err) {
    console.error(`Action ${action} network error`, err);
  }
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      gameMode: "classic",
      players: ["Yuvan", "Viswa", "Vinay", "Subash", "Abinesh", "Dhilip"],
      categories: ["everyday", "foods"],
      customCategories: CATEGORIES,
      imposterCount: 1,
      timeLimitEnabled: false,
      imposterHintEnabled: true,
      guardianAngelEnabled: true,
      initiatorEnabled: true,
      extraVoterEnabled: true,
      bountyHunterEnabled: true,

      phase: "lobby",
      word: null,
      category: null,
      assignments: [],
      currentPlayerIndex: 0,
      cardViewed: false,

      // Online variables
      roomId: null,
      localPlayer: generateLocalPlayer(),
      onlinePlayers: [],
      onlineChat: [],
      onlineWinner: null,
      currentVoteIndex: 0,
      votingHistory: [],
      turnOrder: [],
      currentTurnIndex: 0,
      currentRound: 1,
      clues: {},
      onlineCustomCategories: [],

      setGameMode: (m) => {
        set({ gameMode: m });
        if (m === "classic") {
          get().disconnectOnline();
          // Reset URL
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("room");
            window.history.replaceState({}, "", url.toString());
          }
        }
      },
      setPlayers: (p) => set({ players: p }),
      addPlayer: (name) => {
        const n = name.trim();
        if (!n) return;
        set({ players: [...get().players, n] });
      },
      removePlayer: (i) => set({ players: get().players.filter((_, idx) => idx !== i) }),
      updatePlayer: (i, name) => {
        const players = [...get().players];
        players[i] = name;
        set({ players });
      },
      setCategories: (c) => set({ categories: c }),
      toggleCategory: (id) => {
        const cur = get().categories;
        let nextCategories = [...cur];
        if (cur.includes(id)) {
          if (cur.length === 1) return; // keep at least one
          nextCategories = cur.filter((c) => c !== id);
        } else {
          nextCategories = [...cur, id];
        }

        set({ categories: nextCategories });

        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: nextCategories,
            customCategories: get().customCategories,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: get().imposterHintEnabled,
          });
        }
      },
      setCustomCategories: (cats) => {
        set({ customCategories: cats });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: get().categories,
            customCategories: cats,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: get().imposterHintEnabled,
          });
        }
      },
      resetCustomCategories: () => {
        set({ customCategories: CATEGORIES });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: get().categories,
            customCategories: CATEGORIES,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: get().imposterHintEnabled,
            guardianAngelEnabled: get().guardianAngelEnabled,
            initiatorEnabled: get().initiatorEnabled,
            extraVoterEnabled: get().extraVoterEnabled,
            bountyHunterEnabled: get().bountyHunterEnabled,
          });
        }
      },
      setImposterCount: (n) => {
        set({ imposterCount: n });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: n,
            categories: get().categories,
            customCategories: get().customCategories,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: get().imposterHintEnabled,
            guardianAngelEnabled: get().guardianAngelEnabled,
            initiatorEnabled: get().initiatorEnabled,
            extraVoterEnabled: get().extraVoterEnabled,
            bountyHunterEnabled: get().bountyHunterEnabled,
          });
        }
      },
      setTimeLimitEnabled: (b) => {
        set({ timeLimitEnabled: b });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: get().categories,
            customCategories: get().customCategories,
            timeLimitEnabled: b,
            imposterHintEnabled: get().imposterHintEnabled,
            guardianAngelEnabled: get().guardianAngelEnabled,
            initiatorEnabled: get().initiatorEnabled,
            extraVoterEnabled: get().extraVoterEnabled,
            bountyHunterEnabled: get().bountyHunterEnabled,
          });
        }
      },
      setImposterHintEnabled: (b) => {
        set({ imposterHintEnabled: b });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: get().categories,
            customCategories: get().customCategories,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: b,
            guardianAngelEnabled: get().guardianAngelEnabled,
            initiatorEnabled: get().initiatorEnabled,
            extraVoterEnabled: get().extraVoterEnabled,
            bountyHunterEnabled: get().bountyHunterEnabled,
          });
        }
      },
      setGuardianAngelEnabled: (b) => {
        set({ guardianAngelEnabled: b });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: get().categories,
            customCategories: get().customCategories,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: get().imposterHintEnabled,
            guardianAngelEnabled: b,
            initiatorEnabled: get().initiatorEnabled,
            extraVoterEnabled: get().extraVoterEnabled,
            bountyHunterEnabled: get().bountyHunterEnabled,
          });
        }
      },
      setInitiatorEnabled: (b) => {
        set({ initiatorEnabled: b });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: get().categories,
            customCategories: get().customCategories,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: get().imposterHintEnabled,
            guardianAngelEnabled: get().guardianAngelEnabled,
            initiatorEnabled: b,
            extraVoterEnabled: get().extraVoterEnabled,
            bountyHunterEnabled: get().bountyHunterEnabled,
          });
        }
      },
      setExtraVoterEnabled: (b) => {
        set({ extraVoterEnabled: b });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: get().categories,
            customCategories: get().customCategories,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: get().imposterHintEnabled,
            guardianAngelEnabled: get().guardianAngelEnabled,
            initiatorEnabled: get().initiatorEnabled,
            extraVoterEnabled: b,
            bountyHunterEnabled: get().bountyHunterEnabled,
          });
        }
      },
      setBountyHunterEnabled: (b) => {
        set({ bountyHunterEnabled: b });
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "updateSettings", {
            imposterCount: get().imposterCount,
            categories: get().categories,
            customCategories: get().customCategories,
            timeLimitEnabled: get().timeLimitEnabled,
            imposterHintEnabled: get().imposterHintEnabled,
            guardianAngelEnabled: get().guardianAngelEnabled,
            initiatorEnabled: get().initiatorEnabled,
            extraVoterEnabled: get().extraVoterEnabled,
            bountyHunterEnabled: b,
          });
        }
      },

      startGame: () => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "startGame");
          return;
        }

        const { players, categories, imposterCount, imposterHintEnabled } = get();
        if (players.length < 3) return;

        const pool: { entry: WordEntry; cat: string }[] = [];
        for (const cid of categories) {
          const cat = get().customCategories.find((c) => c.id === cid);
          if (!cat) continue;
          for (const e of cat.words) pool.push({ entry: e, cat: cat.name });
        }
        if (pool.length === 0) return;
        const chosen = selectAndMarkWord(pool);
        const word = chosen.entry.word;
        const clues = chosen.entry.clues;

        const chosenImposterNames = new Set(selectImposters(players, imposterCount));

        const playOrder = shuffleIndexes(players.length);

        const assignments: Assignment[] = playOrder.map((pi, seatIdx) => {
          const playerName = players[pi];
          const isImposter = chosenImposterNames.has(playerName);
          let clue: string | undefined;
          if (isImposter && imposterHintEnabled) {
            const imposterSeats = playOrder
              .map((p, idx) => ({ name: players[p], idx }))
              .filter(({ name }) => chosenImposterNames.has(name));
            const myIdx = imposterSeats.findIndex((s) => s.idx === seatIdx);
            clue = clues[myIdx % clues.length];
          }
          return {
            playerName,
            isImposter,
            clue,
          };
        });

        // Assign special roles based on settings
        const specialRoleAssignments = assignSpecialRoles(
          assignments.map((a) => ({
            isImposter: a.isImposter,
            clue: a.clue,
            playerName: a.playerName,
            playerId: a.playerId,
          })),
          {
            guardianAngelEnabled: get().guardianAngelEnabled,
            initiatorEnabled: get().initiatorEnabled,
            extraVoterEnabled: get().extraVoterEnabled,
            bountyHunterEnabled: get().bountyHunterEnabled,
            availableClues: clues,
          },
        );

        assignments.forEach((a, i) => {
          a.specialRole = specialRoleAssignments[i].specialRole;
          a.guardianAngelClue = specialRoleAssignments[i].guardianAngelClue;
          a.bountyTargetName = specialRoleAssignments[i].bountyTargetName;
          a.bountyTargetId = specialRoleAssignments[i].bountyTargetId;
        });

        set({
          phase: "reveal",
          word,
          category: chosen.cat,
          assignments,
          currentPlayerIndex: 0,
          cardViewed: false,
        });
      },
      markViewed: () => set({ cardViewed: true }),
      nextPlayer: () => {
        const { currentPlayerIndex, assignments, initiatorEnabled, extraVoterEnabled } = get();
        if (!get().cardViewed) return;
        if (currentPlayerIndex + 1 >= assignments.length) {
          const hasSpecialReveal =
            (initiatorEnabled && assignments.some((a) => a.specialRole === "initiator")) ||
            (extraVoterEnabled && assignments.some((a) => a.specialRole === "extra_voter"));
          if (hasSpecialReveal) {
            set({ phase: "initiator" });
          } else {
            set({ phase: "discuss" });
          }
        } else {
          set({ currentPlayerIndex: currentPlayerIndex + 1, cardViewed: false });
        }
      },
      goToDiscuss: () => set({ phase: "discuss" }),
      revealResult: () => {
        if (get().gameMode === "online" && get().roomId) {
          // In online mode, we transition to Result through voting, but let's allow exit/reveal actions if needed
          return;
        }
        set({ phase: "result" });
      },
      newGame: () => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "newGame");
        } else {
          get().startGame();
        }
      },
      exitToLobby: () => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "exitToLobby");
        } else {
          set({
            phase: "lobby",
            word: null,
            category: null,
            assignments: [],
            currentPlayerIndex: 0,
            cardViewed: false,
          });
        }
      },

      // Online Multiplayer Sync implementation
      initializeOnline: (roomId) => {
        const { localPlayer } = get();
        get().disconnectOnline(); // Close previous connections

        set({ roomId, gameMode: "online" });

        // Update URL query parameters
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("room", roomId);
          window.history.replaceState({}, "", url.toString());
        }

        const url = `/api/events?roomId=${roomId}&playerId=${localPlayer.id}&name=${encodeURIComponent(localPlayer.name)}&avatar=${encodeURIComponent(localPlayer.avatar)}`;
        eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const mappedAssignments: Assignment[] = data.assignments.map(
              (as: {
                playerId: string;
                isImposter: boolean;
                clue?: string;
                specialRole?: SpecialRole | null;
                guardianAngelClue?: string;
                bountyTargetName?: string;
                bountyTargetId?: string;
              }) => {
                const p = data.players.find(
                  (pl: { id: string; name: string }) => pl.id === as.playerId,
                );
                return {
                  playerId: as.playerId,
                  playerName: p ? p.name : "Unknown",
                  isImposter: as.isImposter,
                  clue: as.clue,
                  specialRole: as.specialRole,
                  guardianAngelClue: as.guardianAngelClue,
                  bountyTargetName: as.bountyTargetName,
                  bountyTargetId: as.bountyTargetId,
                };
              },
            );

            // Map player list
            const plNames = data.players.map((p: { name: string }) => p.name);

            // Find current local player index in assignments list to set card index
            const myIndex = data.turnOrder.indexOf(localPlayer.id);

            // Check if local player is ready
            const meObj = data.players.find(
              (p: { id: string; ready: boolean; isHost: boolean }) => p.id === localPlayer.id,
            );
            const myReadyState = meObj ? meObj.ready : false;
            const isLocalHost = meObj ? meObj.isHost : data.hostId === localPlayer.id;

            const localSettings = {
              imposterCount: get().imposterCount,
              categories: get().categories,
              customCategories: get().customCategories,
              timeLimitEnabled: get().timeLimitEnabled,
              imposterHintEnabled: get().imposterHintEnabled,
              guardianAngelEnabled: get().guardianAngelEnabled,
              initiatorEnabled: get().initiatorEnabled,
              extraVoterEnabled: get().extraVoterEnabled,
              bountyHunterEnabled: get().bountyHunterEnabled,
            };

            const serverSettings = data.settings;

            // Check if settings are equal
            const isSettingsEqual =
              serverSettings.imposterCount === localSettings.imposterCount &&
              serverSettings.timeLimitEnabled === localSettings.timeLimitEnabled &&
              serverSettings.imposterHintEnabled === localSettings.imposterHintEnabled &&
              (serverSettings.guardianAngelEnabled ?? true) ===
                localSettings.guardianAngelEnabled &&
              (serverSettings.initiatorEnabled ?? true) === localSettings.initiatorEnabled &&
              (serverSettings.extraVoterEnabled ?? true) === localSettings.extraVoterEnabled &&
              (serverSettings.bountyHunterEnabled ?? true) === localSettings.bountyHunterEnabled &&
              JSON.stringify(serverSettings.categories) ===
                JSON.stringify(localSettings.categories) &&
              JSON.stringify(serverSettings.customCategories || []) ===
                JSON.stringify(localSettings.customCategories || []);

            if (isLocalHost && !isSettingsEqual && data.phase === "lobby") {
              // Upload host's local settings to the server
              sendAction(roomId, localPlayer.id, "updateSettings", localSettings);
            }

            const settingsToUpdate = isLocalHost
              ? {}
              : {
                  imposterCount: data.settings.imposterCount,
                  categories: data.settings.categories,
                  timeLimitEnabled: data.settings.timeLimitEnabled,
                  imposterHintEnabled: data.settings.imposterHintEnabled,
                  guardianAngelEnabled: data.settings.guardianAngelEnabled ?? true,
                  initiatorEnabled: data.settings.initiatorEnabled ?? true,
                  extraVoterEnabled: data.settings.extraVoterEnabled ?? true,
                  bountyHunterEnabled: data.settings.bountyHunterEnabled ?? true,
                };

            set({
              phase: data.phase,
              word: data.word,
              category: data.category,
              assignments: mappedAssignments,
              currentPlayerIndex: myIndex !== -1 ? myIndex : 0,
              cardViewed: myReadyState, // hijack cardViewed to track if local player is ready in reveal phase

              // Detailed online state
              onlinePlayers: data.players,
              onlineChat: data.chat,
              onlineWinner: data.winner,
              currentVoteIndex: data.currentVoteIndex,
              votingHistory: data.votingHistory,
              turnOrder: data.turnOrder,
              currentTurnIndex: data.currentTurnIndex,
              currentRound: data.currentRound,
              clues: data.clues,
              onlineCustomCategories: data.settings.customCategories || [],

              ...settingsToUpdate,
            });
          } catch (e) {
            console.error("Failed to parse SSE payload", e);
          }
        };

        eventSource.onerror = (err) => {
          console.error("SSE connection error, retrying...", err);
        };
      },

      disconnectOnline: () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        set({
          roomId: null,
          onlinePlayers: [],
          onlineChat: [],
          onlineWinner: null,
          votingHistory: [],
          turnOrder: [],
          clues: {},
          onlineCustomCategories: [],
        });
      },

      updateLocalIdentity: (name, avatar) => {
        const localPlayer = { id: get().localPlayer.id, name, avatar };
        set({ localPlayer });
        if (typeof window !== "undefined") {
          localStorage.setItem("imposter-who-player", JSON.stringify(localPlayer));
        }

        // Send updates if in an active room
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, localPlayer.id, "updateIdentity", { name, avatar });
        }
      },

      sendChatMessage: (text) => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "sendChat", { text });
        }
      },

      submitClueAction: (round, text) => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "submitClue", { round, text });
        }
      },

      skipTurnAction: () => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "skipTurn");
        }
      },

      submitVoteAction: (targetId, extraTargetId) => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "submitVote", {
            targetId,
            extraTargetId,
          });
        }
      },

      markReadyAction: () => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "markReady");
        }
      },

      markReadyToVoteAction: () => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "markReadyToVote");
        }
      },

      proceedFromInitiatorAction: () => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "proceedFromInitiator");
        }
      },

      revealRolesFromInitiatorAction: () => {
        if (get().gameMode === "online" && get().roomId) {
          sendAction(get().roomId!, get().localPlayer.id, "revealRolesFromInitiator");
        }
      },
    }),
    {
      name: "imposter-who-game",
      partialize: (state) => ({
        gameMode: state.gameMode,
        players: state.players,
        categories: state.categories,
        customCategories: state.customCategories,
        imposterCount: state.imposterCount,
        timeLimitEnabled: state.timeLimitEnabled,
        imposterHintEnabled: state.imposterHintEnabled,
        guardianAngelEnabled: state.guardianAngelEnabled,
        initiatorEnabled: state.initiatorEnabled,
        extraVoterEnabled: state.extraVoterEnabled,
        bountyHunterEnabled: state.bountyHunterEnabled,
        localPlayer: state.localPlayer,
      }),
    },
  ),
);
