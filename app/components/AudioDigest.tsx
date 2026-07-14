"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Sparkles, Volume2, RotateCcw, FastForward, SlidersHorizontal, Loader2, AlertCircle } from "lucide-react";

interface AudioDigestProps {
  userInterests: string[];
  preferredGenre?: string | null;
}

export default function AudioDigest({ userInterests, preferredGenre }: AudioDigestProps) {
  const [digest, setDigest] = useState<{ headline: string; narrative: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [playbackRate, setPlaybackRate] = useState<number>(1); // 1, 1.25, 1.5
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("1:30");

  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);

  // System Voice States
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [ttsAlert, setTtsAlert] = useState<string | null>(null);
  const [customFocus, setCustomFocus] = useState("");

  // AI Fact Compiler States
  const [factPrompt, setFactPrompt] = useState("");
  const [generatedFact, setGeneratedFact] = useState<{ title: string; category: string; content: string; readTime: string } | null>(null);
  const [displayedContent, setDisplayedContent] = useState("");
  const [isFactGenerating, setIsFactGenerating] = useState(false);
  const [isFactStreaming, setIsFactStreaming] = useState(false);
  const [isFactPlaying, setIsFactPlaying] = useState(false);
  const [factActiveSentenceIndex, setFactActiveSentenceIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // References for Synthesis & Timers
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const sentencesRef = useRef<string[]>([]);
  const factUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const factSentencesRef = useRef<string[]>([]);

  // Category Interests state inside the tab
  const categoriesList = ["World", "Tech", "Science", "Culture", "Politics", "Environment"];
  const [interests, setInterests] = useState<string[]>(
    userInterests.length > 0 ? userInterests : ["World", "Tech", "Science"]
  );

  // Check speech synthesis support and load voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSpeechSupported(true);

      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        // Filter to English voices
        const engVoices = allVoices.filter((v) => v.lang.startsWith("en"));
        setVoices(engVoices);

        if (engVoices.length > 0) {
          const preferred = engVoices.find(
            (v) =>
              v.name.includes("Google US English") ||
              v.name.includes("Natural") ||
              v.lang === "en-US"
          ) || engVoices[0];
          setSelectedVoiceName((prev) => prev || preferred.name);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    fetchDigest();

    return () => {
      stopNarrative();
      stopFactSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch the custom morning narrative using Gemini
  const fetchDigest = async () => {
    setLoading(true);
    setError(null);
    stopNarrative();

    try {
      const res = await fetch("/api/morning-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: interests, customFocus }),
      });
      if (!res.ok) throw new Error("Could not construct digest stream");
      const data = await res.json();
      setDigest(data);

      // Split the narrative into logical sentences for transcript tracking
      if (data.narrative) {
        const parsedSentences = data.narrative
          .match(/[^.!?]+[.!?]+(\s|$)/g)
          ?.map((s: string) => s.trim()) || [data.narrative];
        sentencesRef.current = parsedSentences;
        setActiveSentenceIndex(0);

        // Estimate length (approx 150 words-per-minute)
        const wordCount = data.narrative.split(" ").length;
        const totalSecs = Math.ceil((wordCount / 150) * 60);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setTotalTime(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    } catch (err: any) {
      setError("Briefing room is temporarily unreachable.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (category: string) => {
    let updated: string[];
    if (interests.includes(category)) {
      if (interests.length === 1) return; // Must have at least one interest
      updated = interests.filter((i) => i !== category);
    } else {
      updated = [...interests, category];
    }
    setInterests(updated);
  };

  const playNarrative = async () => {
    if (!digest) return;

    stopNarrative(); // Stop any active speech first
    stopFactSpeech(); // Stop fact speech if active
    setTtsAlert(null);
    startSystemSpeech();
  };

  const startSystemSpeech = () => {
    setIsPlaying(true);

    if (speechSupported) {
      window.speechSynthesis.cancel(); // Stop any pending speech

      // Determine starting index based on current progress
      const totalSentences = sentencesRef.current.length;
      const startIndex = Math.floor((progressRef.current / 100) * totalSentences);
      const remainingText = sentencesRef.current.slice(startIndex).join(" ");

      const utterance = new SpeechSynthesisUtterance(remainingText || digest!.narrative);
      utteranceRef.current = utterance;

      const preferredVoice = voices.find((v) => v.name === selectedVoiceName);
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = playbackRate;
      utterance.volume = 1;

      utterance.onboundary = (e) => {
        if (e.name === "sentence" || e.name === "word") {
          const charIndex = e.charIndex;
          let sumChars = 0;
          for (let i = startIndex; i < sentencesRef.current.length; i++) {
            sumChars += sentencesRef.current[i].length + 1;
            if (charIndex <= sumChars) {
              setActiveSentenceIndex(i);
              break;
            }
          }
        }
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        progressRef.current = 100;
        setActiveSentenceIndex(sentencesRef.current.length - 1);
        stopNarrative();
      };

      utterance.onerror = (err) => {
        console.warn("Speech Synthesis Error. Switching to simulated playback:", err);
        startSimulation();
      };

      window.speechSynthesis.speak(utterance);
      startSimulation(true);
    } else {
      startSimulation();
    }
  };

  // Stopped state
  const stopNarrative = () => {
    setIsPlaying(false);
    setIsFactPlaying(false);
    setFactActiveSentenceIndex(-1);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleResume = () => {
    if (speechSupported && window.speechSynthesis.paused) {
      setIsPlaying(true);
      window.speechSynthesis.resume();
      startSimulation(true);
    } else {
      playNarrative();
    }
  };

  // Pure or supportive timer simulator
  const startSimulation = (syncOnly = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const [totalMin, totalSec] = totalTime.split(":").map(Number);
    const totalDurationSecs = totalMin * 60 + totalSec;

    let currentSecs = Math.floor((progressRef.current / 100) * totalDurationSecs);

    timerRef.current = window.setInterval(() => {
      currentSecs += 1;
      const computedProgress = (currentSecs / totalDurationSecs) * 100;

      if (computedProgress >= 100) {
        setProgress(100);
        progressRef.current = 100;
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setProgress(computedProgress);
        progressRef.current = computedProgress;

        const curMin = Math.floor(currentSecs / 60);
        const curSec = currentSecs % 60;
        setCurrentTime(`${curMin}:${curSec < 10 ? "0" : ""}${curSec}`);

        // If not using real speech boundaries, simulate sentence progress
        if (!speechSupported || !syncOnly) {
          const sentenceIndex = Math.floor(
            (computedProgress / 100) * sentencesRef.current.length
          );
          setActiveSentenceIndex(Math.min(sentenceIndex, sentencesRef.current.length - 1));
        }
      }
    }, 1000 / playbackRate);
  };

  const handleRewind = () => {
    stopNarrative();
    stopFactSpeech();
    const newProgress = Math.max(0, progress - 10);
    setProgress(newProgress);
    progressRef.current = newProgress;

    const [totalMin, totalSec] = totalTime.split(":").map(Number);
    const totalDurationSecs = totalMin * 60 + totalSec;
    const currentSecs = Math.floor((newProgress / 100) * totalDurationSecs);
    const curMin = Math.floor(currentSecs / 60);
    const curSec = currentSecs % 60;
    setCurrentTime(`${curMin}:${curSec < 10 ? "0" : ""}${curSec}`);

    // Adjust sentence index
    const sentenceIndex = Math.floor((newProgress / 100) * sentencesRef.current.length);
    setActiveSentenceIndex(Math.min(sentenceIndex, sentencesRef.current.length - 1));
  };

  const handleFastForward = () => {
    stopNarrative();
    stopFactSpeech();
    const newProgress = Math.min(100, progress + 10);
    setProgress(newProgress);
    progressRef.current = newProgress;

    const [totalMin, totalSec] = totalTime.split(":").map(Number);
    const totalDurationSecs = totalMin * 60 + totalSec;
    const currentSecs = Math.floor((newProgress / 100) * totalDurationSecs);
    const curMin = Math.floor(currentSecs / 60);
    const curSec = currentSecs % 60;
    setCurrentTime(`${curMin}:${curSec < 10 ? "0" : ""}${curSec}`);

    // Adjust sentence index
    const sentenceIndex = Math.floor((newProgress / 100) * sentencesRef.current.length);
    setActiveSentenceIndex(Math.min(sentenceIndex, sentencesRef.current.length - 1));
  };

  const togglePlaybackRate = () => {
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else nextRate = 1;

    setPlaybackRate(nextRate);

    if (speechSupported && isPlaying) {
      stopNarrative();
      // Restart at current progress with new rate
      setTimeout(() => {
        playNarrative();
      }, 50);
    } else if (isPlaying) {
      // For simulated timer
      startSimulation();
    }
  };

  const getDynamicSuggestions = (): string[] => {
    if (!preferredGenre) {
      return [
        "Quantum Computing",
        "Deep Sea Discoveries",
        "The Library of Alexandria",
        "Voyager Space Probes",
      ];
    }

    const genre = preferredGenre.toLowerCase();
    switch (genre) {
      case "tech":
        return [
          "Quantum Computing",
          "Artificial Intelligence Ethics",
          "The Future of Virtual Reality",
          "Cryptographic Security Systems",
        ];
      case "science":
        return [
          "Voyager Space Probes",
          "The Mysteries of Dark Matter",
          "Gene Editing & CRISPR Technology",
          "Thermonuclear Fusion Energy",
        ];
      case "world":
        return [
          "Global Microchip Supply Chains",
          "Megacities of the 22nd Century",
          "Renewable Energy Transitions",
          "International Space Station Treaties",
        ];
      case "culture":
        return [
          "The Library of Alexandria",
          "Modernist Architectural Movements",
          "The Evolution of Digital Art",
          "Lost Languages of the Amazon",
        ];
      case "politics":
        return [
          "The Geopolitics of Rare Earth Minerals",
          "Democratic Voting Systems & Security",
          "Oceanic Territory Borders",
          "Space Exploration Treaties",
        ];
      case "environment":
        return [
          "Deep Sea Discoveries",
          "Abyssal Hydrothermal Vents",
          "De-extinction of Ice Age Species",
          "Re-wilding European Forests",
        ];
      default:
        return [
          "Quantum Computing",
          "Deep Sea Discoveries",
          "The Library of Alexandria",
          "Voyager Space Probes",
        ];
    }
  };

  const handleCompileFact = async (topic: string) => {
    if (!topic.trim()) return;
    setIsFactGenerating(true);
    setGeneratedFact(null);
    setDisplayedContent("");
    stopFactSpeech();

    try {
      const res = await fetch("/api/generate-fact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: topic }),
      });
      if (!res.ok) throw new Error("Failed to compile fact sheet");
      const data = await res.json();
      setGeneratedFact(data);
      setIsFactGenerating(false);

      // Start word-by-word streaming animation
      setIsFactStreaming(true);
      const content = data.content;
      const words = content.split(" ");
      let currentWordIndex = 0;
      let currentText = "";

      const interval = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
          setDisplayedContent(currentText);
          currentWordIndex++;
        } else {
          clearInterval(interval);
          setIsFactStreaming(false);
          // Split sentences for speech boundary tracking
          const parsed = content.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s: string) => s.trim()) || [content];
          factSentencesRef.current = parsed;
        }
      }, 35);
    } catch (err: any) {
      console.error(err);
      setIsFactGenerating(false);
      setTtsAlert("Failed to compile facts on that topic. Please try again.");
    }
  };

  const playFactSpeech = () => {
    if (!generatedFact) return;
    stopNarrative();
    stopFactSpeech();

    setIsFactPlaying(true);
    setFactActiveSentenceIndex(0);

    if (speechSupported) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(generatedFact.content);
      factUtteranceRef.current = utterance;

      const preferredVoice = voices.find((v) => v.name === selectedVoiceName);
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = playbackRate;
      utterance.volume = 1;

      utterance.onboundary = (e) => {
        if (e.name === "sentence" || e.name === "word") {
          const charIndex = e.charIndex;
          let sumChars = 0;
          for (let i = 0; i < factSentencesRef.current.length; i++) {
            sumChars += factSentencesRef.current[i].length + 1;
            if (charIndex <= sumChars) {
              setFactActiveSentenceIndex(i);
              break;
            }
          }
        }
      };

      utterance.onend = () => {
        setIsFactPlaying(false);
        setFactActiveSentenceIndex(-1);
        if (factUtteranceRef.current) factUtteranceRef.current = null;
      };

      utterance.onerror = (err) => {
        console.warn("Fact Speech Error:", err);
        setIsFactPlaying(false);
        setFactActiveSentenceIndex(-1);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopFactSpeech = () => {
    setIsFactPlaying(false);
    setFactActiveSentenceIndex(-1);
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24" id="audio-digest-view">
      {/* Category Customizer section */}
      <div className="mb-8 rounded-2xl border border-border-outline/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-4 w-4 text-[#1d4ed8]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal font-sans">
            Tailor Your Reading History
          </h3>
        </div>
        <p className="text-xs text-secondary-gray/80 leading-relaxed mb-4 font-sans">
          Our AI synthesizes today's narrative by pulling developments from your selected categories. Toggle topics below to compile a fresh digest.
        </p>
        <div className="flex flex-wrap gap-2">
          {categoriesList.map((category) => {
            const isSelected = interests.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleInterest(category)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1d4ed8] text-white shadow-sm font-bold"
                    : "bg-paper text-secondary-gray/80 hover:bg-black/5"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Custom Focus Input */}
        <div className="mt-5 border-t border-border-outline/10 pt-4 space-y-2">
          <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary-gray/75 font-sans">
            Briefing Focus / Theme (Optional)
          </label>
          <input
            type="text"
            value={customFocus}
            onChange={(e) => setCustomFocus(e.target.value)}
            disabled={loading}
            placeholder="e.g. Focus on futuristic cities, keep it critical..."
            className="w-full rounded-xl border border-border-outline/20 bg-[#f4f7fb] px-3.5 py-2.5 text-xs text-charcoal shadow-sm outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] transition-all font-sans"
          />
        </div>

        {/* Voice Narration Settings */}
        <div className="mt-6 border-t border-border-outline/10 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="h-4 w-4 text-[#1d4ed8]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal font-sans">
              Voice Settings
            </h3>
          </div>
          
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary-gray/75 font-sans">
              Select Local System Voice
            </label>
            {speechSupported ? (
              <div className="relative">
                <select
                  value={selectedVoiceName}
                  onChange={(e) => {
                    stopNarrative();
                    stopFactSpeech();
                    setSelectedVoiceName(e.target.value);
                  }}
                  className="w-full max-w-md rounded-xl border border-border-outline/20 bg-[#f4f7fb] px-3 py-2.5 text-xs text-charcoal shadow-sm outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] transition-all font-sans cursor-pointer appearance-none animate-fade-in"
                >
                  {voices.length > 0 ? (
                    voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))
                  ) : (
                    <option value="">Default Browser Voice</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-gray">
                  <SlidersHorizontal className="h-3 w-3" />
                </div>
              </div>
            ) : (
              <p className="text-xs text-secondary-gray italic">
                Speech synthesis is not supported on this browser.
              </p>
            )}
          </div>

          {ttsAlert && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200/50 p-3 text-[11px] text-amber-800 leading-normal font-sans">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{ttsAlert}</span>
            </div>
          )}
        </div>

        <button
          onClick={fetchDigest}
          disabled={loading}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-3 text-xs font-bold hover:bg-primary/90 hover:scale-[1.01] transition-all disabled:opacity-40 cursor-pointer"
          id="recompile-digest-btn"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Sparkles className="h-4 w-4 text-white" />
          )}
          <span>Compile Fresh Briefing</span>
        </button>
      </div>

      {/* Main Player Display */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1d4ed8]" />
          <p className="mt-4 font-serif text-lg font-bold text-charcoal tracking-tight">
            Synthesizing Today's Narrative
          </p>
          <p className="mt-1 text-xs text-secondary-gray/80 font-sans">
            Connecting global wires, auditing insights, and formatting transcript...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-red-600 font-sans">{error}</p>
          <button
            onClick={fetchDigest}
            className="mt-3 inline-block rounded-lg bg-primary text-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Reconnect Press Wires
          </button>
        </div>
      )}

      {digest && !loading && (
        <div className="space-y-8">
          {/* Terracotta/Charcoal Premium Player Deck */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1d4ed8] px-6 py-8 text-white shadow-lg">
            {/* Design circle backdrop */}
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm font-sans">
                <Volume2 className="h-3.5 w-3.5" />
                <span>AI Briefing</span>
              </div>

              <h2 className="mt-4 font-serif text-2xl font-bold leading-tight md:text-3xl tracking-tight">
                {digest.headline}
              </h2>
              <p className="mt-1 text-xs text-white/70 italic font-serif">
                A humane curated audio narrative
              </p>

              {/* Animated Audio Waveform */}
              <div className="my-8 flex h-16 items-end justify-center gap-[4px] px-8 w-full max-w-xs">
                {Array.from({ length: 30 }).map((_, i) => {
                  const baseHeight = [12, 24, 48, 16, 32, 64, 40, 20, 8, 28, 44, 16, 48, 60, 24, 12, 36, 52, 16, 28, 64, 40, 24, 8, 32, 48, 12, 40, 56, 20][i];
                  return (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full bg-white"
                      animate={{
                        height: isPlaying
                          ? [baseHeight * 0.4, baseHeight, baseHeight * 0.3, baseHeight * 0.8, baseHeight * 0.4]
                          : baseHeight * 0.3,
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.04,
                        ease: "easeInOut",
                      }}
                    />
                  );
                })}
              </div>

              {/* Slider Time scrubber */}
              <div className="w-full space-y-2 px-2 sm:px-4">
                <div className="relative h-1 w-full rounded-full bg-white/20">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-white"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/75 font-semibold font-mono">
                  <span>{currentTime}</span>
                  <span>{totalTime}</span>
                </div>
              </div>

              {/* Player deck controls */}
              <div className="mt-6 flex items-center justify-center gap-6">
                {/* Speed indicator button */}
                <button
                  onClick={togglePlaybackRate}
                  className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition-all font-mono cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>

                {/* Rewind */}
                <button
                  onClick={handleRewind}
                  className="rounded-full p-2 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Rewind 10s"
                >
                  <RotateCcw className="h-5 w-5 text-white" />
                </button>

                {/* Play / Pause button */}
                <button
                  onClick={isPlaying ? stopNarrative : handleResume}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#1d4ed8] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  id="play-digest-btn"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 text-[#1d4ed8] fill-[#1d4ed8]" />
                  ) : (
                    <Play className="h-6 w-6 text-[#1d4ed8] fill-[#1d4ed8] translate-x-[1px]" />
                  )}
                </button>

                {/* Fast Forward */}
                <button
                  onClick={handleFastForward}
                  className="rounded-full p-2 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Fast Forward 10s"
                >
                  <FastForward className="h-5 w-5 text-white" />
                </button>

                {/* Speech capabilities tag indicator */}
                <span
                  className="rounded-lg bg-white/10 px-2 py-1 text-[9px] uppercase tracking-wider text-white font-sans font-bold"
                  title="System Speech Synthesis"
                >
                  {speechSupported ? "SYSTEM TTS" : "SIMULATION"}
                </span>
              </div>
            </div>
          </div>

          {/* Karaoke Transcript Segment */}
          <div className="rounded-2xl border border-border-outline/10 bg-[#f4f7fb] p-6 shadow-sm">
            <h3 className="mb-4 font-serif text-sm font-bold tracking-tight text-[#1d4ed8]">
              Live Transcript
            </h3>

            <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed text-secondary-gray/50 space-y-4 font-serif italic">
              {sentencesRef.current.map((sentence, idx) => {
                const isCurrent = idx === activeSentenceIndex;
                const isRead = idx < activeSentenceIndex;

                return (
                  <motion.span
                    key={idx}
                    className={`inline transition-all duration-300 ${
                      isCurrent
                        ? "text-charcoal font-bold not-italic underline decoration-[#1d4ed8]/25 decoration-2 underline-offset-4 bg-[#1d4ed8]/5 rounded px-1"
                        : isRead
                        ? "text-charcoal/80 not-italic"
                        : "text-secondary-gray/30"
                    }`}
                    animate={{ scale: isCurrent ? 1.01 : 1 }}
                  >
                    {sentence}{" "}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="my-10 border-t border-border-outline/10" />

      {/* AI Fact Compiler Section */}
      <div className="rounded-2xl border border-border-outline/10 bg-white p-6 shadow-sm mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-[#1d4ed8]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal font-sans">
            AI Fact Compiler
          </h3>
        </div>
        <p className="text-xs text-secondary-gray/80 leading-relaxed mb-6 font-sans">
          Need an immediate deep-dive report? Prompt the AI Editor to write a premium fact-based article on any topic, complete with full system voice narration.
        </p>

        {/* Suggestion Pills */}
        <div className="mb-4">
          <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary-gray/75 mb-2 font-sans">
            Quick Topics
          </label>
          <div className="flex flex-wrap gap-2">
            {getDynamicSuggestions().map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setFactPrompt(topic);
                  handleCompileFact(topic);
                }}
                disabled={isFactGenerating || isFactStreaming}
                className="rounded-full bg-paper px-3.5 py-1.5 text-xs font-semibold text-secondary-gray hover:bg-[#1d4ed8] hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Typebox / Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCompileFact(factPrompt);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={factPrompt}
            onChange={(e) => setFactPrompt(e.target.value)}
            disabled={isFactGenerating || isFactStreaming}
            placeholder="Type a topic (e.g. History of Coffee, Voyager Probes)..."
            className="flex-1 rounded-xl border border-border-outline/20 bg-[#f4f7fb] px-4 py-3 text-xs text-charcoal shadow-sm outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!factPrompt.trim() || isFactGenerating || isFactStreaming}
            className="rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isFactGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>Compile</span>
          </button>
        </form>

        {/* Output Card */}
        <AnimatePresence>
          {(isFactGenerating || generatedFact) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="mt-6 rounded-2xl border border-border-outline/10 bg-[#f4f7fb] p-6 shadow-sm relative overflow-hidden"
            >
              {isFactGenerating ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1d4ed8]" />
                  <p className="mt-3 font-serif text-sm font-bold text-charcoal">
                    Compiling Fact Sheet...
                  </p>
                  <p className="mt-1 text-[10px] text-secondary-gray/70">
                    Querying cosmic history and formatting narrative prose...
                  </p>
                </div>
              ) : generatedFact ? (
                <div className="space-y-4">
                  {/* Card Header Info */}
                  <div className="flex items-center justify-between border-b border-border-outline/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#1d4ed8]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1d4ed8]">
                        {generatedFact.category}
                      </span>
                      <span className="text-[10px] text-secondary-gray font-sans font-semibold">
                        {generatedFact.readTime}
                      </span>
                    </div>
                    {/* TTS controls for generated fact */}
                    {speechSupported && !isFactStreaming && (
                      <button
                        onClick={isFactPlaying ? stopFactSpeech : playFactSpeech}
                        className="flex items-center gap-1 rounded-lg bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                      >
                        {isFactPlaying ? (
                          <>
                            <Pause className="h-3 w-3 fill-current" />
                            <span>Stop Narration</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            <span>Listen to Report</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-serif text-lg md:text-xl font-bold leading-tight text-charcoal">
                    {generatedFact.title}
                  </h4>

                  {/* Body Content with streaming / paragraph render */}
                  <div className="font-serif text-sm md:text-base leading-relaxed text-secondary-gray space-y-4 animate-fade-in">
                    {isFactStreaming ? (
                      <p className="whitespace-pre-line italic">
                        {displayedContent}
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#1d4ed8] animate-pulse" />
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {isFactPlaying ? (
                          <div className="italic">
                            {factSentencesRef.current.map((sentence, idx) => {
                              const isCurrent = idx === factActiveSentenceIndex;
                              const isRead = idx < factActiveSentenceIndex && factActiveSentenceIndex !== -1;
                              return (
                                <span
                                  key={idx}
                                  className={`transition-all duration-300 ${
                                    isCurrent
                                      ? "text-charcoal font-bold not-italic underline decoration-[#1d4ed8]/25 decoration-2 underline-offset-4 bg-[#1d4ed8]/5 rounded px-1"
                                      : isRead
                                      ? "text-charcoal/80 not-italic"
                                      : "text-secondary-gray/30"
                                  }`}
                                >
                                  {sentence}{" "}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          generatedFact.content.split("\n\n").map((para: string, idx: number) => (
                            <p key={idx} className="whitespace-pre-line animate-fade-in">
                              {para}
                            </p>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
