export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string; // base64 image data
}

export async function sendMessageToKlaw(message: string, history: ChatMessage[] = [], image?: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, image }),
  });

  if (!res.ok) throw new Error('Agent unavailable');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

export function getCatGreeting(catName: string): string {
  return `Meow! I'm ${catName}, your cosmic AI companion. Ask me anything! ✨`;
}
