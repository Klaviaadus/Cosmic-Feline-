import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessageToGuide, getGreeting } from './openclaw';
import { getCityById } from './cities';

const tallinn = getCityById('tallinn');

describe('OpenClaw API', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
  });

  it('should include the city name in the greeting', () => {
    expect(getGreeting(tallinn)).toContain('Tallinn');
    expect(getGreeting(getCityById('tbilisi'))).toContain('Tbilisi');
  });

  it('should send message to API', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ text: 'Test response' }),
      } as Response)
    );

    const response = await sendMessageToGuide('Hello', [], tallinn);
    expect(response).toBe('Test response');
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello', history: [], city: 'tallinn' }),
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

    await sendMessageToGuide('How are you?', history, tallinn);
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('How are you?'),
    });
  });

  it('should throw error when API returns error', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ error: 'API Error' }),
      } as Response)
    );

    await expect(sendMessageToGuide('Test')).rejects.toThrow('API Error');
  });

  it('should throw error when response not ok', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      } as Response)
    );

    await expect(sendMessageToGuide('Test')).rejects.toThrow('Guide unavailable');
  });
});
