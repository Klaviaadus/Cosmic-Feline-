import type { NormalizedEvent, EventsResult } from './lib/events';
import type { NormalizedCommunity } from './lib/telegram';
import type { City } from './cities';

export interface AppEventsResult extends EventsResult {
  communities: NormalizedCommunity[];
}

export async function fetchEvents(city: City, keywords?: string[]): Promise<AppEventsResult> {
  const params = new URLSearchParams();
  params.set('city', city.id);
  keywords?.forEach((keyword) => params.append('keyword', keyword));

  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) throw new Error('Events unavailable');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as AppEventsResult;
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

function matchesKeyword(event: NormalizedEvent, keywordLower: string): boolean {
  return (event.group ?? '').toLowerCase().includes(keywordLower) || event.title.toLowerCase().includes(keywordLower);
}

// Meetup's own keyword search is loose for smaller cities and often falls
// back to generic, high-frequency "meet people" groups regardless of the
// keyword searched - which made every topic chip look like it returned the
// same handful of groups. Boosting groups that actually mention the keyword
// (when one was searched) surfaces genuine matches instead of just whichever
// group happens to post the most events.
export function formatEventsMessage(
  { meetup, eventbrite, communities }: AppEventsResult,
  city: City,
  keyword?: string
): string {
  if (meetup.length === 0 && eventbrite.length === 0 && communities.length === 0) {
    return `Couldn't find any upcoming events in ${city.label} right now. Try again later! 😿`;
  }

  const keywordLower = keyword?.trim().toLowerCase();

  const lines: string[] = [
    `Here's what's happening around ${city.label} — real chances to meet people in person:`,
    '',
  ];

  if (meetup.length > 0) {
    const groupEntries = [...groupByCommunity(meetup).entries()];
    const anyGroupMatches = keywordLower ? groupEntries.some(([, events]) => events.some((e) => matchesKeyword(e, keywordLower))) : true;

    if (keywordLower && !anyGroupMatches) {
      lines.push(`No dedicated "${keyword}" groups found in ${city.label} right now — here are the most active general groups instead:`);
    } else {
      lines.push('Recurring groups (worth showing up to more than once):');
    }

    const groups = groupEntries
      .sort((a, b) => {
        if (keywordLower) {
          const aMatches = a[1].some((e) => matchesKeyword(e, keywordLower));
          const bMatches = b[1].some((e) => matchesKeyword(e, keywordLower));
          if (aMatches !== bMatches) return aMatches ? -1 : 1;
        }
        return b[1].length - a[1].length;
      })
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
    const sortedEventbrite = keywordLower
      ? [...eventbrite].sort((a, b) => {
          const aMatches = matchesKeyword(a, keywordLower);
          const bMatches = matchesKeyword(b, keywordLower);
          return aMatches === bMatches ? 0 : aMatches ? -1 : 1;
        })
      : eventbrite;
    for (const ev of sortedEventbrite.slice(0, MAX_ONE_OFF)) {
      lines.push(`• ${ev.title} — ${formatWhen(ev.startDate, city.timezone)}${ev.venue ? ` @ ${ev.venue}` : ''}`);
      lines.push(`  ${ev.url}`);
    }
    lines.push('');
  }

  if (communities.length > 0) {
    lines.push(`Telegram communities matching "${keyword}" you can join directly:`);
    for (const c of communities) {
      lines.push(`• ${c.name}${c.memberCount ? ` (${c.memberCount.toLocaleString()} members)` : ''}`);
      lines.push(`  ${c.url}`);
    }
  }

  return lines.join('\n').trimEnd();
}
