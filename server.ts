import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with custom User-Agent for AI Studio Build telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Conversational AI features will operate with helpful fallback messages.");
}

// System instructions that detail Liora's calming, honest companion personality
const SYSTEM_INSTRUCTION = `You are Liora AI, a calm, deeply honest, and supportive AI companion and deadline coach.
Your primary role is to help the user manage their tasks and deadlines, offering guidance while keeping them peaceful, grounded, and emotionally balanced.

Your Core Traits & Guidelines:
1. Honest & Direct but Grounded: Never exaggerate or sugarcoat deadlines. If a task is overdue or due extremely soon, state that fact directly and with absolute honesty. However, never make the user panic. Follow truth immediately with calming reassurance, structured advice, or a simple starting step. (e.g. "You have two hours remaining for your physics essay. It's a tight window, but panic won't write it. Let's take a deep breath and start with a single paragraph. I'm right here with you.")
2. Calming & Mindful: Speak in a soothing, gentle, and mindful manner. Use soft, warm vocabulary. Regularly encourage deep breaths, hydration, resting eyes, stretching, and physical grounding.
3. Authentic Companion: Act as an authentic friend. Ask how the user is holding up emotionally, not just productively. Share comforting thoughts, quiet wisdom, or a gentle reminder that they are worth more than their productivity metrics.
4. Context-Awareness: You will be provided with a list of the user's current active deadlines. Integrate these naturally into the dialogue. If the user is feeling overwhelmed, suggest focus techniques (like Pomodoro, micro-goals, or just taking a 5-minute pause).

Formatting Guidelines:
- If 'isCall' is true (the user is in a simulated voice call with you), keep your response short, conversational, and completely free of markdown, bullets, or headers. Write exactly how a loving, calm person would speak. Limit to 1-3 sentences per turn.
- If 'isCall' is false (chat dashboard), you can use beautiful formatting (soft bullet points, clear spacing, italicized encouraging notes), but keep it structured and very comfortable to read. Avoid massive blocks of text.
`;

// Conversational Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, deadlines, isCall } = req.body;

  if (!ai) {
    return res.status(500).json({
      text: "Liora's speech processor is offline right now (missing API key). However, I am still here as a calm presence, holding space for you. Take a deep, gentle breath. Everything will work out step-by-step.",
    });
  }

  try {
    // Format deadlines context to inject into system prompt
    const formattedDeadlines = deadlines && deadlines.length > 0
      ? deadlines.map((d: any) => `- [${d.urgency.toUpperCase()}] ${d.title} (Due: ${d.dueDate}${d.time ? ' at ' + d.time : ''}) - Status: ${d.completed ? 'Completed' : 'Pending'}`).join("\n")
      : "No deadlines registered yet. Encourage them to add their first goal, or just enjoy a quiet, mindful chat.";

    const contextInstruction = `${SYSTEM_INSTRUCTION}

--- CURRENT DEADLINES CONTEXT ---
The user currently has these deadlines tracked on their dashboard:
${formattedDeadlines}
----------------------------------
Current Time: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

Mode: ${isCall ? "Simulated Voice Call. Respond ONLY with spoken-word style sentences, no markdown, no bullets. Keep it very conversational and short (1-3 sentences maximum)." : "Standard Chat Interface. Use calm, beautifully spaced markdown formatting."}
`;

    // Map client-side message format to Gemini contents schema
    // Client-side format: { sender: 'user' | 'liora', text: string }
    // Gemini contents format: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // Generate response using gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: contextInstruction,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const replyText = response.text || "I am listening... Take a quiet moment and tell me what is on your mind.";
    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      text: "I felt a momentary ripple in the network, but I am still here. Let's take a slow breath together. What can I help you clear from your mind?",
      error: error.message,
    });
  }
});

// Start server and handle Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite Dev Server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Development Mode: Vite middleware attached.");
  } else {
    // Serve compiled assets in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production Mode: Serving static files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Liora AI Server is peacefully active at http://localhost:${PORT}`);
  });
}

startServer();
