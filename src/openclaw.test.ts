import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessageToKlaw, getCatGreeting } from './openclaw';

describe('OpenClaw API', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
  });

  it('should get cat greeting with name', () => {
    const greeting = getCatGreeting('Whiskers');
    expect(greeting).toContain('Whiskers');
    expect(greeting).toContain('cosmic AI companion');
  });

  it('should send message to API', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ text: 'Test response' }),
      } as Response)
    );

    const response = await sendMessageToKlaw('Hello');
    expect(response).toBe('Test response');
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello', history: [], image: undefined }),
    });
  });

  it('should send message with history', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ text: 'Response with history' }),
      } as Response)
    );

    const history = [
      { role: 'user' as const, content: 'Hi', timestamp: Date.now() },
      { role: 'assistant' as const, content: 'Hello!', timestamp: Date.now() },
    ];

    await sendMessageToKlaw('How are you?', history);
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('How are you?'),
    });
  });

  it('should send image with message', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ text: 'I see the image!' }),
      } as Response)
    );

    const image = 'data:image/png;base64,abc123';
    await sendMessageToKlaw('What is this?', [], image);

    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining(image),
    });
  });

  it('should throw error when API returns error', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ error: 'API Error' }),
      } as Response)
    );

    await expect(sendMessageToKlaw('Test')).rejects.toThrow('API Error');
  });

  it('should throw error when response not ok', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      } as Response)
    );

    await expect(sendMessageToKlaw('Test')).rejects.toThrow('Agent unavailable');
  });
});
