/**
 * Meditative Web Audio API synthesizer for Liora AI.
 * Plays serene frequency-based rings and alerts without external asset dependencies.
 */

let audioCtx: AudioContext | null = null;
let ringInterval: any = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Solfeggio 528Hz (Transformation & Miracles) single notification chime.
 */
export function playSereneNotification() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    // 528Hz tuning
    osc.frequency.setValueAtTime(528, now);
    osc.frequency.exponentialRampToValueAtTime(396, now + 1.2);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 1.3);
  } catch (err) {
    console.warn("Audio Context block by browser autoplay policy:", err);
  }
}

/**
 * Meditative incoming call ringing sequence (432Hz soft cosmic interval).
 */
export function startMeditativeRingtone() {
  try {
    const ctx = getAudioContext();
    
    const playRingInstance = () => {
      const now = ctx.currentTime;
      
      // Fundamental warm frequency (432Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(432, now);
      osc1.frequency.exponentialRampToValueAtTime(324, now + 1.8);
      
      gain1.gain.setValueAtTime(0.1, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Meditative octave fifth chime (648Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(648, now + 0.25);
      osc2.frequency.exponentialRampToValueAtTime(486, now + 1.5);
      
      gain2.gain.setValueAtTime(0.06, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 2.0);
      osc2.start(now + 0.25);
      osc2.stop(now + 2.0);
    };

    if (ringInterval) {
      clearInterval(ringInterval);
    }
    
    playRingInstance();
    ringInterval = setInterval(playRingInstance, 3000);
  } catch (err) {
    console.warn("Autoplay block on ringtone:", err);
  }
}

export function stopMeditativeRingtone() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

/**
 * Uses Web Speech Synthesis to verbalize a response in a calm, soothing voice.
 */
export function speakLioraText(text: string, onStart?: () => void, onEnd?: () => void) {
  try {
    // Cancel any active speech first
    window.speechSynthesis.cancel();
    
    // Strip markdown characters so speech synthesis doesn't try to spell them
    const cleanText = text
      .replace(/[*_#`~\[\]()]/g, "")
      .replace(/-\s+/g, " ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    // Select a pleasant, soft English voice
    const calmVoice = voices.find(v => 
      v.lang.startsWith("en") && 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Hazel") || v.name.includes("Karen"))
    ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    
    if (calmVoice) {
      utterance.voice = calmVoice;
    }
    
    utterance.pitch = 1.05; // Slightly warmer pitch
    utterance.rate = 0.92;  // Peaceful, slightly slower tempo
    
    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speech synthesis failed:", err);
    if (onEnd) onEnd();
  }
}

/**
 * Stop any running speech synthesis.
 */
export function stopLioraSpeech() {
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.error(err);
  }
}
