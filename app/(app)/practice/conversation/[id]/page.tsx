"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTTS } from "@/hooks/useTTS";

export default function VoiceConversationPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { conversations, activeConversation, setActiveConversation, addConversationMessage, endConversation } = useAppStore();
  const { speak, isPlaying, stop } = useTTS();

  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [expandedCorrectionId, setExpandedCorrectionId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Mount & load conversation
    if (!activeConversation || activeConversation.id !== id) {
      setActiveConversation(id);
    }
  }, [id, activeConversation, setActiveConversation]);

  useEffect(() => {
    // Auto-initiate conversation if empty
    if (activeConversation && activeConversation.id === id) {
      if (activeConversation.messages.length === 0 && !isAiThinking && !hasInitialized.current) {
        hasInitialized.current = true;
        executeAiTurn("[SYSTEM: Kick off the conversation. You speak first! Keep it to 1-2 natural sentences representing the start of this roleplay.]");
      }
    }
  }, [activeConversation, id, isAiThinking]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages?.length, isAiThinking, interimTranscript]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        executeAiTurn(null, blob);
      };

      // Start Interim Speech Recognition for UI visual tracking
      if (("webkitSpeechRecognition" in window) || ("SpeechRecognition" in window)) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        
        let finalTranscriptLocal = "";
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscriptLocal += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(finalTranscriptLocal + interim);
        };
        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }

      mediaRecorder.start();
      setIsRecording(true);
      stop(); // Stop any TTS playing
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access to practice speaking.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const executeAiTurn = async (userMessageText: string | null = null, audioBlob: Blob | null = null) => {
    if (!activeConversation) return;
    setIsAiThinking(true);

    try {
      const history = activeConversation.messages.slice(-5); // Send last 5 for context
      
      const formData = new FormData();
      formData.append("scenarioId", activeConversation.scenarioId);
      formData.append("scenarioTitle", activeConversation.scenarioTitle);
      formData.append("messageHistory", JSON.stringify(history));
      if (userMessageText) formData.append("userMessage", userMessageText);
      if (audioBlob) formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("API Failed");
      const data = await res.json();

      let userMsgId = null;
      if (data.transcript && !data.transcript.startsWith("[SYSTEM")) {
        userMsgId = await addConversationMessage(activeConversation.id, "user", data.transcript, undefined, data.corrections || []);
      } else if (userMessageText && !userMessageText.startsWith("[SYSTEM")) {
        userMsgId = await addConversationMessage(activeConversation.id, "user", userMessageText, undefined, data.corrections || []);
      }

      if (data.corrections && data.corrections.length > 0) {
         // Add to the global tracking ledger so the user can practice these later
         const newMistakes = data.corrections.map((c: any) => ({
           errorType: "phrase" as const,
           originalText: c.original,
           suggestion: c.suggestion,
           context: c.rule || "From live conversation",
         }));
         await useAppStore.getState().addMistakes(newMistakes);
      }

      if (data.dialogue) {
        await addConversationMessage(activeConversation.id, "ai", data.dialogue);
        speak(data.dialogue);
      }

    } catch (e) {
      console.error(e);
      await addConversationMessage(activeConversation.id, "system", "Error connecting to AI. Please try again.");
    } finally {
      setInterimTranscript("");
      setIsAiThinking(false);
    }
  };

  const handleEndConversation = async () => {
    if (activeConversation) {
      await endConversation(activeConversation.id);
      stop(); // Stop TTS
      // In a full implementation, we would route to an evaluation page specific to this conversation.
      // For now, we go back to progress.
      router.push("/progress");
    }
  };

  if (!activeConversation) {
    return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="loading-spinner w-8 h-8"></div></div>;
  }

  return (
    <div className="page-container max-w-3xl flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] py-4 overflow-hidden relative fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.08)] shrink-0">
        <div>
          <div className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-1">Live Conversation</div>
          <h1 className="heading-4">{activeConversation.scenarioTitle}</h1>
        </div>
        <button onClick={handleEndConversation} className="btn btn-sm bg-danger-500/10 text-danger-400 hover:bg-danger-500 hover:text-white border border-danger-500/20">
          End Session
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide pr-2">
        {activeConversation.messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : msg.role === "system" ? "items-center" : "items-start"}`}>
            {msg.role === "system" ? (
               <div className="text-xs text-[#a0a0b5] bg-background-elevated px-4 py-1.5 rounded-full">
                 {msg.text}
               </div>
            ) : (
               <div className="flex flex-col max-w-[85%]">
                 <div className={`text-xs mb-1 flex items-center gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                   <span className="opacity-50">{msg.role === "user" ? "You" : "AI Partner"}</span>
                   {msg.role === "ai" && isPlaying && msg.text === activeConversation.messages[activeConversation.messages.length - 1]?.text && (
                     <div className="flex items-end gap-[2px] h-3 ml-1" title="Speaking...">
                       <div className="w-[3px] bg-primary-400/80 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0ms]" style={{ height: '40%' }}></div>
                       <div className="w-[3px] bg-primary-400/80 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_200ms]" style={{ height: '100%' }}></div>
                       <div className="w-[3px] bg-primary-400/80 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_400ms]" style={{ height: '60%' }}></div>
                       <div className="w-[3px] bg-primary-400/80 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_600ms]" style={{ height: '80%' }}></div>
                     </div>
                   )}
                 </div>
                 <div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-primary-500/20 border border-primary-500/30 text-[#f0f0f5] rounded-tr-sm" : "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#c8c8d5] rounded-tl-sm relative"}`}>
                   {msg.text}
                 </div>
                 
                 {/* Inline Corrections */}
                 {msg.role === "user" && msg.corrections && msg.corrections.length > 0 && (
                   <div className="mt-2 space-y-2">
                     {msg.corrections.map((corr, idx) => {
                       const cId = `${msg.id}-${idx}`;
                       const isExpanded = expandedCorrectionId === cId;
                       return (
                         <div key={idx} className="bg-[rgba(244,63,94,0.05)] border border-[rgba(244,63,94,0.15)] rounded-lg p-2 text-sm text-right cursor-pointer hover:bg-[rgba(244,63,94,0.08)] transition-colors" onClick={() => setExpandedCorrectionId(isExpanded ? null : cId)}>
                           <div className="text-danger-400 text-xs font-bold uppercase mb-1">Correction Detected ▼</div>
                           <div className="flex flex-col gap-1 items-end">
                             <div className="line-through text-[#a0a0b5]">&quot;{corr.original}&quot;</div>
                             <div className="text-success-400 font-medium">&quot;{corr.suggestion}&quot;</div>
                           </div>
                           {isExpanded && (
                             <div className="mt-2 text-left bg-background-primary p-2 rounded border border-[rgba(255,255,255,0.04)] text-[#c8c8d5] text-xs animate-in slide-in-from-top-2">
                               <strong className="text-primary-400 block mb-1">Rule:</strong>
                               {corr.rule}
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
            )}
          </div>
        ))}

        {/* Interim/Thinking States */}
        {(isRecording || (isAiThinking && interimTranscript)) && (
          <div className="flex flex-col items-end">
            <div className="bg-primary-500/10 border border-primary-500/20 text-[#f0f0f5] p-4 rounded-2xl rounded-tr-sm max-w-[85%] opacity-70">
              {interimTranscript || "Listening..."}
              {isRecording && <span className="inline-block w-1.5 h-4 ml-1 bg-primary-400 animate-pulse align-middle" />}
            </div>
          </div>
        )}
        
        {isAiThinking && (
          <div className="flex flex-col items-start">
             <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-[#a0a0b5] p-3 rounded-2xl rounded-tl-sm flex gap-1">
               <div className="w-2 h-2 bg-primary-500/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
               <div className="w-2 h-2 bg-primary-500/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
               <div className="w-2 h-2 bg-primary-500/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Control Area */}
      <div className="shrink-0 pt-4 pb-8 sm:pb-4 flex flex-col items-center">
        <button
          onClick={toggleRecording}
          disabled={isAiThinking}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
            isRecording 
              ? "bg-danger-500 scale-110 shadow-[0_0_30px_rgba(244,63,94,0.4)]" 
              : "bg-gradient-primary hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          }`}
        >
          {isRecording ? (
             <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
          ) : (
             <div className="text-3xl">🎙️</div>
          )}
        </button>
        <div className="mt-3 text-sm font-medium text-[#8b8b9d]">
          {isRecording ? "Tap to send" : "Tap to speak"}
        </div>
      </div>
    </div>
  );
}
