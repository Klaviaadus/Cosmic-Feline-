// Finds upcoming events in Tallinn from Meetup and Eventbrite's public search
// pages, so Cosmic Cat can suggest real, recurring, in-person activities
// instead of just chatting. Both sources embed JSON-LD <script> blocks in
// their public search HTML - no API key needed, and neither site's
// robots.txt disallows these search paths.

export interface NormalizedEvent {
  source: 'Meetup' | 'Eventbrite';
  title: string;
  url: string;
  startDate: string | null;
  venue: string | null;
  group: string | null;
  groupUrl: string | null;
}

export interface TallinnEventsResult {
  meetup: NormalizedEvent[];
  eventbrite: NormalizedEvent[];
}

export const DEFAULT_KEYWORDS = ['art', 'board games', 'hiking', 'book club', 'language exchange', 'music'];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

export function extractLdJson(html: string): unknown[] {
  const blocks: unknown[] = [];
  const scriptRe = /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // skip malformed blocks
    }
  }
  return blocks;
}

interface SchemaEvent {
  '@type'?: string;
  name?: string;
  url?: string;
  startDate?: string;
  location?: { name?: string; address?: { streetAddress?: string } };
  organizer?: { name?: string; url?: string };
  performer?: string;
}

export function parseMeetupEvents(html: string): NormalizedEvent[] {
  const events: SchemaEvent[] = [];
  for (const block of extractLdJson(html)) {
    const arr = Array.isArray(block) ? block : [block];
    for (const item of arr as SchemaEvent[]) {
      if (item?.['@type'] === 'Event') events.push(item);
    }
  }

  return events
    .filter((ev) => ev.name && ev.url)
    .map((ev) => ({
      source: 'Meetup' as const,
      title: ev.name!,
      url: ev.url!,
      startDate: ev.startDate ?? null,
      venue: ev.location?.name || ev.location?.address?.streetAddress || null,
      group: ev.organizer?.name || ev.performer || null,
      groupUrl: ev.organizer?.url ?? null,
    }));
}

export function parseEventbriteEvents(html: string): NormalizedEvent[] {
  const events: SchemaEvent[] = [];
  for (const block of extractLdJson(html) as Array<{ '@type'?: string; itemListElement?: Array<{ item?: SchemaEvent }> }>) {
    if (block?.['@type'] === 'ItemList' && Array.isArray(block.itemListElement)) {
      for (const li of block.itemListElement) {
        if (li?.item?.['@type'] === 'Event') events.push(li.item);
      }
    }
  }

  return events
    .filter((ev) => ev.name && ev.url)
    .map((ev) => ({
      source: 'Eventbrite' as const,
      title: ev.name!,
      url: ev.url!,
      startDate: ev.startDate ?? null,
      venue: ev.location?.name || ev.location?.address?.streetAddress || null,
      group: null, // Eventbrite's public listing schema doesn't expose an organizer/community
      groupUrl: null,
    }));
}

async function fetchMeetupEvents(keyword?: string): Promise<NormalizedEvent[]> {
  const url = new URL('https://www.meetup.com/find/');
  url.searchParams.set('location', 'ee--Tallinn');
  url.searchParams.set('source', 'EVENTS');
  if (keyword) url.searchParams.set('keywords', keyword);

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  return parseMeetupEvents(await res.text());
}

async function fetchEventbriteEvents(keyword?: string): Promise<NormalizedEvent[]> {
  const slug = keyword ? keyword.trim().toLowerCase().replace(/\s+/g, '-') : 'events';
  const url = `https://www.eventbrite.com/d/estonia--tallinn/${encodeURIComponent(slug)}/`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  return parseEventbriteEvents(await res.text());
}

export async function findTallinnEvents(keywords: string[] = DEFAULT_KEYWORDS): Promise<TallinnEventsResult> {
  const searches = keywords.length ? keywords : [undefined];
  const meetupSeen = new Map<string, NormalizedEvent>();
  const eventbriteSeen = new Map<string, NormalizedEvent>();

  await Promise.all(
    searches.map(async (kw) => {
      const [meetup, eventbrite] = await Promise.all([fetchMeetupEvents(kw), fetchEventbriteEvents(kw)]);
      for (const ev of meetup) meetupSeen.set(ev.url, ev);
      for (const ev of eventbrite) eventbriteSeen.set(ev.url, ev);
    })
  );

  const byDate = (a: NormalizedEvent, b: NormalizedEvent) => (a.startDate || '').localeCompare(b.startDate || '');

  return {
    meetup: [...meetupSeen.values()].sort(byDate),
    eventbrite: [...eventbriteSeen.values()].sort(byDate),
  };
}
