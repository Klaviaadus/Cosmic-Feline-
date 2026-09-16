import { describe, it, expect } from 'vitest';
import { formatEventsMessage, type AppEventsResult } from './eventsClient';
import { getCityById } from './cities';
import type { NormalizedEvent } from './lib/events';
import type { NormalizedCommunity } from './lib/telegram';

const tallinn = getCityById('tallinn');

function meetupEvent(overrides: Partial<NormalizedEvent>): NormalizedEvent {
  return {
    source: 'Meetup',
    title: 'Some Event',
    url: 'https://www.meetup.com/some-group/events/1/',
    startDate: '2026-09-20T18:00:00.000Z',
    venue: 'Some Venue',
    group: 'Some Group',
    groupUrl: 'https://www.meetup.com/some-group/',
    ...overrides,
  };
}

function result(overrides: Partial<AppEventsResult>): AppEventsResult {
  return { meetup: [], eventbrite: [], communities: [], ...overrides };
}

describe('formatEventsMessage', () => {
  it('reports no events found when every source is empty', () => {
    const message = formatEventsMessage(result({}), tallinn);
    expect(message).toContain(`Couldn't find any upcoming events in ${tallinn.label}`);
  });

  it('surfaces a group matching the searched keyword above a more frequent unrelated group', () => {
    const events = [
      // "Generic Social" posts more events but has nothing to do with "hiking"
      meetupEvent({ group: 'Generic Social', title: 'Coffee meetup', url: 'https://x/1' }),
      meetupEvent({ group: 'Generic Social', title: 'Board games night', url: 'https://x/2' }),
      meetupEvent({ group: 'Generic Social', title: 'Language cafe', url: 'https://x/3' }),
      // The one genuinely relevant group has only a single upcoming event
      meetupEvent({ group: 'Tbilisi Hikers', title: 'Weekend hiking trip', url: 'https://x/4' }),
    ];

    const message = formatEventsMessage(result({ meetup: events }), tallinn, 'hiking');
    const hikersIndex = message.indexOf('Tbilisi Hikers');
    const genericIndex = message.indexOf('Generic Social');

    expect(hikersIndex).toBeGreaterThan(-1);
    expect(hikersIndex).toBeLessThan(genericIndex);
  });

  it('adds an honest disclaimer when nothing actually matches the searched keyword', () => {
    const events = [
      meetupEvent({ group: 'Generic Social', title: 'Coffee meetup' }),
      meetupEvent({ group: 'Language Exchange Group', title: 'Weekly language cafe' }),
    ];

    const message = formatEventsMessage(result({ meetup: events }), tallinn, 'pottery');

    expect(message).toContain('No dedicated "pottery" groups found');
    expect(message).not.toContain('Recurring groups (worth showing up to more than once):');
  });

  it('does not show a disclaimer when no keyword was searched (e.g. "Surprise me")', () => {
    const events = [meetupEvent({ group: 'Generic Social', title: 'Coffee meetup' })];

    const message = formatEventsMessage(result({ meetup: events }), tallinn);

    expect(message).toContain('Recurring groups (worth showing up to more than once):');
    expect(message).not.toContain('No dedicated');
  });

  it('lists Telegram communities with a join link and member count', () => {
    const communities: NormalizedCommunity[] = [
      { source: 'Telegram', name: 'Tallinn Hikers Club', url: 'https://t.me/tallinnhikers', memberCount: 512 },
    ];

    const message = formatEventsMessage(result({ communities }), tallinn, 'hiking');

    expect(message).toContain('Telegram communities matching "hiking" you can join directly:');
    expect(message).toContain('Tallinn Hikers Club (512 members)');
    expect(message).toContain('https://t.me/tallinnhikers');
  });

  it('does not report "no events found" when only Telegram communities were found', () => {
    const communities: NormalizedCommunity[] = [
      { source: 'Telegram', name: 'Tallinn Hikers Club', url: 'https://t.me/tallinnhikers', memberCount: null },
    ];

    const message = formatEventsMessage(result({ communities }), tallinn, 'hiking');

    expect(message).not.toContain("Couldn't find any upcoming events");
  });
});
