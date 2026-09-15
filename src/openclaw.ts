export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function sendMessageToGuide(message: string, history: ChatMessage[] = []): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) throw new Error('Guide unavailable');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

export const GREETING_MESSAGE =
  "👋 Hi! I help you find real, in-person events and communities in Tallinn — the kind of recurring meetups where you actually get to know people, instead of another dating app. Tap a topic below, or ask me anything about meeting people locally.";
