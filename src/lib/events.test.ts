import { describe, it, expect } from 'vitest';
import { extractLdJson, parseMeetupEvents, parseEventbriteEvents } from './events';

describe('extractLdJson', () => {
  it('parses valid JSON-LD script blocks', () => {
    const html = `<script type="application/ld+json">{"a":1}</script>`;
    expect(extractLdJson(html)).toEqual([{ a: 1 }]);
  });

  it('skips malformed JSON-LD blocks', () => {
    const html = `<script type="application/ld+json">{not valid json}</script>`;
    expect(extractLdJson(html)).toEqual([]);
  });
});

describe('parseMeetupEvents', () => {
  it('extracts events with group/organizer info', () => {
    const html = `<script type="application/ld+json">[{"@context":"https://schema.org","@type":"Event","name":"Board Games Night","url":"https://www.meetup.com/group/events/1/","startDate":"2026-09-20T18:00:00.000Z","location":{"@type":"Place","name":"Cafe X"},"organizer":{"@type":"Organization","name":"Tallinn Board Gamers","url":"https://www.meetup.com/group/"}}]</script>`;

    const events = parseMeetupEvents(html);
    expect(events).toEqual([
      {
        source: 'Meetup',
        title: 'Board Games Night',
        url: 'https://www.meetup.com/group/events/1/',
        startDate: '2026-09-20T18:00:00.000Z',
        venue: 'Cafe X',
        group: 'Tallinn Board Gamers',
        groupUrl: 'https://www.meetup.com/group/',
      },
    ]);
  });

  it('ignores events missing a name or url', () => {
    const html = `<script type="application/ld+json">[{"@type":"Event","startDate":"2026-09-20"}]</script>`;
    expect(parseMeetupEvents(html)).toEqual([]);
  });
});

describe('parseEventbriteEvents', () => {
  it('extracts events from an ItemList without organizer info', () => {
    const html = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@type":"Event","name":"Mafia Night","url":"https://www.eventbrite.com/e/1","startDate":"2026-09-19","location":{"@type":"Place","name":"GTC Cafe"}}}]}</script>`;

    const events = parseEventbriteEvents(html);
    expect(events).toEqual([
      {
        source: 'Eventbrite',
        title: 'Mafia Night',
        url: 'https://www.eventbrite.com/e/1',
        startDate: '2026-09-19',
        venue: 'GTC Cafe',
        group: null,
        groupUrl: null,
      },
    ]);
  });
});
