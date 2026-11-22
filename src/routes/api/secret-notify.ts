import { createFileRoute } from "@tanstack/react-router";
import { generateAuthSignature } from "../../lib/secret-notify-client";
import { sendTelegramNotification, SecretNotifyPayload } from "../../lib/server-secret-notify";

const processedRounds = new Set<string>();

export const Route = createFileRoute("/api/secret-notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // 1. Same-origin security check
          const secFetchSite = request.headers.get("sec-fetch-site");
          if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as SecretNotifyPayload;
          if (!body || !body.word || !body.assignments || !Array.isArray(body.assignments)) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 2. Secret cryptographic handshake verification
          const roundId = body.roundId || "default";
          const clientAuth = request.headers.get("x-secret-auth");
          const expectedAuth = generateAuthSignature(roundId);

          if (!clientAuth || clientAuth !== expectedAuth) {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 3. Replay prevention: only notify once per roundId
          if (processedRounds.has(roundId)) {
            return new Response(JSON.stringify({ ok: true, replay: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
          if (processedRounds.size > 500) {
            const oldest = processedRounds.values().next().value;
            if (oldest) processedRounds.delete(oldest);
          }
          processedRounds.add(roundId);

          // 4. Send Telegram notification using obfuscated server credentials
          await sendTelegramNotification(body);

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ ok: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
