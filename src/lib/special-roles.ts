export type SpecialRole = "guardian_angel" | "initiator" | "extra_voter" | "bounty_hunter" | "echo";

export type SpecialRoleInfo = {
  id: SpecialRole;
  name: string;
  icon: string;
  team: "crew" | "any";
  teamLabel: string;
  description: string;
  cardPowerText: string;
};

export const SPECIAL_ROLES_INFO: Record<SpecialRole, SpecialRoleInfo> = {
  guardian_angel: {
    id: "guardian_angel",
    name: "Guardian Angel",
    icon: "👼",
    team: "crew",
    teamLabel: "Crewmate",
    description:
      "A crewmate who sees an impostor's clue and defends them during discussion to convince others not to vote them out.",
    cardPowerText: "Defend the Impostor during discussion!",
  },
  initiator: {
    id: "initiator",
    name: "The Initiator",
    icon: "⚡",
    team: "any",
    teamLabel: "Crewmate or Impostor",
    description: "Can choose which player speaks first during the clue discussion.",
    cardPowerText: "You choose which player speaks first during the clue discussion!",
  },
  extra_voter: {
    id: "extra_voter",
    name: "The Extra Voter",
    icon: "🗳️",
    team: "any",
    teamLabel: "Crewmate or Impostor",
    description:
      "Can cast an extra vote during voting (for the same player or a different player).",
    cardPowerText:
      "Cast an extra vote during voting! You can vote for the same player or a different player.",
  },
  bounty_hunter: {
    id: "bounty_hunter",
    name: "The Bounty Hunter",
    icon: "🎯",
    team: "crew",
    teamLabel: "Crewmate",
    description:
      "A crewmate whose secret objective is to convince everyone to vote out their assigned bounty target.",
    cardPowerText: "Convince everyone to vote out your bounty target!",
  },
  echo: {
    id: "echo",
    name: "The Echo",
    icon: "🔁",
    team: "any",
    teamLabel: "Crewmate or Impostor",
    description:
      "Can give an extra clue back-to-back to prove their innocence, or force any player to immediately give a second clue.",
    cardPowerText:
      "Trigger an Echo! Give an extra clue yourself to prove innocence, or force another player to give an immediate second clue!",
  },
};

export type SpecialRoleAssignment = {
  specialRole: SpecialRole | null;
  guardianAngelClue?: string;
  bountyTargetName?: string;
  bountyTargetId?: string;
};

export type RoleAssignmentOptions = {
  guardianAngelEnabled?: boolean;
  initiatorEnabled: boolean;
  extraVoterEnabled: boolean;
  bountyHunterEnabled?: boolean;
  echoEnabled?: boolean;
  availableClues: string[];
};

/**
 * Assigns special roles following the game rules:
 * 1. Each special role is assigned to at most one player per match. No role repetition.
 * 2. A player can receive only one special role.
 * 3. The Guardian Angel and Bounty Hunter are ALWAYS crewmates.
 * 4. The Initiator and Extra Voter can be either crewmate or impostor.
 * 5. Disabled roles are never assigned.
 * 6. The Guardian Angel receives the clue of one impostor.
 * 7. The Bounty Hunter receives a secret target player to convince others to eliminate.
 */
export function assignSpecialRoles<
  T extends { isImposter: boolean; clue?: string; playerName?: string; playerId?: string },
>(players: T[], options: RoleAssignmentOptions): SpecialRoleAssignment[] {
  const result: SpecialRoleAssignment[] = players.map(() => ({
    specialRole: null,
  }));

  const crewmateIndices: number[] = [];
  const imposterIndices: number[] = [];
  const unassignedIndices = new Set<number>();

  players.forEach((p, idx) => {
    unassignedIndices.add(idx);
    if (p.isImposter) {
      imposterIndices.push(idx);
    } else {
      crewmateIndices.push(idx);
    }
  });

  // 1. Assign Guardian Angel (Crewmate ONLY)
  if (options.guardianAngelEnabled ?? true) {
    const eligibleCrewmates = crewmateIndices.filter((idx) => unassignedIndices.has(idx));
    if (eligibleCrewmates.length > 0) {
      const chosenIdx = eligibleCrewmates[Math.floor(Math.random() * eligibleCrewmates.length)];
      unassignedIndices.delete(chosenIdx);

      // Find one impostor's clue to reveal to the Guardian Angel
      let impClue: string | undefined;
      for (const impIdx of imposterIndices) {
        if (players[impIdx].clue) {
          impClue = players[impIdx].clue;
          break;
        }
      }

      // Fallback to available clues from category entry if impostor clue is not set
      if (!impClue && options.availableClues.length > 0) {
        impClue = options.availableClues[0];
      }

      const assignedClue = impClue || "No clue available";
      result[chosenIdx] = {
        specialRole: "guardian_angel",
        guardianAngelClue: assignedClue,
      };
    }
  }

  // 2. Assign The Bounty Hunter (Crewmate ONLY)
  if (options.bountyHunterEnabled ?? true) {
    const eligibleCrewmates = crewmateIndices.filter((idx) => unassignedIndices.has(idx));
    if (eligibleCrewmates.length > 0) {
      const chosenIdx = eligibleCrewmates[Math.floor(Math.random() * eligibleCrewmates.length)];
      unassignedIndices.delete(chosenIdx);

      // Pick any OTHER player in the game as the bounty target
      const candidateTargetIndices = players.map((_, i) => i).filter((i) => i !== chosenIdx);
      if (candidateTargetIndices.length > 0) {
        const targetIdx =
          candidateTargetIndices[Math.floor(Math.random() * candidateTargetIndices.length)];
        const target = players[targetIdx];
        result[chosenIdx] = {
          specialRole: "bounty_hunter",
          bountyTargetName: target.playerName || `Player ${targetIdx + 1}`,
          bountyTargetId: target.playerId,
        };
      }
    }
  }

  // 3. Assign Flexible Roles (Initiator, Extra Voter, Echo - Crewmate OR Impostor)
  // Impostor Special Role Capping:
  // - If 1 to 3 impostors: at most 1 impostor can receive a special role.
  // - If 4 or more impostors: at most 2 impostors can receive a special role.
  const maxImposterRoles = imposterIndices.length >= 4 ? 2 : 1;
  let imposterRolesCount = 0;

  const flexibleRoles: ("initiator" | "extra_voter" | "echo")[] = [];
  if (options.initiatorEnabled) flexibleRoles.push("initiator");
  if (options.extraVoterEnabled) flexibleRoles.push("extra_voter");
  if (options.echoEnabled) flexibleRoles.push("echo");

  // Shuffle order of flexible roles so all have an equal chance of landing on an impostor
  for (let i = flexibleRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flexibleRoles[i], flexibleRoles[j]] = [flexibleRoles[j], flexibleRoles[i]];
  }

  for (const role of flexibleRoles) {
    let eligible = Array.from(unassignedIndices);
    // If impostors have reached their special role quota, restrict remaining flexible roles to crewmates only
    if (imposterRolesCount >= maxImposterRoles) {
      eligible = eligible.filter((idx) => !players[idx].isImposter);
    }

    if (eligible.length > 0) {
      const chosenIdx = eligible[Math.floor(Math.random() * eligible.length)];
      unassignedIndices.delete(chosenIdx);
      if (players[chosenIdx].isImposter) {
        imposterRolesCount++;
      }
      result[chosenIdx] = {
        specialRole: role,
      };
    }
  }

  return result;
}
