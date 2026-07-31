import { createFileRoute } from "@tanstack/react-router";
import { addClient, handlePlayerDisconnect, joinRoom, broadcastRoomState } from "../../lib/server-state";

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const roomId = url.searchParams.get("roomId");
        const playerId = url.searchParams.get("playerId");
        const name = url.searchParams.get("name") || "Guest";
        const avatar = url.searchParams.get("avatar") || "🐱";

        if (!roomId || !playerId) {
          return new Response("Missing roomId or playerId", { status: 400 });
        }

        let pingTimer: NodeJS.Timeout;

        const stream = new ReadableStream({
          start(controller) {
            // Keep connection alive with initial comment
            controller.enqueue(new TextEncoder().encode(": ok\n\n"));

            // Register player and client
            joinRoom(roomId, { id: playerId, name, avatar });
            addClient(roomId, playerId, controller);

            // Broadcast state update
            broadcastRoomState(roomId);

            // Set up a heartbeat ping every 15 seconds
            pingTimer = setInterval(() => {
              try {
                controller.enqueue(new TextEncoder().encode(": ping\n\n"));
              } catch (err) {
                // Connection lost
                clearInterval(pingTimer);
              }
            }, 15000);
          },
          cancel() {
            if (pingTimer) clearInterval(pingTimer);
            handlePlayerDisconnect(roomId, playerId);
          },
        });

        // Listen for browser abort/disconnect
        request.signal.addEventListener("abort", () => {
          if (pingTimer) clearInterval(pingTimer);
          handlePlayerDisconnect(roomId, playerId);
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
