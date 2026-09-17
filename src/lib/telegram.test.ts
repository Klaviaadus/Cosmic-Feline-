import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseTelegramListing, findTelegramCommunities, countTelegramGroups } from './telegram';

const SAMPLE_CARD = (name: string, username: string, members: string) => `
  <div class="gc" onclick="location.href='/tallinn-telegram-groups/listing/abc123/'" role="listitem">
    <div class="ca hp" style="background:#3a1a1a">
      <img src="/avatar/${username}" alt="${name}" width="48" height="48">
    </div>
    <div class="cb">
      <a href="/tallinn-telegram-groups/listing/abc123/" class="ct">${name}</a>
    </div>
    <div class="cm">
      <div class="mem">👥 ${members}</div>
    </div>
  </div>
`;

describe('parseTelegramListing', () => {
  it('extracts name, join link, and member count from listing cards', () => {
    const html = SAMPLE_CARD('Tallinn Hikers', 'tallinnhikers', '1,234');
    const groups = parseTelegramListing(html);

    expect(groups).toEqual([
      { source: 'Telegram', name: 'Tallinn Hikers', url: 'https://t.me/tallinnhikers', memberCount: 1234 },
    ]);
  });

  it('decodes HTML entities in group names', () => {
    const html = SAMPLE_CARD('Sell &amp; Buy Latvia', 'sellbuylv', '100');
    const groups = parseTelegramListing(html);
    expect(groups[0].name).toBe('Sell & Buy Latvia');
  });

  it('skips cards missing a name or avatar', () => {
    const html = '<div class="gc"><div class="cb"></div></div>';
    expect(parseTelegramListing(html)).toEqual([]);
  });

  it('parses multiple cards from one page', () => {
    const html = SAMPLE_CARD('Group One', 'groupone', '50') + SAMPLE_CARD('Group Two', 'grouptwo', '75');
    expect(parseTelegramListing(html)).toHaveLength(2);
  });
});

describe('findTelegramCommunities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('only returns groups whose name actually matches the searched keyword', async () => {
    const html =
      SAMPLE_CARD('Tallinn Hikers Club', 'tallinnhikers', '500') +
      SAMPLE_CARD('Куплю/продам Estonia Market', 'estmarket', '5000');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => html }));

    const results = await findTelegramCommunities('tallinn', 'hikers');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Tallinn Hikers Club');
  });

  it('filters out known false-positive matches for Riga (Novaya Riga, Moscow suburb)', async () => {
    const html =
      SAMPLE_CARD('Новая Рига Соседи Чат', 'novrigachat', '3000') +
      SAMPLE_CARD('Рига Чат Латвия', 'rigachat', '400');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => html }));

    const results = await findTelegramCommunities('riga', 'чат');
    expect(results.map((r) => r.name)).toEqual(['Рига Чат Латвия']);
  });

  it('returns an empty array when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const results = await findTelegramCommunities('tallinn', 'hiking');
    expect(results).toEqual([]);
  });

  it('matches a Russian-named group via the English keyword "hiking" through the synonym list', async () => {
    const html = SAMPLE_CARD('Походы Тбилиси', 'tbilisihikes', '899');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => html }));

    const results = await findTelegramCommunities('tbilisi', 'hiking');
    expect(results.map((r) => r.name)).toEqual(['Походы Тбилиси']);
  });
});

describe('countTelegramGroups', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('counts every group on the page regardless of keyword', async () => {
    const html = SAMPLE_CARD('Group One', 'groupone', '50') + SAMPLE_CARD('Group Two', 'grouptwo', '75');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => html }));

    expect(await countTelegramGroups('tallinn')).toBe(2);
  });

  it('still excludes known false-positive cities (Riga/Novaya Riga)', async () => {
    const html =
      SAMPLE_CARD('Новая Рига Соседи Чат', 'novrigachat', '3000') +
      SAMPLE_CARD('Рига Чат Латвия', 'rigachat', '400');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => html }));

    expect(await countTelegramGroups('riga')).toBe(1);
  });

  it('returns 0 when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await countTelegramGroups('tallinn')).toBe(0);
  });
});
