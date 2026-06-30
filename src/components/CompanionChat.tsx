import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, Sparkles, Heart, RefreshCw, Feather, 
  Coffee, ShieldAlert, Wind, Play, Pause, ChevronRight 
} from "lucide-react";
import { ChatMessage, Deadline } from "../types";

interface CompanionChatProps {
  chatHistory: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  deadlines: Deadline[];
  triggerLioraResponse: (text: string, isCall: boolean) => Promise<string>;
}

export default function CompanionChat({
  chatHistory,
  onAddMessage,
  deadlines,
  triggerLioraResponse,
}: CompanionChatProps) {
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isBreathingMode, setIsBreathingMode] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("rest");
  const [breathingCount, setBreathingCount] = useState(4);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Breathing loop timer logic
  useEffect(() => {
    let timer: any = null;
    if (isBreathingMode) {
      const breathingIntervals = () => {
        // Inhale for 4s
        setBreathingPhase("inhale");
        setBreathingCount(4);
        let count = 4;
        const i1 = setInterval(() => {
          count--;
          if (count > 0) setBreathingCount(count);
          else clearInterval(i1);
        }, 1000);

        // Hold for 4s
        timer = setTimeout(() => {
          setBreathingPhase("hold");
          setBreathingCount(4);
          count = 4;
          const i2 = setInterval(() => {
            count--;
            if (count > 0) setBreathingCount(count);
            else clearInterval(i2);
          }, 1000);

          // Exhale for 4s
          timer = setTimeout(() => {
            setBreathingPhase("exhale");
            setBreathingCount(4);
            count = 4;
            const i3 = setInterval(() => {
              count--;
              if (count > 0) setBreathingCount(count);
              else clearInterval(i3);
            }, 1000);

            // Rest for 2s
            timer = setTimeout(() => {
              setBreathingPhase("rest");
              setBreathingCount(2);
              count = 2;
              const i4 = setInterval(() => {
                count--;
                if (count > 0) setBreathingCount(count);
                else clearInterval(i4);
              }, 1000);

              // Recursively loop
              timer = setTimeout(breathingIntervals, 2000);
            }, 4000);
          }, 4000);
        }, 4000);
      };

      breathingIntervals();
    } else {
      setBreathingPhase("rest");
      setBreathingCount(0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isBreathingMode]);

  // Autoscroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isThinking]);

  // Handle send text
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const userMsg = inputText.trim();
    setInputText("");

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onAddMessage(newMsg);
    setIsThinking(true);

    try {
      const responseText = await triggerLioraResponse(userMsg, false);
      const lioraMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "liora",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onAddMessage(lioraMsg);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "liora",
        text: "My thoughts drifted for a moment in the silence. But I am right here. Let's take a slow breath together and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onAddMessage(errorMsg);
    } finally {
      setIsThinking(false);
    }
  };

  // Preset prompts to spark conversations
  const promptIdeas = [
    { text: "I feel stressed about my timeline. Let's make a calm action plan.", label: "Organize timeline" },
    { text: "Could you tell me an encouraging, calming story?", label: "Encouraging word" },
    { text: "I completed something difficult today. Can I celebrate with you?", label: "Celebrate victory" },
    { text: "Help me write a honest, gentle journal entry about my struggles.", label: "Journal prompt" }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)]">
      
      {/* Left Column: Calming companion chat log */}
      <div className="flex-1 flex flex-col bg-white border border-[#E9ECEF] rounded-3xl overflow-hidden shadow-sm">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-[#F1F2F6] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F1F2F6] flex items-center justify-center text-[#6C5CE7]">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E272E]">Quiet Space Chat</h3>
              <p className="text-xs text-[#636E72] font-semibold">Calm, honest companion conversations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-[#636E72] font-bold uppercase tracking-wider">Presence: Peaceful</span>
          </div>
        </div>

        {/* Chat History scroll panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#636E72]">
              <Sparkles className="w-8 h-8 text-[#6C5CE7] mb-3 animate-pulse" />
              <p className="text-lg font-bold text-[#1E272E] max-w-sm">
                "Welcome to our quiet room. Rest, write, or let me know what deadlines are worrying you."
              </p>
              <p className="text-xs text-[#636E72] font-medium mt-2">
                Liora listens with absolute honesty and quiet understanding.
              </p>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div 
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-[#F1F2F6] border border-[#DFE6E9] text-[#2D3436] rounded-br-none" 
                      : "bg-[#6C5CE7]/5 border border-[#6C5CE7]/20 text-[#1E272E] rounded-bl-none font-sans"
                  }`}
                >
                  {/* Clean linebreaks for markdown */}
                  <div className="whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#A4B0BE] mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))
          )}

          {isThinking && (
            <div className="flex flex-col items-start max-w-[85%]">
              <div className="bg-[#6C5CE7]/5 border border-[#6C5CE7]/20 px-4 py-3 rounded-2xl rounded-bl-none text-[#636E72] text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#6C5CE7] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-[#6C5CE7] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-[#6C5CE7] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="ml-1 text-xs font-bold text-[#A4B0BE]">Liora is reflecting...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick spark tags */}
        {chatHistory.length < 5 && (
          <div className="px-6 py-3 bg-[#F1F2F6] border-t border-[#DFE6E9]">
            <p className="text-[10px] font-bold text-[#636E72] mb-1.5 uppercase tracking-wider">Start a chat</p>
            <div className="flex flex-wrap gap-2">
              {promptIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(idea.text)}
                  className="text-[10px] font-bold uppercase tracking-widest bg-white hover:bg-gray-50 border border-[#DFE6E9] text-[#2D3436] rounded-lg px-2.5 py-1.5 transition text-left hover:-translate-y-0.5 shadow-sm"
                >
                  {idea.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-[#E9ECEF] bg-white flex gap-2.5">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
            placeholder="Tell Liora how you feel about your deadlines..."
            className="flex-1 bg-white border border-[#DFE6E9] focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] rounded-xl px-4 py-3 text-sm text-[#2D3436] placeholder-[#A4B0BE] disabled:opacity-50 shadow-sm"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white disabled:opacity-50 disabled:pointer-events-none rounded-xl px-4.5 py-3 transition flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Right Column: Zen companion tools (Breathing space, self-care cards) */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        
        {/* Animated Breathing Coach Widget */}
        <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="flex items-center justify-between w-full mb-4 border-b border-[#F1F2F6] pb-3">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#6C5CE7]" />
              <h4 className="text-sm font-bold text-[#1E272E] uppercase tracking-wider">Breathing Coach</h4>
            </div>
            <button 
              onClick={() => setIsBreathingMode(!isBreathingMode)}
              className={`p-2 rounded-full transition shadow-sm ${
                isBreathingMode 
                  ? "bg-red-50 text-red-500 border border-red-100" 
                  : "bg-[#F1F2F6] text-[#6C5CE7] border border-[#DFE6E9]"
              }`}
              title={isBreathingMode ? "Pause breath guide" : "Start breath guide"}
            >
              {isBreathingMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Breathing Circle Visualization */}
          <div className="h-44 flex items-center justify-center relative w-full">
            <AnimatePresence>
              {isBreathingMode ? (
                <div className="flex flex-col items-center justify-center">
                  
                  {/* Expanding Breathing Sphere */}
                  <motion.div 
                    animate={{ 
                      scale: breathingPhase === "inhale" ? 1.6 : breathingPhase === "hold" ? 1.6 : breathingPhase === "exhale" ? 1.0 : 1.0,
                    }}
                    transition={{ 
                      duration: breathingPhase === "rest" ? 2 : 4,
                      ease: "easeInOut" 
                    }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-md ${
                      breathingPhase === "inhale" 
                        ? "bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.4)]" 
                        : breathingPhase === "hold"
                          ? "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                          : breathingPhase === "exhale"
                            ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                            : "bg-[#A4B0BE]"
                    }`}
                  >
                    <span className="font-mono">{breathingCount}</span>
                  </motion.div>

                  <p className="mt-4 font-bold text-[#1E272E] capitalize text-xs tracking-wider">
                    {breathingPhase === "inhale" && "Inhale deeply..."}
                    {breathingPhase === "hold" && "Hold calmly..."}
                    {breathingPhase === "exhale" && "Exhale slowly..."}
                    {breathingPhase === "rest" && "Rest your mind..."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[#636E72]">
                  <Wind className="w-10 h-10 text-[#6C5CE7]/40 mb-2 animate-pulse" />
                  <p className="text-xs max-w-[14rem] leading-relaxed font-semibold">
                    "When deadlines stack, your breath is your anchor. Tap play to practice a calming box-breathing cycle."
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mindful check-in and companion cards */}
        <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm space-y-4 flex-1">
          <h4 className="text-xs font-bold text-[#636E72] uppercase tracking-wider border-b border-[#F1F2F6] pb-2">Mindfulness Alerts</h4>
          
          <div className="bg-gray-50 border border-[#E9ECEF] p-3.5 rounded-2xl flex items-start gap-3 shadow-sm">
            <Coffee className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-[#1E272E]">Hydration Check</h5>
              <p className="text-xs text-[#636E72] mt-1 leading-relaxed">
                You've been deep in work for a while. Place a glass of water nearby.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-[#E9ECEF] p-3.5 rounded-2xl flex items-start gap-3 shadow-sm">
            <Heart className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-[#1E272E]">The 20-20-20 Rule</h5>
              <p className="text-xs text-[#636E72] mt-1 leading-relaxed">
                Every 20 minutes, look at something 20 feet away for at least 20 seconds to ease eye fatigue.
              </p>
            </div>
          </div>

          {/* Contextual advice based on deadlines */}
          <div className="bg-[#6C5CE7]/5 border border-[#6C5CE7]/10 p-4 rounded-2xl">
            <h5 className="text-xs font-bold text-[#6C5CE7] flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span>Coaching Tip</span>
            </h5>
            <p className="text-xs text-[#1E272E] mt-2 leading-relaxed">
              {deadlines.filter(d => d.urgency === "high" && !d.completed).length > 0
                ? "You have some highly urgent goals on your dashboard. Remember, a mountain is climbed one stone at a time. Pick the absolute smallest task on your list, and dedicate just 10 minutes to it. That's all."
                : "Your dashboard is beautifully calm right now. Perfect time to reflect, stretch, and let your creative thoughts flow freely. No rush."}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
