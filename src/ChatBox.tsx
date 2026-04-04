import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Share2 } from 'lucide-react';
import { sendMessageToKlaw, getCatGreeting, ChatMessage } from './openclaw';
import { checkRateLimit, incrementRateLimit, getTimeUntilReset } from './rateLimit';

interface ChatBoxProps {
  catName: string;
}

export function ChatBox({ catName }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(checkRateLimit());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const greeting = getCatGreeting(catName);
      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: Date.now()
      }]);
    }
  }, [catName, messages.length]);

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
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      const response = await sendMessageToKlaw(input, messages, imageToSend || undefined);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large! Max 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const shareMessage = async (message: ChatMessage) => {
    const text = `${message.role === 'user' ? 'Me' : 'Cosmic Cat'}: ${message.content}\n\nChat with Cosmic Cat: https://cosmic-feline.vercel.app`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
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
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'order-2' : ''}`}>
              <div
                className={`rounded-2xl p-4 shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                    : 'bg-white/95 text-gray-800'
                }`}
              >
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="User uploaded"
                    className="max-w-full max-h-64 rounded-lg mb-3 object-contain"
                  />
                )}
                <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
      <div className="p-4 md:p-6 bg-white/5 backdrop-blur-sm border-t border-white/10">
        {/* Rate limit warning */}
        {rateLimit.remaining <= 5 && rateLimit.remaining > 0 && (
          <div className="mb-3 text-yellow-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{rateLimit.remaining} messages left today</span>
          </div>
        )}

        {/* Image preview */}
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={selectedImage}
              alt="To upload"
              className="max-w-[120px] max-h-[120px] rounded-lg border-2 border-purple-400"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2 md:gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !!selectedImage}
            className="flex-shrink-0 w-12 h-12 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
            aria-label="Upload image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Message input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
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
