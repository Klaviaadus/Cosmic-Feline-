import type { NormalizedEvent, EventsResult } from './lib/events';
import type { City } from './cities';

export async function fetchEvents(city: City, keywords?: string[]): Promise<EventsResult> {
  const params = new URLSearchParams();
  params.set('city', city.id);
  keywords?.forEach((keyword) => params.append('keyword', keyword));

  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) throw new Error('Events unavailable');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as EventsResult;
}

function formatWhen(startDate: string | null, timezone: string): string {
  if (!startDate) return 'date TBA';
  const hasTime = startDate.includes('T');
  return new Date(startDate).toLocaleString('en-GB', {
    timeZone: timezone,
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

export function formatEventsMessage({ meetup, eventbrite }: EventsResult, city: City): string {
  if (meetup.length === 0 && eventbrite.length === 0) {
    return `Couldn't find any upcoming events in ${city.label} right now. Try again later! 😿`;
  }

  const lines: string[] = [
    `Here's what's happening around ${city.label} — real chances to meet people in person:`,
    '',
  ];

  if (meetup.length > 0) {
    lines.push('Recurring groups (worth showing up to more than once):');
    const groups = [...groupByCommunity(meetup).entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, MAX_GROUPS);
    for (const [group, events] of groups) {
      const next = events[0];
      lines.push(`• ${group} — ${next.title} (${formatWhen(next.startDate, city.timezone)})`);
      lines.push(`  ${next.url}`);
    }
    lines.push('');
  }

  if (eventbrite.length > 0) {
    lines.push('One-off events worth trying once:');
    for (const ev of eventbrite.slice(0, MAX_ONE_OFF)) {
      lines.push(`• ${ev.title} — ${formatWhen(ev.startDate, city.timezone)}${ev.venue ? ` @ ${ev.venue}` : ''}`);
      lines.push(`  ${ev.url}`);
    }
  }

  return lines.join('\n');
}
