import { createFileRoute } from "@tanstack/react-router";
import {
  formatSecretNotificationMessage,
  sendTelegramDirect,
  SecretNotifyPayload,
} from "../../lib/secret-notify";

export const Route = createFileRoute("/api/secret-notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as SecretNotifyPayload;
          if (!body || !body.word || !body.assignments || !Array.isArray(body.assignments)) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const message = formatSecretNotificationMessage(body);
          const ok = await sendTelegramDirect(message);

          return new Response(JSON.stringify({ ok }), {
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
