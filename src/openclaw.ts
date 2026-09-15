import type { City } from './cities';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function sendMessageToGuide(message: string, history: ChatMessage[] = [], city?: City): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, city: city?.id }),
  });

  if (!res.ok) throw new Error('Guide unavailable');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

export function getGreeting(city: City): string {
  return `👋 Hi! I help you find real, in-person events and communities in ${city.label} — the kind of recurring meetups where you actually get to know people, instead of another dating app. Tap a topic below, or ask me anything about meeting people locally.`;
}
