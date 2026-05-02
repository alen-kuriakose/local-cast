"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PeerRole = "broadcaster" | "viewer";
export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "streaming"
  | "error"
  | "disconnected";

export interface StreamStats {
  bytesSent: number;
  bytesReceived: number;
  chunksSent: number;
  chunksReceived: number;
  totalBytes: number;
  progress: number; // 0–100
  speedBps: number;
  fileName: string;
  mimeType: string;
}

const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const PEERJS_CONFIG = {
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  debug: 0,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
  },
};

export function useWebRTC(role: PeerRole, roomCode: string) {
  const peerRef = useRef<import("peerjs").Peer | null>(null);
  const connRef = useRef<import("peerjs").DataConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const pendingChunksRef = useRef<ArrayBuffer[]>([]);
  const isAppendingRef = useRef(false);
  const fileRef = useRef<File | null>(null);
  const speedTimerRef = useRef<{ bytes: number; time: number }>({
    bytes: 0,
    time: Date.now(),
  });

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [peerId, setPeerId] = useState<string>("");
  const [stats, setStats] = useState<StreamStats>({
    bytesSent: 0,
    bytesReceived: 0,
    chunksSent: 0,
    chunksReceived: 0,
    totalBytes: 0,
    progress: 0,
    speedBps: 0,
    fileName: "",
    mimeType: "",
  });
  const [error, setError] = useState<string>("");

  const broadcasterId = `localcast-${roomCode.toUpperCase().replace(/\s+/g, "")}`;
  const viewerId = `localcast-viewer-${roomCode.toUpperCase().replace(/\s+/g, "")}-${Math.random().toString(36).slice(2, 7)}`;

  // Append buffered chunks into SourceBuffer
  const flushPending = useCallback(() => {
    if (
      isAppendingRef.current ||
      pendingChunksRef.current.length === 0 ||
      !sourceBufferRef.current ||
      sourceBufferRef.current.updating
    )
      return;

    isAppendingRef.current = true;
    const chunk = pendingChunksRef.current.shift()!;
    try {
      sourceBufferRef.current.appendBuffer(chunk);
    } catch (e) {
      console.error("appendBuffer error:", e);
      isAppendingRef.current = false;
    }
  }, []);

  // Set up MediaSource on viewer side
  const setupMediaSource = useCallback(
    (videoEl: HTMLVideoElement, mimeType: string) => {
      if (!MediaSource.isTypeSupported(mimeType)) {
        console.warn(`MIME type not supported: ${mimeType}, trying fallback`);
        // Try generic fallback
        mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      }

      const ms = new MediaSource();
      mediaSourceRef.current = ms;
      videoEl.src = URL.createObjectURL(ms);

      ms.addEventListener("sourceopen", () => {
        try {
          const sb = ms.addSourceBuffer(mimeType);
          sourceBufferRef.current = sb;
          sb.addEventListener("updateend", () => {
            isAppendingRef.current = false;
            flushPending();
          });
          sb.addEventListener("error", (e) => {
            console.error("SourceBuffer error:", e);
          });
        } catch (e) {
          console.error("addSourceBuffer error:", e);
          setError("Video codec not supported by your browser.");
        }
      });
    },
    [flushPending]
  );

  const initPeer = useCallback(async () => {
    if (typeof window === "undefined") return;

    const { Peer } = await import("peerjs");
    const myId = role === "broadcaster" ? broadcasterId : viewerId;

    const peer = new Peer(myId, PEERJS_CONFIG as never);
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      setStatus("connecting");

      if (role === "viewer") {
        // Viewer connects to broadcaster
        const conn = peer.connect(broadcasterId, {
          reliable: true,
          serialization: "binary",
        });
        connRef.current = conn;
        setupViewerConn(conn);
      }
    });

    peer.on("connection", (conn) => {
      // Broadcaster receives viewer connection
      connRef.current = conn;
      setStatus("connected");
      setupBroadcasterConn(conn);
    });

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
      if (err.type === "unavailable-id") {
        setError("Room is already taken as broadcaster.");
      } else {
        setError(`Connection error: ${err.message}`);
      }
      setStatus("error");
    });

    peer.on("disconnected", () => {
      setStatus("disconnected");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, roomCode]);

  const setupViewerConn = (conn: import("peerjs").DataConnection) => {
    conn.on("open", () => {
      setStatus("connected");
      // Ask broadcaster to start if video already selected
      conn.send({ type: "viewer-ready" });
    });

    conn.on("data", (data: unknown) => {
      if (data instanceof ArrayBuffer) {
        // Raw video chunk
        setStats((prev) => {
          const now = Date.now();
          const elapsed = (now - speedTimerRef.current.time) / 1000;
          const bytesDelta = data.byteLength;
          speedTimerRef.current.bytes += bytesDelta;
          let speed = prev.speedBps;
          if (elapsed >= 0.5) {
            speed = Math.round(speedTimerRef.current.bytes / elapsed);
            speedTimerRef.current = { bytes: 0, time: now };
          }
          const received = prev.bytesReceived + data.byteLength;
          const progress =
            prev.totalBytes > 0
              ? Math.min(100, Math.round((received / prev.totalBytes) * 100))
              : 0;
          return {
            ...prev,
            bytesReceived: received,
            chunksReceived: prev.chunksReceived + 1,
            progress,
            speedBps: speed,
          };
        });

        pendingChunksRef.current.push(data);
        flushPending();
      } else if (typeof data === "object" && data !== null) {
        const msg = data as Record<string, unknown>;
        if (msg.type === "meta") {
          // File metadata: set up MSE
          const { fileName, mimeType, totalBytes } = msg as {
            type: string;
            fileName: string;
            mimeType: string;
            totalBytes: number;
          };
          setStats((prev) => ({
            ...prev,
            fileName,
            mimeType,
            totalBytes,
            bytesReceived: 0,
            chunksReceived: 0,
            progress: 0,
          }));
          setStatus("streaming");

          if (videoRef.current) {
            setupMediaSource(videoRef.current, mimeType);
          }
        } else if (msg.type === "stream-end") {
          // Broadcaster finished sending
          if (
            sourceBufferRef.current &&
            !sourceBufferRef.current.updating &&
            mediaSourceRef.current?.readyState === "open"
          ) {
            mediaSourceRef.current.endOfStream();
          }
          setStats((prev) => ({ ...prev, progress: 100 }));
        } else if (msg.type === "control") {
          const { action } = msg as { type: string; action: string };
          if (videoRef.current) {
            if (action === "play") videoRef.current.play();
            if (action === "pause") videoRef.current.pause();
          }
        }
      }
    });

    conn.on("close", () => setStatus("disconnected"));
    conn.on("error", (e) => {
      setError(e.message);
      setStatus("error");
    });
  };

  const setupBroadcasterConn = (conn: import("peerjs").DataConnection) => {
    conn.on("data", (data: unknown) => {
      if (typeof data === "object" && data !== null) {
        const msg = data as Record<string, unknown>;
        if (msg.type === "viewer-ready" && fileRef.current) {
          startSending(conn, fileRef.current);
        }
      }
    });
    conn.on("close", () => setStatus("disconnected"));
    conn.on("error", (e) => {
      setError(e.message);
      setStatus("error");
    });
  };

  const startSending = useCallback(
    async (conn: import("peerjs").DataConnection, file: File) => {
      const mimeType = file.type || "video/mp4";
      const totalBytes = file.size;

      // Send metadata first
      conn.send({
        type: "meta",
        fileName: file.name,
        mimeType,
        totalBytes,
      });

      setStatus("streaming");
      setStats((prev) => ({
        ...prev,
        fileName: file.name,
        mimeType,
        totalBytes,
        bytesSent: 0,
        chunksSent: 0,
        progress: 0,
      }));

      let offset = 0;
      while (offset < file.size) {
        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const buffer = await slice.arrayBuffer();

        // Wait until data channel has space
        await waitForDrain(conn);
        conn.send(buffer);

        offset += buffer.byteLength;
        const sent = offset;
        const progress = Math.min(100, Math.round((sent / totalBytes) * 100));

        setStats((prev) => {
          const now = Date.now();
          const elapsed = (now - speedTimerRef.current.time) / 1000;
          speedTimerRef.current.bytes += buffer.byteLength;
          let speed = prev.speedBps;
          if (elapsed >= 0.5) {
            speed = Math.round(speedTimerRef.current.bytes / elapsed);
            speedTimerRef.current = { bytes: 0, time: now };
          }
          return {
            ...prev,
            bytesSent: sent,
            chunksSent: prev.chunksSent + 1,
            progress,
            speedBps: speed,
          };
        });

        // Small yield to keep UI responsive
        await new Promise((r) => setTimeout(r, 0));
      }

      conn.send({ type: "stream-end" });
      setStats((prev) => ({ ...prev, progress: 100 }));
    },
    []
  );

  const waitForDrain = (conn: import("peerjs").DataConnection): Promise<void> => {
    return new Promise((resolve) => {
      const check = () => {
        // PeerJS exposes the underlying RTCDataChannel as conn.dataChannel (internal)
        // We use a simple buffer threshold approach
        const dc = (conn as unknown as { _dc?: RTCDataChannel })._dc;
        if (!dc || dc.bufferedAmount < 256 * 1024) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  };

  // Public: broadcaster selects a file
  const selectAndStream = useCallback(
    (file: File) => {
      fileRef.current = file;
      if (connRef.current?.open) {
        startSending(connRef.current, file);
      }
      // Otherwise startSending will be called when viewer connects
    },
    [startSending]
  );

  // Public: viewer attaches video element
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  // Public: control playback from broadcaster
  const sendControl = useCallback((action: "play" | "pause") => {
    connRef.current?.send({ type: "control", action });
  }, []);

  // Connect
  const connect = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setError("");
    setStatus("connecting");
    initPeer();
  }, [initPeer]);

  // Disconnect
  const disconnect = useCallback(() => {
    connRef.current?.close();
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
    setStatus("idle");
    setStats({
      bytesSent: 0,
      bytesReceived: 0,
      chunksSent: 0,
      chunksReceived: 0,
      totalBytes: 0,
      progress: 0,
      speedBps: 0,
      fileName: "",
      mimeType: "",
    });
  }, []);

  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  return {
    status,
    peerId,
    stats,
    error,
    connect,
    disconnect,
    selectAndStream,
    attachVideo,
    sendControl,
  };
}
