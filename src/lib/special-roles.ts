export type SpecialRole = "guardian_angel" | "initiator" | "extra_voter" | "bounty_hunter";

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

  // 2. Assign The Initiator (Crewmate OR Impostor)
  if (options.initiatorEnabled) {
    const eligible = Array.from(unassignedIndices);
    if (eligible.length > 0) {
      const chosenIdx = eligible[Math.floor(Math.random() * eligible.length)];
      unassignedIndices.delete(chosenIdx);
      result[chosenIdx] = {
        specialRole: "initiator",
      };
    }
  }

  // 3. Assign The Extra Voter (Crewmate OR Impostor)
  if (options.extraVoterEnabled) {
    const eligible = Array.from(unassignedIndices);
    if (eligible.length > 0) {
      const chosenIdx = eligible[Math.floor(Math.random() * eligible.length)];
      unassignedIndices.delete(chosenIdx);
      result[chosenIdx] = {
        specialRole: "extra_voter",
      };
    }
  }

  // 4. Assign The Bounty Hunter (Crewmate ONLY)
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

  return result;
}
