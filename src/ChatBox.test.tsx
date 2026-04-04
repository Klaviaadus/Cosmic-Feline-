import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatBox } from './ChatBox';

// Mock the openclaw module
vi.mock('./openclaw', () => ({
  sendMessageToKlaw: vi.fn(() => Promise.resolve('Mocked response')),
  getCatGreeting: vi.fn((name: string) => `Hello from ${name}!`),
}));

// Mock rate limiting
vi.mock('./rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 20, resetTime: Date.now() + 86400000 })),
  incrementRateLimit: vi.fn(),
  getTimeUntilReset: vi.fn(() => '12h 0m'),
}));

describe('ChatBox Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render chat interface', () => {
    render(<ChatBox catName="Cosmic" />);
    expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
  });

  it('should show greeting message on mount', () => {
    render(<ChatBox catName="Cosmic" />);
    expect(screen.getByText(/Hello from Cosmic!/i)).toBeInTheDocument();
  });

  it('should display user input', () => {
    render(<ChatBox catName="Cosmic" />);
    const input = screen.getByPlaceholderText(/Type a message/i);

    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input).toHaveValue('Test message');
  });

  it('should have send button', () => {
    render(<ChatBox catName="Cosmic" />);
    const sendButton = screen.getByLabelText(/Send message/i);
    expect(sendButton).toBeInTheDocument();
  });

  it('should have image upload button', () => {
    render(<ChatBox catName="Cosmic" />);
    const uploadButton = screen.getByLabelText(/Upload image/i);
    expect(uploadButton).toBeInTheDocument();
  });

  it('should disable send button when input is empty', () => {
    render(<ChatBox catName="Cosmic" />);
    const sendButton = screen.getByLabelText(/Send message/i);
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has text', () => {
    render(<ChatBox catName="Cosmic" />);
    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByLabelText(/Send message/i);

    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('should show messages remaining counter', () => {
    render(<ChatBox catName="Cosmic" />);
    expect(screen.getByText(/20 messages left today/i)).toBeInTheDocument();
  });
});
