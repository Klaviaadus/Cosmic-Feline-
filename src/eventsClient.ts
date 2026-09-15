import type { NormalizedEvent, TallinnEventsResult } from './lib/events';

export async function fetchTallinnEvents(): Promise<TallinnEventsResult> {
  const res = await fetch('/api/events');
  if (!res.ok) throw new Error('Events unavailable');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as TallinnEventsResult;
}

function formatWhen(startDate: string | null): string {
  if (!startDate) return 'date TBA';
  const hasTime = startDate.includes('T');
  return new Date(startDate).toLocaleString('en-GB', {
    timeZone: 'Europe/Tallinn',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function groupByCommunity(events: NormalizedEvent[]): Map<string, NormalizedEvent[]> {
  const groups = new Map<string, NormalizedEvent[]>();
  for (const ev of events) {
    const key = ev.group || ev.title;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev);
  }
  return groups;
}

const MAX_GROUPS = 6;
const MAX_ONE_OFF = 5;

export function formatEventsMessage({ meetup, eventbrite }: TallinnEventsResult): string {
  if (meetup.length === 0 && eventbrite.length === 0) {
    return "Meow... I couldn't find any upcoming events in Tallinn right now. Try again later! 😿";
  }

  const lines: string[] = [
    "🐾 Meow! Here's what's happening around Tallinn — real chances to meet people in person:",
    '',
  ];

  if (meetup.length > 0) {
    lines.push('Recurring groups (worth showing up to more than once):');
    const groups = [...groupByCommunity(meetup).entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, MAX_GROUPS);
    for (const [group, events] of groups) {
      const next = events[0];
      lines.push(`• ${group} — ${next.title} (${formatWhen(next.startDate)})`);
      lines.push(`  ${next.url}`);
    }
    lines.push('');
  }

  if (eventbrite.length > 0) {
    lines.push('One-off events worth trying once:');
    for (const ev of eventbrite.slice(0, MAX_ONE_OFF)) {
      lines.push(`• ${ev.title} — ${formatWhen(ev.startDate)}${ev.venue ? ` @ ${ev.venue}` : ''}`);
      lines.push(`  ${ev.url}`);
    }
  }

  return lines.join('\n');
}
