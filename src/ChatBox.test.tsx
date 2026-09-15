import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatBox } from './ChatBox';
import { getCityById } from './cities';

const tallinn = getCityById('tallinn');

// Mock the openclaw module
vi.mock('./openclaw', () => ({
  sendMessageToGuide: vi.fn(() => Promise.resolve('Mocked response')),
  getGreeting: vi.fn((city: { label: string }) => `Hello! Find your people in ${city.label}.`),
}));

// Mock rate limiting
vi.mock('./rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 20, resetTime: Date.now() + 86400000 })),
  incrementRateLimit: vi.fn(),
  getTimeUntilReset: vi.fn(() => '12h 0m'),
}));

// Mock the events client
vi.mock('./eventsClient', () => ({
  fetchEvents: vi.fn(() => Promise.resolve({ meetup: [], eventbrite: [] })),
  formatEventsMessage: vi.fn(() => 'Formatted events'),
}));

describe('ChatBox Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render chat interface', () => {
    render(<ChatBox city={tallinn} />);
    expect(screen.getByPlaceholderText(/Ask about meeting people/i)).toBeInTheDocument();
  });

  it('should show greeting message on mount', () => {
    render(<ChatBox city={tallinn} />);
    expect(screen.getByText(/Hello! Find your people in Tallinn\./i)).toBeInTheDocument();
  });

  it('should display user input', () => {
    render(<ChatBox city={tallinn} />);
    const input = screen.getByPlaceholderText(/Ask about meeting people/i);

    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input).toHaveValue('Test message');
  });

  it('should have send button', () => {
    render(<ChatBox city={tallinn} />);
    const sendButton = screen.getByLabelText(/Send message/i);
    expect(sendButton).toBeInTheDocument();
  });

  it('should have topic chips for finding events', () => {
    render(<ChatBox city={tallinn} />);
    expect(screen.getByText('Board games')).toBeInTheDocument();
    expect(screen.getByText('Surprise me')).toBeInTheDocument();
  });

  it('should disable send button when input is empty', () => {
    render(<ChatBox city={tallinn} />);
    const sendButton = screen.getByLabelText(/Send message/i);
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has text', () => {
    render(<ChatBox city={tallinn} />);
    const input = screen.getByPlaceholderText(/Ask about meeting people/i);
    const sendButton = screen.getByLabelText(/Send message/i);

    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('should show messages remaining counter', () => {
    render(<ChatBox city={tallinn} />);
    expect(screen.getByText(/20 messages left today/i)).toBeInTheDocument();
  });
});
