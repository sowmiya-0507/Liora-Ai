export interface Deadline {
  id: string;
  title: string;
  description: string;
  urgency: "low" | "medium" | "high";
  category: "study" | "work" | "personal" | "health" | "other";
  dueDate: string; // YYYY-MM-DD
  time?: string; // HH:MM
  completed: boolean;
  createdAt: string;
  notified?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "liora";
  text: string;
  timestamp: string;
}

export type AppView = "dashboard" | "companion" | "analytics";

export interface CallState {
  isActive: boolean;
  type: "incoming" | "outgoing" | "connected" | "idle";
  speaker: boolean; // speaker mode toggle
  mute: boolean; // mic mute toggle
  captions: string; // current live subtitle text
}
