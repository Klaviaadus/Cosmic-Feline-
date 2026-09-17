export interface City {
  id: string;
  label: string;
  country: string;
  flag: string;
  timezone: string;
  meetupLocation: string; // meetup.com's location query param, e.g. "ee--Tallinn"
  eventbriteRegion: string; // eventbrite.com's /d/<region>/ path segment, e.g. "estonia--tallinn"
  telegramSlug: string; // telegram-groups.com's /<slug>-telegram-groups/ path segment
}

export const CITIES: City[] = [
  {
    id: 'tallinn',
    label: 'Tallinn',
    country: 'Estonia',
    flag: '🇪🇪',
    timezone: 'Europe/Tallinn',
    meetupLocation: 'ee--Tallinn',
    eventbriteRegion: 'estonia--tallinn',
    telegramSlug: 'tallinn',
  },
  {
    id: 'tbilisi',
    label: 'Tbilisi',
    country: 'Georgia',
    flag: '🇬🇪',
    timezone: 'Asia/Tbilisi',
    meetupLocation: 'ge--Tbilisi',
    eventbriteRegion: 'georgia--tbilisi',
    telegramSlug: 'tbilisi',
  },
  {
    id: 'riga',
    label: 'Riga',
    country: 'Latvia',
    flag: '🇱🇻',
    timezone: 'Europe/Riga',
    meetupLocation: 'lv--Riga',
    eventbriteRegion: 'latvia--riga',
    telegramSlug: 'riga',
  },
  {
    id: 'london',
    label: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    timezone: 'Europe/London',
    meetupLocation: 'gb--London',
    eventbriteRegion: 'united-kingdom--london',
    telegramSlug: 'london',
  },
  {
    id: 'berlin',
    label: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    timezone: 'Europe/Berlin',
    meetupLocation: 'de--Berlin',
    eventbriteRegion: 'germany--berlin',
    telegramSlug: 'berlin',
  },
];

export const DEFAULT_CITY_ID = CITIES[0].id;

export function getCityById(id: string | null | undefined): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}
