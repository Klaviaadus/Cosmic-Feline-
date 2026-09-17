// Finds public Telegram communities for a city via telegram-groups.com's
// public directory pages. Telegram itself has no discovery mechanism (search
// only finds chats you already know), and there's no official API for this,
// but the directory's listing pages are public HTML with no login wall, and
// its robots.txt only disallows /admin/ and /go/ (an internal click-tracking
// redirect we don't need).
//
// Each listing card's avatar image is served from /avatar/<telegram-username>,
// which conveniently is also the group's real public @username - confirmed
// against several groups' detail-page JSON-LD ("sameAs": "https://t.me/...")
// that this always matches, so there's no need to fetch a detail page per
// group just to resolve the join link.
import { SCRAPER_UA } from './events';

export interface NormalizedCommunity {
  source: 'Telegram';
  name: string;
  url: string;
  memberCount: number | null;
}

const MAX_COMMUNITIES = 8;

// Some city pages on this directory are polluted by an unrelated same-name
// place - e.g. Riga's page is dominated by "Novaya Riga", a Moscow-region
// highway/suburb in Russia, not Riga, Latvia. Filter those out rather than
// show confusing, wrong-city results.
const EXCLUDE_TERMS: Record<string, string[]> = {
  riga: ['новая рига', 'рублев', 'красногорск', 'истра', 'жуковк'],
};

// Group names in Tallinn/Tbilisi/Riga's directories skew Russian-language,
// while our topic chips are fixed English labels - a literal substring match
// on "hiking" misses a group named "Походы Тбилиси" entirely. Since the chip
// set is small and fixed (see TOPIC_CHIPS in ChatBox.tsx), a bounded synonym
// list per known topic is worth maintaining rather than building general
// translation - confirmed against a real case (Tbilisi's hiking group).
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  'board games': ['настольны', 'настолк', 'мафия'],
  'language exchange': ['языковой обмен', 'языковая практика', 'разговорный клуб'],
  hiking: ['поход', 'хайкинг', 'треккинг'],
  'book club': ['книжный клуб', 'книжн'],
  art: ['искусств', 'арт-', 'творчеств'],
  music: ['музык'],
};

function matchTerms(keywordLower: string): string[] {
  return [keywordLower, ...(KEYWORD_SYNONYMS[keywordLower] ?? [])];
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseTelegramListing(html: string): NormalizedCommunity[] {
  const cards = html.split('<div class="gc"').slice(1);
  const results: NormalizedCommunity[] = [];

  for (const card of cards) {
    const nameMatch = card.match(/class="ct">([^<]*)<\/a>/);
    const avatarMatch = card.match(/src="\/avatar\/([^"]+)"/);
    if (!nameMatch || !avatarMatch) continue;

    const memberMatch = card.match(/class="mem">[^\d]*([\d,]+)/);

    results.push({
      source: 'Telegram',
      name: decodeHtmlEntities(nameMatch[1].trim()),
      url: `https://t.me/${avatarMatch[1]}`,
      memberCount: memberMatch ? parseInt(memberMatch[1].replace(/,/g, ''), 10) : null,
    });
  }

  return results;
}

// telegram-groups.com occasionally hangs indefinitely instead of erroring
// (likely throttling/blocking the request) rather than responding with a
// clean error - without a timeout, that hang runs past the edge function's
// own execution limit and takes the whole /api/events response down with it,
// including the otherwise-fine Meetup/Eventbrite results. Fail fast instead.
const FETCH_TIMEOUT_MS = 8000;

async function fetchCityGroups(citySlug: string): Promise<NormalizedCommunity[]> {
  let res: Response;
  try {
    res = await fetch(`https://www.telegram-groups.com/${citySlug}-telegram-groups/`, {
      headers: { 'User-Agent': SCRAPER_UA },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const groups = parseTelegramListing(await res.text());

  const excludeTerms = EXCLUDE_TERMS[citySlug] ?? [];
  if (!excludeTerms.length) return groups;
  return groups.filter((g) => !excludeTerms.some((term) => g.name.toLowerCase().includes(term)));
}

export async function findTelegramCommunities(citySlug: string, keyword: string): Promise<NormalizedCommunity[]> {
  const groups = await fetchCityGroups(citySlug);

  const terms = matchTerms(keyword.toLowerCase());
  const matching = groups.filter((g) => {
    const nameLower = g.name.toLowerCase();
    return terms.some((term) => nameLower.includes(term));
  });

  return matching.sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0)).slice(0, MAX_COMMUNITIES);
}

// Unfiltered group count for a city's directory page, used by the health
// check cron - independent of any keyword match, so a zero here means the
// page itself is unreachable or unparseable, not just a quiet week for one
// topic.
export async function countTelegramGroups(citySlug: string): Promise<number> {
  return (await fetchCityGroups(citySlug)).length;
}
