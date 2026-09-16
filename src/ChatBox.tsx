import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Send, Share2, Compass } from 'lucide-react';
import { sendMessageToGuide, getGreeting, ChatMessage } from './openclaw';
import { checkRateLimit, incrementRateLimit, getTimeUntilReset } from './rateLimit';
import { fetchEvents, formatEventsMessage } from './eventsClient';
import type { City } from './cities';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function linkify(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const url = match[0];
    parts.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all hover:opacity-80"
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}

const TOPIC_CHIPS = [
  { label: 'Board games', keyword: 'board games' },
  { label: 'Language exchange', keyword: 'language exchange' },
  { label: 'Hiking', keyword: 'hiking' },
  { label: 'Book club', keyword: 'book club' },
  { label: 'Art', keyword: 'art' },
  { label: 'Music', keyword: 'music' },
  { label: 'Surprise me', keyword: undefined },
];

interface ChatBoxProps {
  city: City;
}

export function ChatBox({ city }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(checkRateLimit());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: getGreeting(city),
        timestamp: Date.now()
      }]);
    }
  }, [messages.length, city]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const limitCheck = checkRateLimit();
    setRateLimit(limitCheck);

    if (!limitCheck.allowed) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `You've reached your daily limit of 20 messages! 😿\n\nReset in ${getTimeUntilReset(limitCheck.resetTime)}.\n\nUpgrade coming soon for unlimited chats! 🌟`,
        timestamp: Date.now()
      }]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGuide(input, messages, city);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
      incrementRateLimit();
      setRateLimit(checkRateLimit());
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Hmm, something went wrong! 😿",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindEvents = async (label: string, keyword?: string) => {
    if (isLoading) return;

    setMessages(prev => [...prev, {
      role: 'user',
      content: `Find "${label}" events`,
      timestamp: Date.now()
    }]);
    setIsLoading(true);

    try {
      const result = await fetchEvents(city, keyword ? [keyword] : undefined);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: formatEventsMessage(result, city, keyword),
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Events error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Couldn't fetch local events right now, try again in a bit! 😿",
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

  const shareMessage = async (message: ChatMessage) => {
    const text = `${message.role === 'user' ? 'Me' : 'Guide'}: ${message.content}\n\nFind your people in ${city.label}: https://cosmic-feline.vercel.app`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled or share failed
        copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="h-full flex flex-col bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div className={`max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'order-2' : ''}`}>
              <div
                className={`rounded-2xl p-3 sm:p-4 shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                    : 'bg-white/95 text-gray-800'
                }`}
              >
                <p className="text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap">{linkify(msg.content)}</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <p className="text-xs opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => shareMessage(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
                      aria-label="Share message"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/95 text-gray-800 rounded-2xl p-4 shadow-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 md:p-6 bg-white/5 backdrop-blur-sm border-t border-white/10 flex-shrink-0">
        {/* Rate limit warning */}
        {rateLimit.remaining <= 5 && rateLimit.remaining > 0 && (
          <div className="mb-2 text-yellow-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{rateLimit.remaining} messages left today</span>
          </div>
        )}

        {/* Topic chips - single horizontally-scrollable row so it doesn't eat vertical space on mobile */}
        <div className="mb-2 sm:mb-3 flex gap-2 overflow-x-auto flex-nowrap -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleFindEvents(chip.label, chip.keyword)}
              disabled={isLoading}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm rounded-full transition-colors border border-white/10 whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5" />
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 md:gap-3">
          {/* Message input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about meeting people in ${city.label}...`}
            className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base md:text-lg"
            disabled={isLoading}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Messages remaining counter */}
        {rateLimit.remaining > 0 && (
          <div className="mt-3 text-center text-white/60 text-sm">
            {rateLimit.remaining} messages left today
          </div>
        )}
      </div>
    </div>
  );
}
