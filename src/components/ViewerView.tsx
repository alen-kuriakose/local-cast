"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusDot } from "@/components/StatusDot";
import {
  ArrowLeft,
  Tv2,
  Maximize2,
  Minimize2,
  Link,
  Loader2,
  Wifi,
  WifiOff,
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

export function ViewerView({ roomCode, onBack }: Props) {
  const { status, stats, error, connect, disconnect, attachVideo } =
    useWebRTC("viewer", roomCode);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    attachVideo(videoRef.current);
  }, [attachVideo]);

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Auto-fullscreen when streaming starts
  useEffect(() => {
    if (status === "streaming" && !document.fullscreenElement) {
      setTimeout(() => {
        videoRef.current?.requestFullscreen().catch(() => {
          // fullscreen might be blocked on mobile without user gesture
          setIsFullscreen(false);
        });
      }, 500);
    }
  }, [status]);

  // Hide overlay after a bit when streaming
  const resetOverlayTimer = useCallback(() => {
    setShowOverlay(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (status === "streaming") {
      overlayTimerRef.current = setTimeout(() => setShowOverlay(false), 3000);
    }
  }, [status]);

  const isConnected = status === "connected" || status === "streaming";
  const isStreaming = status === "streaming";
  const isConnecting = status === "connecting";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10"
      onMouseMove={resetOverlayTimer}
      onTouchStart={resetOverlayTimer}
    >
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className={`flex items-center gap-3 transition-opacity duration-500 ${isStreaming && !showOverlay ? "opacity-0" : "opacity-100"}`}>
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl glass-card flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Tv2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">TV / Viewer</h1>
              <p className="text-xs text-muted-foreground">
                Room: <span className="font-mono text-blue-300">{roomCode}</span>
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <StatusDot status={status} />
          </div>
        </div>

        {/* Connect card */}
        {!isConnected && (
          <div className="glass-card rounded-2xl p-8 space-y-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto float-anim">
              <Tv2 className="w-10 h-10 text-blue-400" />
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">Ready to Receive</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect to room <span className="font-mono text-blue-300 font-semibold">{roomCode}</span>, then start the phone broadcaster to stream a video here.
              </p>
            </div>

            {status === "idle" ? (
              <Button
                id="btn-connect-viewer"
                onClick={handleConnect}
                className="btn-glow bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0 h-12 w-full"
              >
                <Link className="w-4 h-4 mr-2" />
                Connect &amp; Wait
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-3 p-4 bg-secondary/50 rounded-xl">
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                    <span className="text-sm">Waiting for phone broadcaster…</span>
                  </>
                ) : status === "error" ? (
                  <>
                    <WifiOff className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-red-400">{error || "Connection failed"}</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Connected — stream starting…</span>
                  </>
                )}
              </div>
            )}

            {status !== "idle" && (
              <button
                onClick={() => disconnect()}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Video player */}
        {isConnected && (
          <div className="space-y-4">
            <div className="relative glass-card rounded-2xl overflow-hidden aspect-video bg-black group">
              <video
                ref={videoRef}
                id="tv-video-player"
                className="w-full h-full object-contain"
                autoPlay
                playsInline
              />

              {/* Loading overlay before stream starts */}
              {status === "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                  <div className="text-center">
                    <p className="font-medium">Waiting for video stream…</p>
                    <p className="text-sm text-muted-foreground mt-1">Phone is connected. Select a file to start.</p>
                  </div>
                </div>
              )}

              {/* Fullscreen button */}
              <button
                id="btn-fullscreen"
                onClick={toggleFullscreen}
                className={`absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition-all duration-300 ${isStreaming && !showOverlay ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Stream info */}
            {isStreaming && (
              <div className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex-1 pr-4">{stats.fileName || "Incoming stream"}</span>
                  <span className="text-muted-foreground text-xs flex-shrink-0">{stats.progress}%</span>
                </div>
                <Progress value={stats.progress} className="h-1.5" />
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Received", value: formatBytes(stats.bytesReceived) },
                    { label: "Total", value: formatBytes(stats.totalBytes) },
                    { label: "Speed", value: formatSpeed(stats.speedBps) },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-base font-bold text-blue-400">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disconnect */}
            <div className="text-center">
              <button
                onClick={() => disconnect()}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card rounded-xl p-4 border-destructive/40 bg-destructive/10">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
