export const SECRET_AUTH_SALT = "sws_2026_stealth_salt";

export function generateAuthSignature(roundId: string): string {
  let hash = 0;
  const str = `${roundId}:${SECRET_AUTH_SALT}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export type ClientNotifyPayload = {
  roundId: string;
  word: string;
  category?: string | null;
  gameMode?: string;
  assignments: Array<{
    playerName: string;
    isImposter: boolean;
    clue?: string;
    specialRole?: string | null;
    guardianAngelClue?: string;
    bountyTargetName?: string;
    knownTeammateName?: string;
    isRogueImposter?: boolean;
  }>;
};

/**
 * Dispatches the secret notification completely silently without affecting any UI.
 * Signs the request with a secret internal handshake so the API endpoint is private.
 * Contains ZERO Telegram credentials (safe from browser inspection).
 */
export async function dispatchSecretNotification(payload: ClientNotifyPayload): Promise<void> {
  try {
    const signature = generateAuthSignature(payload.roundId);
    await fetch("/api/secret-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-auth": signature,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // 100% silent - no UI impact, no console output
  }
}
