"use client";

import { useCallback, useRef, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StatusDot } from "@/components/StatusDot";
import { toast } from "sonner";
import {
  ArrowLeft,
  Smartphone,
  Upload,
  Play,
  Pause,
  Link,
  FileVideo,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSpeed(bps: number): string {
  if (bps === 0) return "—";
  return `${formatBytes(bps)}/s`;
}

interface Props {
  roomCode: string;
  onBack: () => void;
}

export function BroadcasterView({ roomCode, onBack }: Props) {
  const { status, stats, error, connect, disconnect, selectAndStream, sendControl } =
    useWebRTC("broadcaster", roomCode);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = useCallback(() => {
    connect();
    toast.info("Waiting for viewer to connect…", { id: "conn" });
  }, [connect]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file.");
        return;
      }
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`, { id: "file" });
      selectAndStream(file);
    },
    [selectAndStream]
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      sendControl("pause");
      setIsPlaying(false);
      toast("Paused on TV", { icon: "⏸" });
    } else {
      sendControl("play");
      setIsPlaying(true);
      toast("Playing on TV", { icon: "▶️" });
    }
  }, [isPlaying, sendControl]);

  const isConnected = status === "connected" || status === "streaming";
  const isStreaming = status === "streaming";
  const isConnecting = status === "connecting";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl glass-card flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Phone / Broadcaster</h1>
              <p className="text-xs text-muted-foreground">Room: <span className="font-mono text-purple-300">{roomCode}</span></p>
            </div>
          </div>
          <div className="ml-auto">
            <StatusDot status={status} />
          </div>
        </div>

        {/* Main card */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          {/* Step 1: Connect */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">1</div>
              <p className="text-sm font-medium">Connect to room</p>
            </div>

            {status === "idle" ? (
              <Button
                id="btn-connect-broadcaster"
                onClick={handleConnect}
                className="w-full btn-glow bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 h-12"
              >
                <Link className="w-4 h-4 mr-2" />
                Connect to Room
              </Button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-2">
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                  ) : isConnected ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm capitalize">
                    {isConnecting
                      ? "Waiting for viewer…"
                      : status === "connected"
                      ? "Viewer connected!"
                      : status === "streaming"
                      ? "Streaming…"
                      : status}
                  </span>
                </div>
                <button
                  onClick={() => { disconnect(); setSelectedFile(null); setIsPlaying(false); }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          <Separator className="bg-border/40" />

          {/* Step 2: Pick file */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isConnected ? "bg-purple-500/20 text-purple-400" : "bg-secondary text-muted-foreground"}`}>2</div>
              <p className={`text-sm font-medium ${!isConnected ? "text-muted-foreground" : ""}`}>Select video file</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
              id="file-input"
            />

            {!selectedFile ? (
              <button
                id="btn-select-file"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected}
                className="w-full glass-card rounded-xl p-8 flex flex-col items-center gap-3 hover:border-purple-500/60 hover:bg-purple-500/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">Tap to select video</p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, MKV, MOV, WebM…</p>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <FileVideo className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => { fileInputRef.current?.click(); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    Change
                  </button>
                </div>

                {/* Progress */}
                {isStreaming && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Sending to TV…</span>
                      <span>{stats.progress}%</span>
                    </div>
                    <Progress value={stats.progress} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatBytes(stats.bytesSent)} sent</span>
                      <span>{formatSpeed(stats.speedBps)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-border/40" />

          {/* Step 3: Playback control */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStreaming ? "bg-purple-500/20 text-purple-400" : "bg-secondary text-muted-foreground"}`}>3</div>
              <p className={`text-sm font-medium ${!isStreaming ? "text-muted-foreground" : ""}`}>Control playback</p>
            </div>

            <Button
              id="btn-play-pause"
              onClick={handlePlayPause}
              disabled={!isStreaming}
              variant="outline"
              className="w-full h-12 border-border/50 hover:border-purple-500/60 hover:bg-purple-500/10 disabled:opacity-40"
            >
              {isPlaying ? (
                <><Pause className="w-4 h-4 mr-2" /> Pause on TV</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Play on TV</>
              )}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card rounded-xl p-4 border-destructive/40 bg-destructive/10">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Stats */}
        {isStreaming && (
          <div className="glass-card rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Chunks", value: stats.chunksSent },
              { label: "Sent", value: formatBytes(stats.bytesSent) },
              { label: "Speed", value: formatSpeed(stats.speedBps) },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-lg font-bold text-purple-400">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
