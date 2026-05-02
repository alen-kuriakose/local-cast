"use client";

import { useState } from "react";
import type { AppMode } from "@/types";
import { BroadcasterView } from "@/components/BroadcasterView";
import { ViewerView } from "@/components/ViewerView";
import { LandingView } from "@/components/LandingView";



export default function Home() {
  const [mode, setMode] = useState<AppMode>("idle");
  const [roomCode, setRoomCode] = useState("");

  if (mode === "broadcaster") {
    return (
      <BroadcasterView
        roomCode={roomCode}
        onBack={() => setMode("idle")}
      />
    );
  }

  if (mode === "viewer") {
    return (
      <ViewerView
        roomCode={roomCode}
        onBack={() => setMode("idle")}
      />
    );
  }

  return (
    <LandingView
      roomCode={roomCode}
      setRoomCode={setRoomCode}
      onSelectMode={setMode}
    />
  );
}
