import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, MessageSquare, Moon, Compass, Bell, 
  Coffee, Heart, Sparkles, PhoneCall, CheckCircle, HelpCircle, X
} from "lucide-react";
import { Deadline, ChatMessage, AppView } from "./types";
import Dashboard from "./components/Dashboard";
import CompanionChat from "./components/CompanionChat";
import CompanionCall from "./components/CompanionCall";
import { playSereneNotification } from "./utils/audio";

// Preset initial deadlines for visual elegance on first boot
const DEFAULT_DEADLINES: Deadline[] = [
  {
    id: "d-1",
    title: "History Research Essay Submission",
    description: "Focus on primary sources. Liora says: Pace yourself. Honest truth: a high-quality paper requires quiet hours, not a panicked midnight sprint.",
    urgency: "high",
    category: "study",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // tomorrow
    time: "18:00",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "d-2",
    title: "Renew Personal Health Insurance Policy",
    description: "Confirm details online. Liora says: Mindful reality - this takes only 15 minutes of administrative focus. Let's complete it and clear your mental workspace.",
    urgency: "medium",
    category: "health",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 3 days out
    time: "12:00",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "d-3",
    title: "Mindful Desk & Study Space Declutter",
    description: "Wipe down electronics, archive completed notes. Liora says: A calm outer environment nourishes a peaceful, clear inner space.",
    urgency: "low",
    category: "personal",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days out
    time: "10:00",
    completed: false,
    createdAt: new Date().toISOString(),
  }
];

// Preset greeting log for companion chat
const DEFAULT_CHAT: ChatMessage[] = [
  {
    id: "init-greet",
    sender: "liora",
    text: "Hello, companion. I am Liora. I am here to hold a calm space for your days and keep your deadlines in check with honest clarity. How is your mind feeling with your active priorities right now?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }
];

export default function App() {
  const [view, setView] = useState<AppView>("dashboard");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Simulated Voice Call Modals
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<"incoming" | "outgoing">("outgoing");

  // Notification Banner states
  const [alertBanner, setAlertBanner] = useState<{ show: boolean; title: string } | null>(null);

  // Load state on mount
  useEffect(() => {
    const savedDeadlines = localStorage.getItem("liora_deadlines");
    const savedChat = localStorage.getItem("liora_chat");

    if (savedDeadlines) {
      setDeadlines(JSON.parse(savedDeadlines));
    } else {
      setDeadlines(DEFAULT_DEADLINES);
      localStorage.setItem("liora_deadlines", JSON.stringify(DEFAULT_DEADLINES));
    }

    if (savedChat) {
      setChatHistory(JSON.parse(savedChat));
    } else {
      setChatHistory(DEFAULT_CHAT);
      localStorage.setItem("liora_chat", JSON.stringify(DEFAULT_CHAT));
    }
  }, []);

  // Check for upcoming critical deadlines to trigger a Liora Voice Call Banner
  useEffect(() => {
    if (deadlines.length > 0) {
      const activeHighUrgency = deadlines.find(d => !d.completed && d.urgency === "high");
      if (activeHighUrgency) {
        // Calculate diff days
        const due = new Date(`${activeHighUrgency.dueDate}T${activeHighUrgency.time || "23:59"}`);
        const diffMs = due.getTime() - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // If due tomorrow or today, show call invite banner!
        if (diffDays <= 1 && !activeHighUrgency.notified) {
          setAlertBanner({
            show: true,
            title: activeHighUrgency.title
          });
          playSereneNotification();
        }
      }
    }
  }, [deadlines]);

  // Save updates helper
  const saveDeadlines = (updated: Deadline[]) => {
    setDeadlines(updated);
    localStorage.setItem("liora_deadlines", JSON.stringify(updated));
  };

  const saveChat = (updated: ChatMessage[]) => {
    setChatHistory(updated);
    localStorage.setItem("liora_chat", JSON.stringify(updated));
  };

  // Add message helper
  const addChatMessage = (msg: ChatMessage) => {
    const nextChat = [...chatHistory, msg];
    saveChat(nextChat);
  };

  // Create a new deadline
  const handleAddDeadline = (newD: Omit<Deadline, "id" | "createdAt" | "completed">) => {
    const created: Deadline = {
      ...newD,
      id: "d-" + Math.random().toString(36).substr(2, 9),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    saveDeadlines([...deadlines, created]);
    playSereneNotification();
  };

  // Toggle complete state (plays Solfeggio notification on success)
  const handleToggleComplete = (id: string) => {
    const updated = deadlines.map(d => {
      if (d.id === id) {
        const nextState = !d.completed;
        if (nextState) {
          playSereneNotification();
        }
        return { ...d, completed: nextState };
      }
      return d;
    });
    saveDeadlines(updated);
  };

  // Delete deadline
  const handleDeleteDeadline = (id: string) => {
    const updated = deadlines.filter(d => d.id !== id);
    saveDeadlines(updated);
  };

  // Snooze deadline - adds specified hours to the target due datetime
  const handleSnoozeDeadline = (id: string, hours: number) => {
    const updated = deadlines.map(d => {
      if (d.id === id) {
        const currentDateTime = new Date(`${d.dueDate}T${d.time || "12:00"}`);
        currentDateTime.setHours(currentDateTime.getHours() + hours);
        
        return {
          ...d,
          dueDate: currentDateTime.toISOString().split("T")[0],
          time: currentDateTime.toTimeString().split(" ")[0].slice(0, 5),
          notified: false // allow alert again if snoozed
        };
      }
      return d;
    });
    saveDeadlines(updated);
    playSereneNotification();
  };

  // Launch simulated voice check-in
  const handleTriggerCall = (type: "incoming" | "outgoing") => {
    setCallType(type);
    setIsCallOpen(true);
    if (alertBanner) {
      // Mark high urgency deadline notified state
      const updated = deadlines.map(d => {
        if (d.title === alertBanner.title) {
          return { ...d, notified: true };
        }
        return d;
      });
      saveDeadlines(updated);
      setAlertBanner(null);
    }
  };

  // Trigger discuss deadline context directly in chat view
  const handleDiscussDeadlineInChat = (title: string) => {
    setView("companion");
    const userPrompt = `I would like to do an honest check-in regarding my deadline: "${title}". Can you give me a calm action plan or word of advice?`;
    setInputAndSendInChat(userPrompt);
  };

  const setInputAndSendInChat = async (promptText: string) => {
    // Add user message to log
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...chatHistory, userMsg];
    saveChat(updatedHistory);

    // Call server API
    try {
      const response = await triggerLioraResponse(promptText, false, updatedHistory);
      const lioraMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "liora",
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      saveChat([...updatedHistory, lioraMsg]);
    } catch (err) {
      console.error(err);
    }
  };

  // Call the Gemini Backend proxy `/api/chat`
  const triggerLioraResponse = async (
    prompt: string, 
    isCall: boolean, 
    customHistory?: ChatMessage[]
  ): Promise<string> => {
    const historyToSend = customHistory || chatHistory;
    
    // Format history to match backend api expectations
    const payloadMessages = [...historyToSend];
    if (!customHistory) {
      // If we didn't save the latest user message to state yet, append it temporarily
      payloadMessages.push({
        id: "temp",
        sender: "user",
        text: prompt,
        timestamp: "",
      });
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: payloadMessages,
        deadlines: deadlines,
        isCall: isCall,
      }),
    });

    if (!response.ok) {
      throw new Error("Chat server error");
    }

    const data = await response.json();
    return data.text;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3436] flex flex-col justify-between selection:bg-[#6C5CE7]/10 selection:text-[#6C5CE7]">
      
      {/* Top Navigation Header */}
      <header className="border-b border-[#E9ECEF] bg-white sticky top-0 z-40 px-6 py-4.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6C5CE7] flex items-center justify-center text-white shadow-sm">
              <div className="w-4 h-4 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1E272E]">
                LIORA <span className="font-light text-[#A4B0BE]">AI</span>
              </h1>
              <p className="text-[10px] text-[#636E72] font-mono tracking-widest uppercase font-semibold">Honest Companion & Deadline Alerts</p>
            </div>
          </div>

          {/* Navigation view buttons */}
          <nav className="flex items-center bg-[#F1F2F6] border border-[#DFE6E9] rounded-2xl p-1">
            <button
              onClick={() => setView("dashboard")}
              className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                view === "dashboard" 
                  ? "bg-white text-[#6C5CE7] shadow-sm border border-[#E9ECEF]" 
                  : "text-[#636E72] hover:text-[#1E272E]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setView("companion")}
              className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                view === "companion" 
                  ? "bg-white text-[#6C5CE7] shadow-sm border border-[#E9ECEF]" 
                  : "text-[#636E72] hover:text-[#1E272E]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Companion Chat</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:py-10 space-y-6">
        
        {/* Floating Urgency Check-in alert banner (Liora calls user) */}
        <AnimatePresence>
          {alertBanner?.show && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-red-50 border border-red-200 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-red-100 rounded-2xl text-red-600 shadow-sm">
                  <PhoneCall className="w-4.5 h-4.5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Mindful Call Invitation</h4>
                  <p className="text-sm text-[#1E272E] mt-0.5">
                    Liora suggests a warm voice check-in about your approaching deadline: <strong className="font-bold text-red-700">"{alertBanner.title}"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setAlertBanner(null)}
                  className="p-2.5 hover:bg-red-100/50 text-[#636E72] hover:text-[#1E272E] rounded-xl transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTriggerCall("incoming")}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-bold text-xs px-5 py-3 rounded-2xl transition shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Answer Call</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Switcher content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === "dashboard" ? (
              <Dashboard 
                deadlines={deadlines}
                onAddDeadline={handleAddDeadline}
                onToggleComplete={handleToggleComplete}
                onDeleteDeadline={handleDeleteDeadline}
                onSnoozeDeadline={handleSnoozeDeadline}
                onTriggerCall={handleTriggerCall}
                onDiscussDeadlineInChat={handleDiscussDeadlineInChat}
              />
            ) : (
              <CompanionChat 
                chatHistory={chatHistory}
                onAddMessage={addChatMessage}
                deadlines={deadlines}
                triggerLioraResponse={(text, isCall) => triggerLioraResponse(text, isCall)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Simulated voice session overlay */}
      <CompanionCall 
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        callType={callType}
        deadlines={deadlines}
        chatHistory={chatHistory}
        onAddMessage={addChatMessage}
        triggerLioraResponse={(text, isCall) => triggerLioraResponse(text, isCall)}
      />

      {/* Ambient footer */}
      <footer className="bg-white border-t border-[#E9ECEF] py-5 text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-[#A4B0BE] uppercase tracking-[0.25em]">Honesty • Clarity • Companionship • v2.4.0</p>
          <div className="flex items-center gap-4 text-[#889296] font-mono text-[9px] uppercase tracking-wider font-semibold">
            <span>Solfeggio 528Hz tuning</span>
            <span>•</span>
            <span>432Hz voice check-ins</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
