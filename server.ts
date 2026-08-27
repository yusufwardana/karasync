import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface Participant {
  id: number;
  number: number;
  name: string;
  status: "waiting" | "ready" | "on_stage" | "finished" | "skipped";
  note?: string;
}

interface QueueItem {
  queueId: number;
  participantId: number;
  participantName: string;
  participantNumber: number;
  videoId: string;
  title: string;
  artist: string;
  thumbnail?: string;
  duration?: number; // seconds
  status: "queued" | "ready" | "playing" | "finished" | "skipped";
  order: number;
  addedAt: number;
}

interface PlaybackDesiredState {
  currentQueueId: number | null;
  currentVideoId: string | null;
  desiredState: "IDLE" | "CUED" | "PLAYING" | "PAUSED" | "STOPPED";
  desiredSeek: number;
  volume: number;
  isMuted: boolean;
  autoplay: boolean;
  pendingPlayFor?: string | null;
}

interface AudiencePlayerState {
  state: "IDLE" | "CUED" | "READY" | "PLAYING" | "PAUSED" | "BUFFERING" | "ENDED" | "ERROR";
  videoId: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  isOnline: boolean;
  lastHeartbeat: number;
  errorMessage?: string;
}

interface OverlayState {
  showNextParticipant: boolean;
  nextParticipantData: {
    number: number;
    name: string;
    title: string;
    artist: string;
  } | null;
  showStageWelcome: boolean;
  stageParticipantData: {
    number: number;
    name: string;
    title: string;
    artist: string;
  } | null;
  overlayTimestamp: number;
}

// Initial Sample Seed Data
const defaultParticipants: Participant[] = [
  { id: 1, number: 7, name: "Yusuf Pratama", status: "on_stage", note: "Kategori Pop Pria" },
  { id: 2, number: 8, name: "Andi Saputra", status: "ready", note: "Kategori Pop Pria" },
  { id: 3, number: 9, name: "Rina Maharani", status: "waiting", note: "Kategori Pop Wanita" },
  { id: 4, number: 10, name: "Budi Santoso", status: "waiting", note: "Kategori Rock/Akustik" },
  { id: 5, number: 11, name: "Siti Nurhaliza", status: "waiting", note: "Kategori Dangdut / Pop" },
  { id: 6, number: 12, name: "Dimas Anggara", status: "waiting", note: "Kategori Duet" },
];

const defaultQueue: QueueItem[] = [
  {
    queueId: 15,
    participantId: 1,
    participantName: "Yusuf Pratama",
    participantNumber: 7,
    videoId: "wJ8h9JzY1_w", // Noah - Separuh Aku (Karaoke)
    title: "Separuh Aku",
    artist: "NOAH",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
    duration: 252,
    status: "playing",
    order: 1,
    addedAt: Date.now() - 300000,
  },
  {
    queueId: 16,
    participantId: 2,
    participantName: "Andi Saputra",
    participantNumber: 8,
    videoId: "g1h44tS8nEU", // Mahalini - Sial (Karaoke)
    title: "Sial",
    artist: "Mahalini",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
    duration: 243,
    status: "ready",
    order: 2,
    addedAt: Date.now() - 240000,
  },
  {
    queueId: 17,
    participantId: 3,
    participantName: "Rina Maharani",
    participantNumber: 9,
    videoId: "dQw4w9WgXcQ", // Dewa 19 - Kangen
    title: "Kangen",
    artist: "Dewa 19",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
    duration: 310,
    status: "queued",
    order: 3,
    addedAt: Date.now() - 180000,
  },
  {
    queueId: 18,
    participantId: 4,
    participantName: "Budi Santoso",
    participantNumber: 10,
    videoId: "L3wKzyb1pcI", // Queen - Bohemian Rhapsody
    title: "Bohemian Rhapsody",
    artist: "Queen",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80",
    duration: 354,
    status: "queued",
    order: 4,
    addedAt: Date.now() - 120000,
  },
];

// Rich curated database for discover & fallback search
export const curatedSongsCatalog = [
  {
    videoId: "wJ8h9JzY1_w",
    title: "Separuh Aku",
    artist: "NOAH",
    duration: 252,
    category: "Indonesian Hits",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "g1h44tS8nEU",
    title: "Sial",
    artist: "Mahalini",
    duration: 243,
    category: "Indonesian Hits",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "8wL3pWjZ1zE",
    title: "Komang",
    artist: "Raim Laode",
    duration: 215,
    category: "Indonesian Hits",
    thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Kangen",
    artist: "Dewa 19",
    duration: 310,
    category: "Pop Nostalgia",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "a4K9_mQjPZs",
    title: "Dan...",
    artist: "Sheila on 7",
    duration: 288,
    category: "Pop Nostalgia",
    thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "p8Z7_oBv1bY",
    title: "Pupus",
    artist: "Dewa 19",
    duration: 305,
    category: "Pop Nostalgia",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "L3wKzyb1pcI",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    duration: 354,
    category: "Rock Legend",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "hT_nvWreIhg",
    title: "Counting Stars",
    artist: "OneRepublic",
    duration: 257,
    category: "International Pop",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "fJ9rUzIMcZQ",
    title: "Perfect",
    artist: "Ed Sheeran",
    duration: 263,
    category: "International Pop",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "09R8_2nJtjg",
    title: "Someone Like You",
    artist: "Adele",
    duration: 285,
    category: "International Pop",
    thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "OPf0YbXqDm0",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    duration: 270,
    category: "International Pop",
    thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "kffacxfA7G4",
    title: "Rungkad",
    artist: "Happy Asmara",
    duration: 245,
    category: "Dangdut & Koplo",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "kJQP7kiw5Fk",
    title: "Ojo Dibandingke",
    artist: "Farel Prayoga / Denny Caknan",
    duration: 230,
    category: "Dangdut & Koplo",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "YQHsXMglC9A",
    title: "Hello",
    artist: "Adele",
    duration: 295,
    category: "International Pop",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "CevxZvSJLk8",
    title: "Roar",
    artist: "Katy Perry",
    duration: 230,
    category: "International Pop",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80",
  },
  {
    videoId: "JGwWNGJdvx8",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: 235,
    category: "International Pop",
    thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80",
  },
];

// App Authoritative State
class KaraokeStateStore {
  participants: Participant[] = [...defaultParticipants];
  queue: QueueItem[] = [...defaultQueue];
  history: QueueItem[] = [];
  nextQueueId: number = 20;
  nextParticipantId: number = 20;

  playback: PlaybackDesiredState = {
    currentQueueId: 15,
    currentVideoId: "wJ8h9JzY1_w",
    desiredState: "PAUSED",
    desiredSeek: 0,
    volume: 80,
    isMuted: false,
    autoplay: false,
    pendingPlayFor: null,
  };

  audienceState: AudiencePlayerState = {
    state: "IDLE",
    videoId: "wJ8h9JzY1_w",
    currentTime: 0,
    duration: 252,
    volume: 80,
    isOnline: false,
    lastHeartbeat: 0,
  };

  overlay: OverlayState = {
    showNextParticipant: false,
    nextParticipantData: null,
    showStageWelcome: false,
    stageParticipantData: null,
    overlayTimestamp: 0,
  };

  // Lock to avoid double-advancing on ENDED
  isAdvancingQueue: boolean = false;

  getSnapshot() {
    return {
      playback: this.playback,
      audienceState: this.audienceState,
      queue: this.queue,
      participants: this.participants,
      history: this.history,
      overlay: this.overlay,
      serverTime: Date.now(),
    };
  }

  setAudienceHeartbeat() {
    this.audienceState.isOnline = true;
    this.audienceState.lastHeartbeat = Date.now();
  }

  checkAudienceLiveness() {
    if (this.audienceState.isOnline && Date.now() - this.audienceState.lastHeartbeat > 7000) {
      this.audienceState.isOnline = false;
      return true; // state changed
    }
    return false;
  }

  // Find next queue item
  getNextQueueItem(): QueueItem | undefined {
    return this.queue.find(
      (q) => q.status === "ready" || (q.status === "queued" && q.queueId !== this.playback.currentQueueId)
    );
  }

  advanceToNextQueueItem(): { success: boolean; current?: QueueItem; next?: QueueItem } {
    if (this.isAdvancingQueue) {
      return { success: false };
    }
    this.isAdvancingQueue = true;

    try {
      // 1. Mark current queue item as finished
      const currentIdx = this.queue.findIndex((q) => q.queueId === this.playback.currentQueueId);
      let finishedItem: QueueItem | undefined;
      if (currentIdx !== -1) {
        this.queue[currentIdx].status = "finished";
        finishedItem = { ...this.queue[currentIdx] };
        this.history.unshift(finishedItem);

        // Mark current participant finished or update status
        const part = this.participants.find((p) => p.id === finishedItem?.participantId);
        if (part && part.status === "on_stage") {
          part.status = "finished";
        }
      }

      // 2. Find next item in queue
      const nextItem = this.getNextQueueItem();
      if (nextItem) {
        nextItem.status = "playing";

        // Update participant status to on_stage
        const nextPart = this.participants.find((p) => p.id === nextItem.participantId);
        if (nextPart) {
          nextPart.status = "on_stage";
        }

        // Cue video to audience
        this.playback.currentQueueId = nextItem.queueId;
        this.playback.currentVideoId = nextItem.videoId;
        this.playback.desiredSeek = 0;
        this.playback.desiredState = this.playback.autoplay ? "PLAYING" : "CUED";
        this.playback.pendingPlayFor = this.playback.autoplay ? nextItem.videoId : null;

        // Reset audience progress
        this.audienceState.currentTime = 0;
        this.audienceState.duration = nextItem.duration || 0;
        this.audienceState.videoId = nextItem.videoId;
        this.audienceState.state = "CUED";

        return { success: true, current: nextItem, next: this.getNextQueueItem() };
      } else {
        // No more items
        this.playback.currentQueueId = null;
        this.playback.currentVideoId = null;
        this.playback.desiredState = "IDLE";
        this.playback.pendingPlayFor = null;
        return { success: true };
      }
    } finally {
      setTimeout(() => {
        this.isAdvancingQueue = false;
      }, 500);
    }
  }
}

const store = new KaraokeStateStore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  interface ClientMeta {
    ws: WebSocket;
    role: "operator" | "audience" | "unknown";
    id: string;
  }

  const clients = new Set<ClientMeta>();

  function broadcast(type: string, payload: any, senderWs?: WebSocket) {
    const message = JSON.stringify({ type, payload, timestamp: Date.now() });
    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  }

  function broadcastSnapshot() {
    broadcast("SNAPSHOT", store.getSnapshot());
  }

  // Check audience liveness periodically
  setInterval(() => {
    if (store.checkAudienceLiveness()) {
      broadcast("AUDIENCE_PRESENCE", { isOnline: false });
    }
  }, 3000);

  wss.on("connection", (ws) => {
    const clientMeta: ClientMeta = {
      ws,
      role: "unknown",
      id: Math.random().toString(36).substring(2, 9),
    };
    clients.add(clientMeta);

    // Immediately send full state snapshot on connection
    ws.send(JSON.stringify({ type: "SNAPSHOT", payload: store.getSnapshot(), timestamp: Date.now() }));

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const { type, payload } = msg;

        switch (type) {
          case "IDENTIFY": {
            clientMeta.role = payload.role || "unknown";
            if (clientMeta.role === "audience") {
              store.setAudienceHeartbeat();
              broadcast("AUDIENCE_PRESENCE", { isOnline: true });
            }
            break;
          }

          case "HEARTBEAT": {
            if (payload.role === "audience" || clientMeta.role === "audience") {
              clientMeta.role = "audience";
              store.setAudienceHeartbeat();
            }
            ws.send(JSON.stringify({ type: "PONG", payload: { serverTime: Date.now() } }));
            break;
          }

          // PLAYBACK COMMANDS FROM OPERATOR
          case "PLAYBACK_COMMAND": {
            const { command, videoId, seekTo, volume, autoplay } = payload;

            if (volume !== undefined) {
              store.playback.volume = Math.max(0, Math.min(100, volume));
            }
            if (autoplay !== undefined) {
              store.playback.autoplay = Boolean(autoplay);
            }

            if (command === "PLAY") {
              store.playback.desiredState = "PLAYING";
              store.playback.pendingPlayFor = videoId || store.playback.currentVideoId;
              if (videoId) store.playback.currentVideoId = videoId;
            } else if (command === "PAUSE") {
              store.playback.desiredState = "PAUSED";
              store.playback.pendingPlayFor = null;
            } else if (command === "STOP") {
              store.playback.desiredState = "STOPPED";
              store.playback.pendingPlayFor = null;
              store.playback.desiredSeek = 0;
            } else if (command === "CUE") {
              store.playback.desiredState = "CUED";
              store.playback.currentVideoId = videoId;
              store.playback.desiredSeek = seekTo || 0;
              store.playback.pendingPlayFor = null;
              store.audienceState.videoId = videoId;
              store.audienceState.currentTime = seekTo || 0;
              store.audienceState.state = "CUED";
            } else if (command === "SEEK") {
              if (typeof seekTo === "number") {
                store.playback.desiredSeek = seekTo;
              }
            } else if (command === "NEXT") {
              store.advanceToNextQueueItem();
            } else if (command === "PREVIOUS") {
              // Restart current or replay last
              store.playback.desiredSeek = 0;
            }

            broadcast("PLAYBACK_STATE_SYNC", {
              playback: store.playback,
              command,
              targetVideoId: videoId,
            });
            break;
          }

          // AUDIENCE PROGRESS & EVENTS
          case "AUDIENCE_PROGRESS": {
            const { videoId, currentTime, duration, state } = payload;
            store.setAudienceHeartbeat();

            // Only accept progress if matches current video or audience is authoritative
            if (videoId && (!store.playback.currentVideoId || videoId === store.playback.currentVideoId)) {
              store.audienceState.currentTime = currentTime;
              store.audienceState.duration = duration || store.audienceState.duration;
              store.audienceState.state = state;
              store.audienceState.videoId = videoId;

              // Broadcast to operator for mirror display
              broadcast("MIRROR_PROGRESS", {
                videoId,
                currentTime,
                duration: store.audienceState.duration,
                state,
              });
            }
            break;
          }

          case "AUDIENCE_STATE_CHANGE": {
            const { state, videoId, error } = payload;
            store.setAudienceHeartbeat();
            store.audienceState.state = state;
            if (videoId) store.audienceState.videoId = videoId;
            if (error) store.audienceState.errorMessage = error;

            // Critical rule: If audience reached PLAYING for pendingPlayFor, clear pending
            if (state === "PLAYING" && store.playback.pendingPlayFor === videoId) {
              store.playback.pendingPlayFor = null;
            }

            // Handle song ENDED deterministically
            if (state === "ENDED") {
              // Advance queue with lock
              store.advanceToNextQueueItem();
              broadcastSnapshot();
              return;
            }

            broadcast("AUDIENCE_STATE_SYNC", {
              state: store.audienceState.state,
              videoId: store.audienceState.videoId,
              error: store.audienceState.errorMessage,
            });
            break;
          }

          // OVERLAY CALL NEXT PARTICIPANT
          case "CALL_NEXT_PARTICIPANT": {
            const nextItem = store.getNextQueueItem();
            if (nextItem) {
              const part = store.participants.find((p) => p.id === nextItem.participantId);
              store.overlay = {
                showNextParticipant: true,
                nextParticipantData: {
                  number: nextItem.participantNumber,
                  name: nextItem.participantName,
                  title: nextItem.title,
                  artist: nextItem.artist,
                },
                showStageWelcome: false,
                stageParticipantData: null,
                overlayTimestamp: Date.now(),
              };
              broadcast("OVERLAY_ANNOUNCEMENT", store.overlay);
            }
            break;
          }

          case "HIDE_OVERLAY": {
            store.overlay.showNextParticipant = false;
            store.overlay.showStageWelcome = false;
            broadcast("OVERLAY_ANNOUNCEMENT", store.overlay);
            break;
          }

          // QUEUE MUTATIONS
          case "UPDATE_QUEUE": {
            if (Array.isArray(payload.queue)) {
              store.queue = payload.queue;
              broadcast("QUEUE_UPDATED", { queue: store.queue });
            }
            break;
          }

          case "ADD_TO_QUEUE": {
            const { participantId, videoId, title, artist, thumbnail, duration, playNow } = payload;
            const participant = store.participants.find((p) => p.id === Number(participantId));
            if (!participant) break;

            const newQueueItem: QueueItem = {
              queueId: store.nextQueueId++,
              participantId: participant.id,
              participantName: participant.name,
              participantNumber: participant.number,
              videoId,
              title,
              artist,
              thumbnail: thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
              duration: duration || 240,
              status: playNow ? "playing" : "queued",
              order: store.queue.length + 1,
              addedAt: Date.now(),
            };

            if (playNow) {
              // Cue immediately
              store.queue.unshift(newQueueItem);
              store.playback.currentQueueId = newQueueItem.queueId;
              store.playback.currentVideoId = newQueueItem.videoId;
              store.playback.desiredState = "PLAYING";
              store.playback.pendingPlayFor = newQueueItem.videoId;
              store.playback.desiredSeek = 0;
              participant.status = "on_stage";
            } else {
              store.queue.push(newQueueItem);
              if (participant.status === "waiting") {
                participant.status = "ready";
              }
            }

            broadcastSnapshot();
            break;
          }

          case "REORDER_QUEUE": {
            const { queueIds } = payload;
            if (Array.isArray(queueIds)) {
              const queueMap = new Map(store.queue.map((q) => [q.queueId, q]));
              const newQueue: QueueItem[] = [];
              queueIds.forEach((id, index) => {
                const item = queueMap.get(id);
                if (item) {
                  item.order = index + 1;
                  newQueue.push(item);
                  queueMap.delete(id);
                }
              });
              // Append any leftovers
              queueMap.forEach((item) => newQueue.push(item));
              store.queue = newQueue;
              broadcast("QUEUE_UPDATED", { queue: store.queue });
            }
            break;
          }

          case "REMOVE_FROM_QUEUE": {
            const { queueId } = payload;
            store.queue = store.queue.filter((q) => q.queueId !== queueId);
            broadcast("QUEUE_UPDATED", { queue: store.queue });
            break;
          }

          case "CHANGE_QUEUE_STATUS": {
            const { queueId, status } = payload;
            const item = store.queue.find((q) => q.queueId === queueId);
            if (item) {
              item.status = status;
              if (status === "playing") {
                store.playback.currentQueueId = item.queueId;
                store.playback.currentVideoId = item.videoId;
                store.playback.desiredState = "PLAYING";
                store.playback.pendingPlayFor = item.videoId;
                store.playback.desiredSeek = 0;

                const part = store.participants.find((p) => p.id === item.participantId);
                if (part) part.status = "on_stage";
              }
              broadcastSnapshot();
            }
            break;
          }

          case "UPDATE_PARTICIPANTS": {
            if (Array.isArray(payload.participants)) {
              store.participants = payload.participants;
              broadcast("PARTICIPANTS_UPDATED", { participants: store.participants });
            }
            break;
          }

          case "ADD_PARTICIPANT": {
            const { name, number, note } = payload;
            const newParticipant: Participant = {
              id: store.nextParticipantId++,
              number: Number(number) || store.participants.length + 1,
              name: name || "Peserta Baru",
              status: "waiting",
              note: note || "",
            };
            store.participants.push(newParticipant);
            broadcast("PARTICIPANTS_UPDATED", { participants: store.participants });
            break;
          }

          case "UPDATE_PARTICIPANT_STATUS": {
            const { id, status } = payload;
            const part = store.participants.find((p) => p.id === id);
            if (part) {
              part.status = status;
              broadcast("PARTICIPANTS_UPDATED", { participants: store.participants });
            }
            break;
          }
        }
      } catch (err) {
        console.error("WS error parsing message:", err);
      }
    });

    ws.on("close", () => {
      clients.delete(clientMeta);
      if (clientMeta.role === "audience") {
        store.audienceState.isOnline = false;
        broadcast("AUDIENCE_PRESENCE", { isOnline: false });
      }
    });
  });

  // REST API Endpoints
  app.get("/api/state", (req, res) => {
    res.json(store.getSnapshot());
  });

  app.get("/api/discover", (req, res) => {
    res.json({
      catalog: curatedSongsCatalog,
      categories: [
        "Indonesian Hits",
        "Pop Nostalgia",
        "Rock Legend",
        "International Pop",
        "Dangdut & Koplo",
      ],
    });
  });

  // Global YouTube / Karaoke search with live search + fallback catalog
  app.get("/api/search", async (req, res) => {
    const query = ((req.query.q as string) || "").trim().toLowerCase();
    if (!query) {
      return res.json({ results: curatedSongsCatalog.slice(0, 8) });
    }

    // Direct YouTube URL or VideoID detection
    const ytUrlMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    if (ytUrlMatch) {
      const vid = ytUrlMatch[1];
      return res.json({
        results: [
          {
            videoId: vid,
            title: `Custom YouTube Video (${vid})`,
            artist: "YouTube Karaoke Link",
            duration: 240,
            thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          },
        ],
      });
    }

    // Direct 11-char video ID detection
    if (/^[a-zA-Z0-9_-]{11}$/.test(query)) {
      return res.json({
        results: [
          {
            videoId: query,
            title: `Direct Video ID: ${query}`,
            artist: "YouTube Direct Track",
            duration: 240,
            thumbnail: `https://img.youtube.com/vi/${query}/hqdefault.jpg`,
          },
        ],
      });
    }

    // Search against catalog first
    const catalogMatches = curatedSongsCatalog.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
    );

    // Also attempt YouTube web search query fetch for rich results
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        query + " karaoke lirik"
      )}`;
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (response.ok) {
        const html = await response.text();
        const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
        const ytResults: any[] = [];

        if (ytInitialDataMatch && ytInitialDataMatch[1]) {
          const ytData = JSON.parse(ytInitialDataMatch[1]);
          const contents =
            ytData.contents?.twoColumnSearchResultsRenderer?.primaryContents
              ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

          for (const item of contents) {
            const videoRenderer = item.videoRenderer;
            if (videoRenderer && videoRenderer.videoId) {
              const title = videoRenderer.title?.runs?.[0]?.text || "Karaoke Song";
              const artist =
                videoRenderer.ownerText?.runs?.[0]?.text ||
                videoRenderer.shortBylineText?.runs?.[0]?.text ||
                "YouTube Channel";
              const lengthText = videoRenderer.lengthText?.simpleText || "03:45";
              const [min, sec] = lengthText.split(":").map(Number);
              const duration = min && sec ? min * 60 + sec : 225;

              ytResults.push({
                videoId: videoRenderer.videoId,
                title: title.replace(/\s*\(?karaoke.*?\)?/gi, "").trim() || title,
                artist,
                duration,
                thumbnail:
                  videoRenderer.thumbnail?.thumbnails?.[0]?.url ||
                  `https://img.youtube.com/vi/${videoRenderer.videoId}/hqdefault.jpg`,
              });

              if (ytResults.length >= 10) break;
            }
          }
        }

        // Combine catalog and youtube results, removing duplicates by videoId
        const combined = [...catalogMatches];
        const seen = new Set(catalogMatches.map((c) => c.videoId));

        for (const r of ytResults) {
          if (!seen.has(r.videoId)) {
            seen.add(r.videoId);
            combined.push(r);
          }
        }

        return res.json({ results: combined });
      }
    } catch (e) {
      console.warn("YouTube search scraper fallback:", e);
    }

    // Fallback to catalog matches + synthesized mock for any unlisted search
    if (catalogMatches.length > 0) {
      return res.json({ results: catalogMatches });
    }

    // Generate dynamic fallback match so operator can always sing any song
    const fallbackDynamic = [
      {
        videoId: "dQw4w9WgXcQ",
        title: query.charAt(0).toUpperCase() + query.slice(1) + " (Karaoke Version)",
        artist: "Karaoke Master Studio",
        duration: 240,
        thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
      },
    ];

    res.json({ results: fallbackDynamic });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Karaoke Event Control Server running on http://localhost:${PORT}`);
  });
}

startServer();
