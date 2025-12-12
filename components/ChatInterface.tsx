import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToAssistant, speakText } from '../services/gemini';
import { Send, Bot, User, Sparkles, Mic, Volume2, StopCircle, Loader2, Zap } from 'lucide-react';

// Web Speech API Types
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Namaste! 🙏 I am FinGuru. I've analyzed your money. Let's just say... interesting choices. 🧐 Ask me anything in English or Hindi!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Audio Playback State
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await sendMessageToAssistant(userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Voice Input Logic ---
  const startListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const w = window as unknown as IWindow;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    // Use 'en-IN' (English India) as it captures Hinglish/Hindi accents much better than US/UK
    recognition.lang = 'en-IN'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- Voice Output Logic (Gemini TTS with Raw PCM) ---
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setActiveAudioId(null);
    setIsLoadingAudio(null);
  };

  const handleSpeak = async (msgId: string, text: string) => {
    if (activeAudioId === msgId) {
      stopAudio();
      return;
    }
    if (activeAudioId) {
      stopAudio();
    }

    setIsLoadingAudio(msgId);

    try {
      const cleanText = text.replace(/[*#_`]/g, ''); 
      const audioBase64 = await speakText(cleanText);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000, 
        });
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const pcmData = decodeBase64(audioBase64);
      const dataInt16 = new Int16Array(pcmData.buffer);
      const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setActiveAudioId(null);
      };
      
      sourceNodeRef.current = source;
      source.start();
      
      setIsLoadingAudio(null);
      setActiveAudioId(msgId);
      
    } catch (err) {
      console.error("Audio playback failed", err);
      setIsLoadingAudio(null);
      setActiveAudioId(null);
    }
  };

  const SUGGESTIONS = [
    { label: "🔥 Roast my spending", query: "Roast my spending habits in a funny way." },
    { label: "💰 Where can I save?", query: "Identify 3 areas where I am wasting money and tell me how to stop." },
    { label: "📊 Biggest expense?", query: "What is my biggest expense category?" },
    { label: "🇮🇳 Bolo Hindi mein", query: "Mere kharche ka haal Hindi mein batao." },
  ];

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-300" size={20} />
          <div>
            <h3 className="font-bold text-base leading-tight">FinGuru AI</h3>
            <p className="text-[10px] text-blue-100 opacity-90">Witty Financial Advisor</p>
          </div>
        </div>
        <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
          🎙️ Eng / Hin
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'model' ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
              {msg.role === 'model' ? <Bot size={20} /> : <User size={20} />}
            </div>
            
            <div className="flex flex-col gap-1 max-w-[80%]">
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0 min-h-[1em]">{line}</p>
                  ))}
                </div>
              </div>
              
              <div className={`flex items-center gap-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <span className="text-slate-400">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
                 {msg.role === 'model' && (
                   <button 
                    onClick={() => handleSpeak(msg.id, msg.text)}
                    className={`p-1.5 rounded-full transition-colors ${
                      activeAudioId === msg.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-500'
                    }`}
                    title={activeAudioId === msg.id ? "Stop Speaking" : "Read Aloud"}
                    disabled={isLoadingAudio !== null && isLoadingAudio !== msg.id}
                   >
                     {isLoadingAudio === msg.id ? (
                       <Loader2 size={14} className="animate-spin" />
                     ) : activeAudioId === msg.id ? (
                       <StopCircle size={14} />
                     ) : (
                       <Volume2 size={14} />
                     )}
                   </button>
                 )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-sm ml-14">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        
        {/* Suggestion Chips */}
        {messages.length < 4 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.query)}
                disabled={isTyping}
                className="flex-shrink-0 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-inner">
          <input 
            type="text" 
            placeholder="Type a message or use voice..." 
            className="flex-1 bg-transparent focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          
          <button
            onClick={startListening}
            className={`p-2 rounded-full transition-all ${
              isListening 
                ? 'bg-red-100 text-red-600 animate-pulse shadow-red-200' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
            }`}
            title="Voice Input (English/Hindi)"
          >
            {isListening ? <StopCircle size={18} /> : <Mic size={18} />}
          </button>

          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-200"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;