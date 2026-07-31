import { createFileRoute } from "@tanstack/react-router";
import {
  rooms,
  broadcastRoomState,
  startGame,
  markReady,
  submitClue,
  skipTurn,
  markReadyToVote,
  submitVote,
  sendChat,
  newGame,
  exitToLobby,
  updatePlayerIdentity,
  updateSettings
} from "../../lib/server-state";

export const Route = createFileRoute("/api/action")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action, roomId, playerId, data } = body;

          if (!roomId || !playerId || !action) {
            return new Response("Missing parameters", { status: 400 });
          }

          const room = rooms.get(roomId);
          // If room doesn't exist and they are trying to join, it'll be created in the SSE stream anyway,
          // but let's allow them to initialize or just ensure they can connect.
          if (!room && action !== "updateIdentity" && action !== "join") {
            return new Response("Room not found", { status: 404 });
          }

          switch (action) {
            case "updateSettings":
              updateSettings(roomId, playerId, data);
              break;
            case "updateIdentity":
              // This updates the local name/avatar
              updatePlayerIdentity(roomId, playerId, data.name, data.avatar);
              break;
            case "startGame":
              startGame(roomId, playerId);
              break;
            case "markReady":
              markReady(roomId, playerId);
              break;
            case "submitClue":
              submitClue(roomId, playerId, data.round, data.text);
              break;
            case "skipTurn":
              skipTurn(roomId, playerId);
              break;
            case "markReadyToVote":
              markReadyToVote(roomId, playerId);
              break;
            case "submitVote":
              submitVote(roomId, playerId, data.targetId);
              break;
            case "sendChat":
              sendChat(roomId, playerId, data.text);
              break;
            case "newGame":
              newGame(roomId, playerId);
              break;
            case "exitToLobby":
              exitToLobby(roomId, playerId);
              break;
            default:
              return new Response("Unknown action", { status: 400 });
          }

          broadcastRoomState(roomId);
          return new Response("ok", { status: 200 });
        } catch (err: any) {
          console.error("Action error:", err);
          return new Response(err.message || "Internal error", { status: 500 });
        }
      },
    },
  },
});
