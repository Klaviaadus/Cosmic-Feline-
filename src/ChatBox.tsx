import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Share2,
  Sparkles,
  MessageCircle,
  Shuffle,
} from "lucide-react";
import { sendMessageToGuide, getGreeting, ChatMessage } from "./openclaw";
import {
  checkRateLimit,
  incrementRateLimit,
  getTimeUntilReset,
} from "./rateLimit";
import { fetchEvents, formatEventsMessage } from "./eventsClient";
import type { City } from "./cities";

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
      </a>,
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}

const TOPIC_CHIPS = [
  { label: "Board games", keyword: "board games" },
  { label: "Language exchange", keyword: "language exchange" },
  { label: "Hiking", keyword: "hiking" },
  { label: "Book club", keyword: "book club" },
  { label: "Art", keyword: "art" },
  { label: "Music", keyword: "music" },
  { label: "Surprise me", keyword: undefined },
];

interface ChatBoxProps {
  city: City;
}

export function ChatBox({ city }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(checkRateLimit());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: getGreeting(city),
          timestamp: Date.now(),
        },
      ]);
    }
  }, [messages.length, city]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const limitCheck = checkRateLimit();
    setRateLimit(limitCheck);

    if (!limitCheck.allowed) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `You've reached your daily limit of 20 messages! 😿\n\nReset in ${getTimeUntilReset(limitCheck.resetTime)}.\n\nUpgrade coming soon for unlimited chats! 🌟`,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessageToGuide(input, messages, city);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      incrementRateLimit();
      setRateLimit(checkRateLimit());
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Hmm, something went wrong! 😿",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindEvents = async (label: string, keyword?: string) => {
    if (isLoading) return;
    document
      .getElementById("guide")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Find "${label}" events`,
        timestamp: Date.now(),
      },
    ]);
    setIsLoading(true);

    try {
      const result = await fetchEvents(city, keyword ? [keyword] : undefined);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: formatEventsMessage(result, city, keyword),
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Events error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Couldn't fetch local events right now, try again in a bit! 😿",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const shareMessage = async (message: ChatMessage) => {
    const text = `${message.role === "user" ? "Me" : "Guide"}: ${message.content}\n\nFind your people in ${city.label}: https://cosmic-feline.vercel.app`;

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
    alert("Copied to clipboard!");
  };

  return (
    <div className="discovery-layout">
      <section className="discovery" id="discover">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
            <h2>What's your thing?</h2>
          </div>
          <span className="section-note">Find a reason to get out.</span>
        </div>
        <div className="interest-grid">
          {TOPIC_CHIPS.filter((chip) => chip.keyword).map((chip, index) => (
            <button
              key={chip.label}
              className={`interest-card interest-${index}`}
              onClick={() => handleFindEvents(chip.label, chip.keyword)}
              disabled={isLoading}
            >
              <div className="interest-art" aria-hidden="true">
                {index === 0 && (
                  <>
                    <span className="dice dice-one">⚄</span>
                    <span className="dice dice-two">⚂</span>
                    <span className="art-mini-star">✦</span>
                  </>
                )}
                {index === 1 && (
                  <>
                    <span className="speech speech-one">hello!</span>
                    <span className="speech speech-two">გამარჯობა</span>
                  </>
                )}
                {index === 2 && (
                  <>
                    <span className="sun" />
                    <span className="mountain mountain-back" />
                    <span className="mountain mountain-front" />
                    <span className="trail" />
                  </>
                )}
                {index === 3 && (
                  <>
                    <span className="book book-one">
                      ONE MORE
                      <br />
                      CHAPTER
                    </span>
                    <span className="book book-two" />
                    <span className="art-mini-star">✧</span>
                  </>
                )}
                {index === 4 && (
                  <>
                    <span className="art-blob" />
                    <span className="art-circle" />
                    <span className="art-squiggle">〰</span>
                  </>
                )}
                {index === 5 && (
                  <>
                    <span className="record">
                      <i />
                    </span>
                    <span className="music-note">♪</span>
                  </>
                )}
              </div>
              <div className="interest-label">
                <span>{chip.label}</span>
                <ArrowUpRight size={17} />
              </div>
              <span className="interest-description">
                {
                  [
                    "Good games, better company",
                    "New words, new worlds",
                    "Take the scenic route",
                    "Get on the same page",
                    "Make something together",
                    "Find your kind of rhythm",
                  ][index]
                }
              </span>
            </button>
          ))}
        </div>
        <button
          className="surprise-button"
          onClick={() => handleFindEvents("Surprise me")}
          disabled={isLoading}
        >
          <Shuffle size={17} />
          <span>
            Open to anything? <strong>Surprise me</strong>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <div className="discovery-note">
          <span>✳</span>
          <p>
            You don't need to be interesting.
            <br />
            <strong>Just interested.</strong>
          </p>
        </div>
      </section>
      <section className="guide" id="guide" aria-label="Your local guide">
        <header className="guide-header">
          <div className="guide-avatar">
            <Sparkles size={23} />
          </div>
          <div>
            <h2>A little nudge</h2>
            <p>
              <span className="status-dot" /> Your {city.label} guide
            </p>
          </div>
          <span className="ai-badge">AI GUIDE</span>
        </header>
        <div
          className="messages"
          role="log"
          aria-label="Conversation"
          aria-live="polite"
          aria-busy={isLoading}
        >
          <div className="conversation-date">
            GOOD CONNECTIONS START WITH A HELLO
          </div>
          {messages.map((msg, idx) => (
            <div key={idx} className={`message message-${msg.role}`}>
              {msg.role === "assistant" && (
                <span className="message-avatar">✳</span>
              )}
              <div className="message-content">
                <div className="message-bubble">{linkify(msg.content)}</div>
                <div className="message-meta">
                  <span>
                    {msg.role === "assistant" ? "Your guide" : "You"} ·{" "}
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => shareMessage(msg)}
                      aria-label="Share message"
                    >
                      <Share2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="loading-message" role="status">
              <span />
              <span />
              <span />
              <span className="sr-only">Finding a little inspiration…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {messages.length <= 1 && (
          <div className="guide-suggestion">
            <MessageCircle size={16} />
            <span>
              New in town? Going solo?
              <br />
              Start here. We'll figure it out together.
            </span>
          </div>
        )}
        <div className="composer-area">
          {rateLimit.remaining <= 5 && (
            <p className="limit-warning">
              {rateLimit.remaining > 0
                ? `${rateLimit.remaining} messages left today`
                : `Daily message limit reached. Reset in ${getTimeUntilReset(rateLimit.resetTime)}.`}
            </p>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <label className="sr-only" htmlFor="guide-message">
              Message your local guide
            </label>
            <input
              id="guide-message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Ask about meeting people in ${city.label}...`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <ArrowUp size={20} />
            </button>
          </form>
          <div className="composer-footer">
            <span>Small steps. Real connections.</span>
            {rateLimit.remaining > 5 && (
              <span>{rateLimit.remaining} messages left today</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
