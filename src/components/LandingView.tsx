"use client";

import type { AppMode } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Cast,
  Smartphone,
  Tv2,
  Zap,
  Shield,
  Wifi,
  Play,
  ChevronRight,
} from "lucide-react";

interface LandingViewProps {
  roomCode: string;
  setRoomCode: (v: string) => void;
  onSelectMode: (mode: AppMode) => void;
}

const features = [
  {
    icon: Zap,
    title: "Zero Install",
    desc: "No app, no plugin. Just a browser on both devices.",
  },
  {
    icon: Wifi,
    title: "Peer-to-Peer",
    desc: "Video bytes travel directly device-to-device. No cloud middleman.",
  },
  {
    icon: Shield,
    title: "Native Quality",
    desc: "Raw file data sent over DataChannel. TV plays it natively at full quality.",
  },
  {
    icon: Play,
    title: "Select & Cast",
    desc: "Pick any video file on your phone. TV streams it instantly.",
  },
];

export function LandingView({
  roomCode,
  setRoomCode,
  onSelectMode,
}: LandingViewProps) {
  const handleMode = (mode: AppMode) => {
    if (!roomCode.trim()) return;
    onSelectMode(mode);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10">
      {/* Hero */}
      <div className="text-center mb-12 space-y-5">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative float-anim">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl">
              <Cast className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-white via-purple-200 to-blue-300 bg-clip-text text-transparent">
            Local
          </span>
          <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Cast
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Stream any video file from your{" "}
          <span className="text-purple-400 font-medium">phone</span> to your{" "}
          <span className="text-blue-400 font-medium">TV browser</span>.{" "}
          <br className="hidden md:block" />
          No cloud. No install. Pure peer-to-peer.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Badge variant="outline" className="border-purple-500/40 text-purple-300 text-xs px-3 py-1">
            WebRTC DataChannel
          </Badge>
          <Badge variant="outline" className="border-blue-500/40 text-blue-300 text-xs px-3 py-1">
            MediaSource Extensions
          </Badge>
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-xs px-3 py-1">
            Zero Install
          </Badge>
        </div>
      </div>

      {/* Room code + mode selector */}
      <div className="glass-card rounded-2xl p-8 w-full max-w-md space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Room Code
          </label>
          <Input
            id="room-code-input"
            placeholder="e.g. LION42"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="text-center text-2xl font-bold tracking-widest h-14 bg-secondary/50 border-border/50 focus:border-primary/60 focus:ring-primary/30 placeholder:text-muted-foreground/40"
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground text-center">
            Same code on both phone and TV
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-broadcaster"
            onClick={() => handleMode("broadcaster")}
            disabled={!roomCode.trim()}
            className="group glass-card rounded-xl p-4 text-left hover:border-purple-500/60 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-500/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-purple-400" />
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-semibold text-sm">Phone</p>
            <p className="text-xs text-muted-foreground mt-0.5">Select &amp; stream file</p>
          </button>

          <button
            id="btn-viewer"
            onClick={() => handleMode("viewer")}
            disabled={!roomCode.trim()}
            className="group glass-card rounded-xl p-4 text-left hover:border-blue-500/60 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Tv2 className="w-4 h-4 text-blue-400" />
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-semibold text-sm">TV / Screen</p>
            <p className="text-xs text-muted-foreground mt-0.5">Receive &amp; watch</p>
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-16 w-full max-w-3xl">
        <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card rounded-xl p-5 flex items-start gap-4 hover:border-purple-500/40 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="mt-12 w-full max-w-lg">
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Quick Start
          </h2>
          {[
            { step: "1", text: "Open this page on both your phone and TV browser" },
            { step: "2", text: "Type the same room code on both devices" },
            { step: "3", text: "TV selects Viewer → Phone selects Phone" },
            { step: "4", text: "On phone, pick any video file — TV streams it instantly" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {s.step}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground/50 text-center">
        Powered by WebRTC DataChannel + MediaSource Extensions · No server touches your video
      </p>
    </main>
  );
}
