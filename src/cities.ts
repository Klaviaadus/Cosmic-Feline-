export interface City {
  id: string;
  label: string;
  country: string;
  flag: string;
  timezone: string;
  meetupLocation: string; // meetup.com's location query param, e.g. "ee--Tallinn"
  eventbriteRegion: string; // eventbrite.com's /d/<region>/ path segment, e.g. "estonia--tallinn"
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
  },
  {
    id: 'tbilisi',
    label: 'Tbilisi',
    country: 'Georgia',
    flag: '🇬🇪',
    timezone: 'Asia/Tbilisi',
    meetupLocation: 'ge--Tbilisi',
    eventbriteRegion: 'georgia--tbilisi',
  },
  {
    id: 'riga',
    label: 'Riga',
    country: 'Latvia',
    flag: '🇱🇻',
    timezone: 'Europe/Riga',
    meetupLocation: 'lv--Riga',
    eventbriteRegion: 'latvia--riga',
  },
];

export const DEFAULT_CITY_ID = CITIES[0].id;

export function getCityById(id: string | null | undefined): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}
