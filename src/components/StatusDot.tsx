"use client";

import { ConnectionStatus } from "@/hooks/useWebRTC";

const statusConfig: Record<
  ConnectionStatus,
  { color: string; label: string; pulse: boolean }
> = {
  idle: { color: "bg-muted-foreground/50", label: "Idle", pulse: false },
  connecting: { color: "bg-yellow-400", label: "Connecting", pulse: true },
  connected: { color: "bg-green-400", label: "Connected", pulse: false },
  streaming: { color: "bg-purple-400", label: "Streaming", pulse: true },
  error: { color: "bg-red-400", label: "Error", pulse: false },
  disconnected: { color: "bg-orange-400", label: "Disconnected", pulse: false },
};

interface Props {
  status: ConnectionStatus;
}

export function StatusDot({ status }: Props) {
  const cfg = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`w-2.5 h-2.5 rounded-full ${cfg.color} ${cfg.pulse ? "status-connecting" : ""}`}
        />
        {cfg.pulse && (
          <div
            className={`absolute inset-0 rounded-full ${cfg.color} opacity-40 animate-ping`}
          />
        )}
      </div>
      <span className="text-xs text-muted-foreground">{cfg.label}</span>
    </div>
  );
}
