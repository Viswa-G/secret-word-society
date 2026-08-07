import { randomUUID } from "crypto";
import { CATEGORIES, type WordEntry } from "../data/categories";
import { selectAndMarkWord, selectImposters } from "./temp-storage";

export type Phase = "lobby" | "reveal" | "clue" | "discuss" | "vote" | "result";

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

export type Assignment = {
  playerId: string;
  isImposter: boolean;
  clue?: string;
};

export type VoteRecord = {
  voterId: string;
  targetId: string;
};

export type VotingRoundHistory = {
  voteIndex: number;
  votes: VoteRecord[];
  eliminatedPlayerId: string | null;
  wasImposter: boolean;
};

export type Room = {
  id: string;
  hostId: string;
  settings: {
    imposterCount: number;
    categories: string[];
    timeLimitEnabled: boolean;
    imposterHintEnabled: boolean;
  };
  players: Player[];
  phase: Phase;
  word: string | null;
  category: string | null;
  assignments: Assignment[];
  turnOrder: string[]; // player IDs
  currentTurnIndex: number;
  currentRound: number; // 1, 2, or 3
  clues: {
    [playerId: string]: {
      [round: number]: string;
    };
  };
  chat: ChatMessage[];
  winner: "crew" | "imposter" | null;
  currentVoteIndex: number;
  votingHistory: VotingRoundHistory[];
};

// Global in-memory maps
export const rooms = new Map<string, Room>();
const clients = new Map<string, Map<string, any>>(); // roomId -> Map<playerId, sseController>
const disconnectTimers = new Map<string, NodeJS.Timeout>(); // playerId -> timer

// Helper to pick random item
const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to shuffle array
const shuffle = <T,>(arr: T[]): T[] => {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
};

// Add controller to clients map
export function addClient(roomId: string, playerId: string, controller: any) {
  if (!clients.has(roomId)) {
    clients.set(roomId, new Map());
  }
  clients.get(roomId)!.set(playerId, controller);
}

// Remove controller
export function removeClient(roomId: string, playerId: string) {
  const roomClients = clients.get(roomId);
  if (roomClients) {
    roomClients.delete(playerId);
    if (roomClients.size === 0) {
      clients.delete(roomId);
    }
  }
}

// Send event to all clients in a room
export function broadcastRoomState(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const roomClients = clients.get(roomId);
  if (!roomClients) return;

  const data = JSON.stringify(room);
  const message = `data: ${data}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);

  for (const [playerId, controller] of roomClients.entries()) {
    try {
      controller.enqueue(bytes);
    } catch (err) {
      console.error(`Failed to send state to player ${playerId} in room ${roomId}`, err);
    }
  }
}

// Handle player disconnection with 20s grace period
export function handlePlayerDisconnect(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;

  player.connected = false;
  removeClient(roomId, playerId);

  // Clear existing timer if any
  if (disconnectTimers.has(playerId)) {
    clearTimeout(disconnectTimers.get(playerId)!);
  }

  // Set 20 second timeout
  const timer = setTimeout(() => {
    disconnectTimers.delete(playerId);
    const r = rooms.get(roomId);
    if (!r) return;

    const pIndex = r.players.findIndex((pl) => pl.id === playerId);
    if (pIndex === -1) return;

    const p = r.players[pIndex];
    if (p.connected) return; // Reconnected in the meantime

    if (r.phase === "lobby") {
      // Safe to delete player from lobby
      r.players.splice(pIndex, 1);
    } else {
      // In-game: keep player object but mark as inactive.
      // If it is their turn in the clue phase, the host will be able to skip them.
    }

    // Host migration if host left
    if (p.isHost) {
      p.isHost = false;
      const nextHost = r.players.find((pl) => pl.connected && !pl.spectator);
      if (nextHost) {
        nextHost.isHost = true;
        r.hostId = nextHost.id;
      }
    }

    broadcastRoomState(roomId);
  }, 20000);

  disconnectTimers.set(playerId, timer);
  broadcastRoomState(roomId);
}

// Cancel disconnect timer on reconnect
export function clearDisconnectTimer(playerId: string) {
  if (disconnectTimers.has(playerId)) {
    clearTimeout(disconnectTimers.get(playerId)!);
    disconnectTimers.delete(playerId);
  }
}

// Join room
export function joinRoom(roomId: string, playerIdentity: { id: string; name: string; avatar: string }): Room {
  clearDisconnectTimer(playerIdentity.id);

  let room = rooms.get(roomId);
  if (!room) {
    // Create new room
    room = {
      id: roomId,
      hostId: playerIdentity.id,
      settings: {
        imposterCount: 1,
        categories: ["everyday", "foods"],
        timeLimitEnabled: false,
        imposterHintEnabled: true,
      },
      players: [],
      phase: "lobby",
      word: null,
      category: null,
      assignments: [],
      turnOrder: [],
      currentTurnIndex: 0,
      currentRound: 1,
      clues: {},
      chat: [],
      winner: null,
      currentVoteIndex: 0,
      votingHistory: [],
    };
    rooms.set(roomId, room);
  }

  let player = room.players.find((p) => p.id === playerIdentity.id);
  if (player) {
    player.name = playerIdentity.name;
    player.avatar = playerIdentity.avatar;
    player.connected = true;
  } else {
    // Spectator mode if game is already active
    const spectator = room.phase !== "lobby";
    player = {
      id: playerIdentity.id,
      name: playerIdentity.name,
      avatar: playerIdentity.avatar,
      connected: true,
      isHost: room.hostId === playerIdentity.id,
      ready: false,
      spectator,
      eliminated: false,
      joinedAt: Date.now(),
    };
    room.players.push(player);
  }

  // Ensure there is a host
  const hasHost = room.players.some((p) => p.isHost && p.connected);
  if (!hasHost && room.players.length > 0) {
    const activePls = room.players.filter((p) => p.connected && !p.spectator);
    const chosenHost = activePls.length > 0 ? activePls[0] : room.players[0];
    chosenHost.isHost = true;
    room.hostId = chosenHost.id;
  }

  return room;
}

// Start Game
export function startGame(roomId: string, hostId: string) {
  const room = rooms.get(roomId);
  if (!room || room.hostId !== hostId || room.phase !== "lobby") return;

  const activePlayers = room.players.filter((p) => p.connected && !p.spectator);
  if (activePlayers.length < 3) return;

  // Gather categories pool
  const pool: { entry: WordEntry; cat: string }[] = [];
  for (const cid of room.settings.categories) {
    const cat = CATEGORIES.find((c) => c.id === cid);
    if (!cat) continue;
    for (const e of cat.words) pool.push({ entry: e, cat: cat.name });
  }
  if (pool.length === 0) return;

  const chosen = selectAndMarkWord(pool);
  const word = chosen.entry.word;
  const clueHints = chosen.entry.clues;

  // Assign roles
  const activePlayerIds = activePlayers.map((p) => p.id);
  const imposterIds = new Set(selectImposters(activePlayerIds, room.settings.imposterCount));

  // Determine play order
  const turnOrder = shuffle(activePlayers.map((p) => p.id));

  const assignments: Assignment[] = turnOrder.map((pid, seatIdx) => {
    const isImposter = imposterIds.has(pid);
    let clue: string | undefined;
    if (isImposter && room.settings.imposterHintEnabled) {
      const imposterSeats = turnOrder.filter((id) => imposterIds.has(id));
      const myIdx = imposterSeats.indexOf(pid);
      clue = clueHints[myIdx % clueHints.length];
    }
    return {
      playerId: pid,
      isImposter,
      clue,
    };
  });

  // Set game state
  room.phase = "reveal";
  room.word = word;
  room.category = chosen.cat;
  room.assignments = assignments;
  room.turnOrder = turnOrder;
  room.currentTurnIndex = 0;
  room.currentRound = 1;
  room.clues = {};
  room.winner = null;
  room.currentVoteIndex = 0;
  room.votingHistory = [];

  // Reset players
  for (const p of room.players) {
    p.ready = false;
    p.eliminated = false;
    delete p.votedFor;
    // Lock non-spectators into the game, reset spectators
    if (p.spectator) {
      // Spectators stay spectators for this round
    }
  }

  // Initialize clues mapping
  for (const pid of turnOrder) {
    room.clues[pid] = {};
  }
}

// Ready Phase
export function markReady(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room || room.phase !== "reveal") return;

  const player = room.players.find((p) => p.id === playerId);
  if (!player || player.spectator) return;

  player.ready = true;

  // Check if all connected active players are ready
  const activePlayers = room.players.filter((p) => p.connected && !p.spectator);
  const allReady = activePlayers.every((p) => p.ready);

  if (allReady) {
    room.phase = "clue";
    room.currentTurnIndex = 0;
    room.currentRound = 1;
    for (const p of room.players) {
      p.ready = false;
    }
  }
}

// Submit Clue
export function submitClue(roomId: string, playerId: string, round: number, text: string) {
  const room = rooms.get(roomId);
  if (!room || room.phase !== "clue") return;

  // Verify round
  if (room.currentRound !== round) return;

  // Verify turn
  const activePlayerId = room.turnOrder[room.currentTurnIndex];
  if (activePlayerId !== playerId) return;

  const cleanText = text.trim();
  if (!cleanText) return;

  // Idempotency: check if already submitted clue for this round
  if (room.clues[playerId] && room.clues[playerId][round]) return;

  if (!room.clues[playerId]) {
    room.clues[playerId] = {};
  }
  room.clues[playerId][round] = cleanText;

  // Advance turn
  advanceTurn(room);
}

// Skip turn (Host action)
export function skipTurn(roomId: string, hostId: string) {
  const room = rooms.get(roomId);
  if (!room || room.hostId !== hostId || room.phase !== "clue") return;

  const activePlayerId = room.turnOrder[room.currentTurnIndex];
  const round = room.currentRound;

  if (!room.clues[activePlayerId]) {
    room.clues[activePlayerId] = {};
  }
  room.clues[activePlayerId][round] = "—"; // Skip placeholder

  advanceTurn(room);
}

function advanceTurn(room: Room) {
  room.currentTurnIndex++;

  if (room.currentTurnIndex >= room.turnOrder.length) {
    room.currentTurnIndex = 0;
    if (room.currentRound < 3) {
      room.currentRound++;
    } else {
      // Completed all 3 rounds of clues
      room.phase = "discuss";
      for (const p of room.players) {
        p.ready = false;
      }
    }
  }
}

// Ready to Vote
export function markReadyToVote(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room || room.phase !== "discuss") return;

  const player = room.players.find((p) => p.id === playerId);
  if (!player || player.spectator) return;

  player.ready = true;

  // Check if all connected active players are ready
  const activePlayers = room.players.filter((p) => p.connected && !p.spectator);
  const allReady = activePlayers.every((p) => p.ready);

  if (allReady) {
    room.phase = "vote";
    for (const p of room.players) {
      p.ready = false;
      delete p.votedFor;
    }
  }
}

// Submit Vote
export function submitVote(roomId: string, voterId: string, targetId: string) {
  const room = rooms.get(roomId);
  if (!room || room.phase !== "vote") return;

  const voter = room.players.find((p) => p.id === voterId);
  if (!voter || voter.spectator || voter.eliminated) return;

  // Idempotency: verify not voted yet
  if (voter.votedFor) return;

  voter.votedFor = targetId;

  // Check if all active non-eliminated players have voted
  const votingPlayers = room.players.filter((p) => p.connected && !p.spectator && !p.eliminated);
  const allVoted = votingPlayers.every((p) => p.votedFor);

  if (allVoted) {
    // Process results
    const voteCounts: { [targetId: string]: number } = {};
    for (const p of votingPlayers) {
      if (p.votedFor) {
        voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
      }
    }

    // Find highest voted player
    let maxVotes = 0;
    let eliminatedId: string | null = null;
    let tie = false;
    const candidates = room.players.filter((p) => !p.spectator && !p.eliminated);

    for (const p of candidates) {
      const votes = voteCounts[p.id] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedId = p.id;
        tie = false;
      } else if (votes === maxVotes && votes > 0) {
        tie = true;
      }
    }

    // Break tie: if tie, choose first lexicographically or random, let's pick the first candidate who got that vote count
    if (tie && maxVotes > 0) {
      // Find all candidates with max votes
      const tiedCandidates = candidates.filter((c) => (voteCounts[c.id] || 0) === maxVotes);
      eliminatedId = tiedCandidates[0].id;
    }

    let wasImposter = false;
    if (eliminatedId) {
      const target = room.players.find((p) => p.id === eliminatedId);
      if (target) {
        target.eliminated = true;
        const assignment = room.assignments.find((a) => a.playerId === eliminatedId);
        if (assignment?.isImposter) {
          wasImposter = true;
        }
      }
    }

    // Record voting history
    const votesList: VoteRecord[] = votingPlayers.map((p) => ({
      voterId: p.id,
      targetId: p.votedFor!,
    }));

    room.votingHistory.push({
      voteIndex: room.currentVoteIndex,
      votes: votesList,
      eliminatedPlayerId: eliminatedId,
      wasImposter,
    });

    // Check game outcome
    const activeAssignments = room.assignments.filter((a) => {
      const p = room.players.find((pl) => pl.id === a.playerId);
      return p && !p.eliminated;
    });

    const activeImpostersCount = activeAssignments.filter((a) => a.isImposter).length;
    const activeCrewCount = activeAssignments.filter((a) => !a.isImposter).length;

    if (activeImpostersCount === 0) {
      // Crewmates win
      room.phase = "result";
      room.winner = "crew";
    } else if (activeImpostersCount >= activeCrewCount) {
      // Imposters win
      room.phase = "result";
      room.winner = "imposter";
    } else {
      // Continue voting round
      room.currentVoteIndex++;
      for (const p of room.players) {
        delete p.votedFor;
      }
    }
  }
}

// Send chat
export function sendChat(roomId: string, playerId: string, text: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;

  const cleanText = text.trim();
  if (!cleanText) return;

  const msg: ChatMessage = {
    id: randomUUID(),
    playerId,
    playerName: player.name,
    playerAvatar: player.avatar,
    text: cleanText,
    timestamp: Date.now(),
  };

  room.chat.push(msg);
}

// Reset Game / New Game
export function newGame(roomId: string, hostId: string) {
  const room = rooms.get(roomId);
  if (!room || room.hostId !== hostId) return;

  // Convert spectators to normal players
  for (const p of room.players) {
    p.spectator = false;
  }

  startGame(roomId, hostId);
}

// Exit to Lobby
export function exitToLobby(roomId: string, hostId: string) {
  const room = rooms.get(roomId);
  if (!room || room.hostId !== hostId) return;

  room.phase = "lobby";
  room.word = null;
  room.category = null;
  room.assignments = [];
  room.turnOrder = [];
  room.clues = {};
  room.chat = [];
  room.winner = null;
  room.currentVoteIndex = 0;
  room.votingHistory = [];

  for (const p of room.players) {
    p.ready = false;
    p.eliminated = false;
    p.spectator = false; // Convert spectators back to players
    delete p.votedFor;
  }
}

// Update player details
export function updatePlayerIdentity(roomId: string, playerId: string, name: string, avatar: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;

  player.name = name.trim();
  player.avatar = avatar;
}

// Update settings (Host only)
export function updateSettings(
  roomId: string,
  hostId: string,
  settings: {
    imposterCount: number;
    categories: string[];
    timeLimitEnabled: boolean;
    imposterHintEnabled: boolean;
  }
) {
  const room = rooms.get(roomId);
  if (!room || room.hostId !== hostId || room.phase !== "lobby") return;

  room.settings = settings;
}
