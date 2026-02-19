import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { sendMessageToKlaw, getCatGreeting, ChatMessage } from './openclaw';

interface ChatBoxProps {
  catName: string;
  inline?: boolean;
}

export function ChatBox({ catName, inline = false }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(inline ? true : false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getCatGreeting(catName);
      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: Date.now()
      }]);
    }
  }, [isOpen, catName, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessageToKlaw(input);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Meow... something went wrong! 😿",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen && !inline) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-50"
        aria-label="Chat with cat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
      </button>
    );
  }

  const containerClass = inline
    ? "w-full h-full bg-black border border-[#00FFFF] flex flex-col"
    : "fixed bottom-6 right-6 w-96 h-[500px] bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col z-50";

  return (
    <div className={containerClass}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full"></div>
            <div>
              <h3 className="text-white font-bold">{catName}</h3>
              <p className="text-xs text-purple-300">Cosmic AI Cat 🌟</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-purple-300 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 ${inline ? 'border-2' : 'rounded-2xl'} ${
                msg.role === 'user'
                  ? inline ? 'bg-black border-[#FF00FF] text-[#FF00FF]' : 'bg-purple-600 text-white'
                  : inline ? 'bg-black border-[#00FFFF] text-[#00FFFF]' : 'bg-blue-800/50 text-purple-100 border border-blue-500/30'
              }`}
              style={inline && msg.role === (msg.role === 'user' ? 'user' : 'assistant') ? {
                boxShadow: msg.role === 'user' ? '0 0 5px rgba(255,0,255,0.3)' : '0 0 5px rgba(0,255,255,0.3)'
              } : {}}
            >
              <p className={inline ? "text-[7px]" : "text-sm"} style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              <p className={`${inline ? 'text-[6px]' : 'text-xs'} opacity-50 mt-1`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={inline ? "bg-black border-2 border-[#00FFFF] p-3 text-[#00FFFF]" : "bg-blue-800/50 text-purple-100 border border-blue-500/30 p-3 rounded-2xl"}>
              <div className="flex gap-1">
                <span className={`w-2 h-2 ${inline ? 'bg-[#00FFFF]' : 'bg-purple-400'} rounded-full animate-bounce`}></span>
                <span className={`w-2 h-2 ${inline ? 'bg-[#00FFFF]' : 'bg-purple-400'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></span>
                <span className={`w-2 h-2 ${inline ? 'bg-[#00FFFF]' : 'bg-purple-400'} rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 ${inline ? 'border-t-2 border-[#00FFFF] bg-black' : 'border-t border-purple-500/30'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={inline ? "TYPE MESSAGE..." : "Talk to your cosmic cat..."}
            className={inline 
              ? "flex-1 bg-black border-2 border-[#00FFFF] text-[#00FFFF] placeholder-[#00FFFF]/50 px-3 py-2 text-[7px] focus:outline-none focus:border-[#FF00FF] focus:text-[#FF00FF]"
              : "flex-1 bg-purple-800/30 text-white placeholder-purple-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            }
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={inline
              ? "px-4 border-2 border-[#00FFFF] bg-black text-[#00FFFF] text-[7px] active:translate-y-1 transition-transform disabled:opacity-50"
              : "w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            }
            style={inline ? { boxShadow: '0 0 5px rgba(0,255,255,0.3)' } : {}}
            aria-label="Send message"
          >
            {inline ? 'SEND' : <Send className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
