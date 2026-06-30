import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  MessageSquare, Send, Sparkles, AlertCircle 
} from "lucide-react";
import { Deadline, ChatMessage, CallState } from "../types";
import { 
  startMeditativeRingtone, stopMeditativeRingtone, 
  speakLioraText, stopLioraSpeech 
} from "../utils/audio";

interface CompanionCallProps {
  isOpen: boolean;
  onClose: () => void;
  callType: "incoming" | "outgoing";
  deadlines: Deadline[];
  onAddMessage: (msg: ChatMessage) => void;
  chatHistory: ChatMessage[];
  triggerLioraResponse: (text: string, isCall: boolean, overrideCallback?: (response: string) => void) => Promise<string>;
}

export default function CompanionCall({
  isOpen,
  onClose,
  callType,
  deadlines,
  onAddMessage,
  chatHistory,
  triggerLioraResponse,
}: CompanionCallProps) {
  const [callState, setCallState] = useState<CallState>({
    isActive: true,
    type: callType,
    speaker: true,
    mute: false,
    captions: "",
  });

  const [inputText, setInputText] = useState("");
  const [isLioraSpeaking, setIsLioraSpeaking] = useState(false);
  const [isLioraThinking, setIsLioraThinking] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const pulseTimerRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setMicActive(true);
        setTranscriptText("Liora is listening...");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text && text.trim()) {
          setTranscriptText(`You: "${text}"`);
          handleUserSpeech(text);
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setMicActive(false);
      };

      rec.onend = () => {
        setMicActive(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Handle playing ringtone or placing call
  useEffect(() => {
    if (isOpen) {
      setCallState({
        isActive: true,
        type: callType,
        speaker: true,
        mute: false,
        captions: "",
      });
      setIsLioraSpeaking(false);
      setIsLioraThinking(false);
      setTranscriptText("");

      if (callType === "incoming") {
        // Start playing meditative ringtone
        startMeditativeRingtone();
        setCallState(s => ({ ...s, captions: "Liora is reaching out for a calm deadline check-in..." }));
      } else {
        // Outgoing call - simulate connecting
        setCallState(s => ({ ...s, captions: "Connecting with Liora's space..." }));
        const t = setTimeout(() => {
          connectCall();
        }, 2000);
        return () => clearTimeout(t);
      }
    } else {
      stopMeditativeRingtone();
      stopLioraSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    }

    return () => {
      stopMeditativeRingtone();
      stopLioraSpeech();
    };
  }, [isOpen, callType]);

  // Connect the call and fetch Liora's initial spoken words
  const connectCall = async () => {
    stopMeditativeRingtone();
    setCallState(s => ({ ...s, type: "connected", captions: "Connecting call..." }));
    setIsLioraThinking(true);

    // Formulate a call opening prompt
    let initialPrompt = "I am answering your call. Please check in with me about my current deadlines and give me a calm, honest opening word.";
    if (callType === "incoming") {
      initialPrompt = "Thank you for answering. Please give me an honest, loving, and calm reminder about my upcoming high-urgency deadlines, and ask me how I am feeling right now.";
    }

    try {
      const response = await triggerLioraResponse(initialPrompt, true);
      setIsLioraThinking(false);
      speakLiora(response);
    } catch (err) {
      setIsLioraThinking(false);
      speakLiora("I am here with you now. Take a deep, gentle breath. Let's talk about whatever is weighing on your mind.");
    }
  };

  // Speak Liora's text aloud
  const speakLiora = (text: string) => {
    setCallState(s => ({ ...s, captions: text }));
    setIsLioraSpeaking(true);
    
    // Log response to companion chat history
    onAddMessage({
      id: Math.random().toString(),
      sender: "liora",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    speakLioraText(
      text,
      () => {
        setIsLioraSpeaking(true);
      },
      () => {
        setIsLioraSpeaking(false);
        // Automatically start listening if mic isn't muted
        if (!callState.mute && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        } else {
          setTranscriptText("Tap the microphone to speak, or select a quick reply below.");
        }
      }
    );
  };

  // Handle User voice/typed input
  const handleUserSpeech = async (text: string) => {
    if (isLioraThinking || isLioraSpeaking) return;

    // Log user message to chat history
    onAddMessage({
      id: Math.random().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setIsLioraThinking(true);
    setCallState(s => ({ ...s, captions: "..." }));
    setTranscriptText("");

    try {
      const response = await triggerLioraResponse(text, true);
      setIsLioraThinking(false);
      speakLiora(response);
    } catch (err) {
      setIsLioraThinking(false);
      speakLiora("I understand. Sometimes things get loud. Let's take a slow breath. Tell me more, I am here.");
    }
  };

  // Decline or Hangup call
  const handleHangup = () => {
    stopMeditativeRingtone();
    stopLioraSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    setCallState(s => ({ ...s, type: "idle", isActive: false }));
    onClose();
  };

  // Answer incoming call
  const handleAnswer = () => {
    connectCall();
  };

  // Manual Mic toggle
  const toggleMute = () => {
    const nextMute = !callState.mute;
    setCallState(s => ({ ...s, mute: nextMute }));
    
    if (nextMute) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      setMicActive(false);
      setTranscriptText("Microphone muted. You can type or use quick replies.");
    } else {
      if (!isLioraSpeaking && !isLioraThinking && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const msg = inputText.trim();
    setInputText("");
    handleUserSpeech(msg);
  };

  // Pre-configured calm conversational nodes/replies
  const quickReplies = [
    { text: "I'm feeling very overwhelmed with deadlines.", label: "Overwhelmed" },
    { text: "I don't know where to start today.", label: "Where to start?" },
    { text: "Can we review my list of priorities?", label: "Review list" },
    { text: "Let's do a quick breathing exercise.", label: "Breathe" },
    { text: "I just needed a calm voice to keep me company.", label: "Just company" },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        id="liora-call-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col justify-between bg-white/95 backdrop-blur-md text-[#1E272E] p-6 md:p-10 font-sans border-8 border-[#6C5CE7]/10"
      >
        {/* Call Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold tracking-wider text-[#636E72] uppercase">
              {callState.type === "incoming" && "Incoming Alert Connection"}
              {callState.type === "outgoing" && "Placing Calm Call"}
              {callState.type === "connected" && "Mindful Session Connected"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-white px-3.5 py-2 rounded-full border border-[#DFE6E9] text-[#6C5CE7] font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Honest & Calm Companion</span>
          </div>
        </div>

        {/* Central Audio / Avatar Space */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          
          {/* Circular Voice Waveform / Avatar */}
          <div className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80">
            
            {/* Pulsing Backing Glow */}
            <AnimatePresence>
              {callState.type === "incoming" && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl"
                />
              )}
              {isLioraSpeaking && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-[#6C5CE7]/20 blur-2xl"
                />
              )}
              {isLioraThinking && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-sky-500/20 blur-2xl"
                />
              )}
            </AnimatePresence>

            {/* Concentric rings while Ringing */}
            {callState.type === "incoming" && (
              <>
                <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping" />
                <div className="absolute inset-8 rounded-full border border-amber-500/35 animate-pulse" />
              </>
            )}

            {/* Glowing animated orb representing Liora */}
            <motion.div 
              animate={{ 
                scale: isLioraSpeaking ? [1, 1.08, 0.98, 1.05, 1] : isLioraThinking ? [1, 1.03, 1] : 1,
                borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: isLioraSpeaking ? 2.5 : 6, 
                ease: "easeInOut" 
              }}
              className={`w-48 h-48 md:w-56 md:h-56 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-700 ${
                callState.type === "incoming" 
                  ? "bg-gradient-to-tr from-amber-500/10 to-white border-2 border-amber-400" 
                  : isLioraSpeaking 
                    ? "bg-gradient-to-tr from-[#6C5CE7]/10 to-white border-2 border-[#6C5CE7]"
                    : isLioraThinking
                      ? "bg-gradient-to-tr from-sky-500/10 to-white border-2 border-sky-400"
                      : "bg-gradient-to-tr from-gray-50 to-white border-2 border-gray-300"
              }`}
            >
              <div className="p-4 z-10">
                <h2 className="text-2xl font-bold tracking-tight text-[#1E272E]">Liora</h2>
                <p className="text-xs text-[#636E72] mt-1 font-bold uppercase tracking-widest">
                  {callState.type === "incoming" && "Alert Connection..."}
                  {callState.type === "outgoing" && "Ringing..."}
                  {isLioraThinking && "Thinking..."}
                  {isLioraSpeaking && "Speaking..."}
                  {callState.type === "connected" && !isLioraSpeaking && !isLioraThinking && "Listening..."}
                </p>
              </div>
            </motion.div>

            {/* Tiny microphone bubble */}
            {micActive && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-6 right-6 bg-emerald-500 text-white p-2.5 rounded-full shadow-lg border-2 border-white animate-pulse"
              >
                <Mic className="w-5 h-5" />
              </motion.div>
            )}
          </div>

          {/* Subtitles & Captions Block (What Liora says) */}
          <div className="max-w-2xl w-full text-center mt-6 px-4">
            <p className="text-lg md:text-xl font-bold text-[#1E272E] leading-relaxed min-h-16">
              {callState.captions || "..."}
            </p>
            
            {/* Mic Transcript State */}
            <p className="text-xs font-bold text-[#636E72] mt-4 uppercase tracking-wider h-4">
              {transcriptText}
            </p>
          </div>
        </div>

        {/* Interactive Quick Replies Node */}
        {callState.type === "connected" && !isLioraThinking && (
          <div className="max-w-3xl w-full mx-auto mb-6">
            <p className="text-xs font-bold text-[#636E72] mb-2 text-center uppercase tracking-wider">Suggested Responses</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUserSpeech(qr.text)}
                  disabled={isLioraSpeaking || isLioraThinking}
                  className="text-[10px] font-bold uppercase tracking-widest bg-white hover:bg-gray-50 border border-[#DFE6E9] text-[#2D3436] disabled:opacity-50 disabled:pointer-events-none rounded-full px-4 py-2 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Input fallback */}
        {callState.type === "connected" && (
          <form onSubmit={handleSendText} className="max-w-lg w-full mx-auto mb-6 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type a message to Liora..."
              disabled={isLioraThinking || isLioraSpeaking}
              className="flex-1 bg-white border border-[#DFE6E9] rounded-full px-4 py-2.5 text-sm text-[#2D3436] placeholder-[#A4B0BE] focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] disabled:opacity-50 shadow-sm"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || isLioraThinking || isLioraSpeaking}
              className="bg-[#6C5CE7] hover:bg-[#5b4bc4] disabled:opacity-50 text-white rounded-full p-3 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Call Footer Control Bar */}
        <div className="flex items-center justify-center gap-6 mt-2 max-w-md w-full mx-auto">
          
          {/* Mute Mic Button */}
          {callState.type === "connected" && (
            <button 
              onClick={toggleMute}
              className={`p-4 rounded-full border transition-all ${
                callState.mute 
                  ? "bg-red-50 border-red-300 text-red-500 hover:bg-red-100" 
                  : "bg-[#F1F2F6] border border-[#DFE6E9] text-[#636E72] hover:bg-[#E9ECEF]"
              }`}
              title={callState.mute ? "Unmute Microphone" : "Mute Microphone"}
            >
              {callState.mute ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          )}

          {/* Core Call Action Button */}
          {callState.type === "incoming" ? (
            <div className="flex items-center gap-8">
              <button 
                onClick={handleHangup}
                className="flex items-center justify-center p-5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md border border-red-400/20 transition transform hover:scale-105"
                title="Decline Check-in"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <button 
                onClick={handleAnswer}
                className="flex items-center justify-center p-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-md border border-emerald-400/20 transition transform hover:scale-105 animate-bounce"
                title="Answer Check-in"
              >
                <Phone className="w-8 h-8" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleHangup}
              className="flex items-center justify-center p-5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md border border-red-400/20 transition transform hover:scale-105"
              title="Hang up"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          )}

          {/* Toggle speech voice synthesis feedback */}
          {callState.type === "connected" && (
            <button 
              onClick={() => {
                // If speaking, stop it
                if (isLioraSpeaking) {
                  stopLioraSpeech();
                  setIsLioraSpeaking(false);
                } else {
                  // Speak current caption again
                  speakLiora(callState.captions);
                }
              }}
              className="p-4 rounded-full bg-[#F1F2F6] border border-[#DFE6E9] text-[#636E72] hover:bg-[#E9ECEF] transition"
              title="Re-read / Stop Voice"
            >
              {isLioraSpeaking ? <VolumeX className="w-6 h-6 text-[#6C5CE7]" /> : <Volume2 className="w-6 h-6" />}
            </button>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
