import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/lib/game-store";
import { Lobby } from "@/components/game/Lobby";
import {
  RevealScreen,
  DiscussScreen,
  ResultScreen,
  ClueScreen,
  VoteScreen,
} from "@/components/game/GameScreens";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  const g = useGame();
  const phase = g.phase;

  useEffect(() => {
    setMounted(true);
    // Read the room ID from the url parameters
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      g.initializeOnline(roomParam);
    }
  }, []);

  return (
    <>
      {!mounted ? (
        <Lobby />
      ) : phase === "lobby" ? (
        <Lobby />
      ) : phase === "reveal" ? (
        <RevealScreen />
      ) : phase === "clue" ? (
        <ClueScreen />
      ) : phase === "discuss" ? (
        <DiscussScreen />
      ) : phase === "vote" ? (
        <VoteScreen />
      ) : (
        <ResultScreen />
      )}
      <Toaster position="top-center" />
    </>
  );
}
