export type SpecialRole = "evil_guardian" | "initiator" | "extra_voter";

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
  evil_guardian: {
    id: "evil_guardian",
    name: "The Evil Guardian",
    icon: "🛡️",
    team: "crew",
    teamLabel: "Crewmate",
    description:
      "A crewmate who sees an impostor's clue and defends them during discussion to convince others not to vote them out.",
    cardPowerText:
      "Defend the Impostor during the discussion to convince others not to vote them out!",
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
};

export type SpecialRoleAssignment = {
  specialRole: SpecialRole | null;
  evilGuardianClue?: string;
};

export type RoleAssignmentOptions = {
  evilGuardianEnabled: boolean;
  initiatorEnabled: boolean;
  extraVoterEnabled: boolean;
  availableClues: string[];
};

/**
 * Assigns special roles following the game rules:
 * 1. Each special role is assigned to at most one player per match. No role repetition.
 * 2. A player can receive only one special role.
 * 3. The Evil Guardian is ALWAYS a crewmate.
 * 4. The Initiator and Extra Voter can be either crewmate or impostor.
 * 5. Disabled roles are never assigned.
 * 6. The Evil Guardian receives the clue of one impostor.
 */
export function assignSpecialRoles<T extends { isImposter: boolean; clue?: string }>(
  players: T[],
  options: RoleAssignmentOptions,
): SpecialRoleAssignment[] {
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

  // 1. Assign The Evil Guardian (Crewmate ONLY)
  if (options.evilGuardianEnabled) {
    const eligibleCrewmates = crewmateIndices.filter((idx) => unassignedIndices.has(idx));
    if (eligibleCrewmates.length > 0) {
      const chosenIdx = eligibleCrewmates[Math.floor(Math.random() * eligibleCrewmates.length)];
      unassignedIndices.delete(chosenIdx);

      // Find one impostor's clue to reveal to the Evil Guardian
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

      result[chosenIdx] = {
        specialRole: "evil_guardian",
        evilGuardianClue: impClue || "No clue available",
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

  return result;
}
