import { describe, it, expect } from 'vitest';
import { CITIES, DEFAULT_CITY_ID, getCityById } from './cities';

describe('cities', () => {
  it('resolves a known city by id', () => {
    const city = getCityById('tbilisi');
    expect(city.label).toBe('Tbilisi');
    expect(city.country).toBe('Georgia');
  });

  it('falls back to the default city for an unknown or missing id', () => {
    expect(getCityById('nonexistent').id).toBe(DEFAULT_CITY_ID);
    expect(getCityById(undefined).id).toBe(DEFAULT_CITY_ID);
    expect(getCityById(null).id).toBe(DEFAULT_CITY_ID);
  });

  it('gives every city a distinct meetup location and eventbrite region', () => {
    const meetupLocations = new Set(CITIES.map((c) => c.meetupLocation));
    const eventbriteRegions = new Set(CITIES.map((c) => c.eventbriteRegion));
    expect(meetupLocations.size).toBe(CITIES.length);
    expect(eventbriteRegions.size).toBe(CITIES.length);
  });
});
