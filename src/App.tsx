import { useState } from 'react';
import { Compass } from 'lucide-react';
import { ChatBox } from './ChatBox';
import { CITIES, DEFAULT_CITY_ID, getCityById } from './cities';

const CITY_STORAGE_KEY = 'selected_city';

function loadStoredCityId(): string {
  try {
    return localStorage.getItem(CITY_STORAGE_KEY) || DEFAULT_CITY_ID;
  } catch {
    return DEFAULT_CITY_ID;
  }
}

function App() {
  const [cityId, setCityId] = useState(loadStoredCityId);
  const city = getCityById(cityId);

  const selectCity = (id: string) => {
    setCityId(id);
    try {
      localStorage.setItem(CITY_STORAGE_KEY, id);
    } catch {
      // localStorage unavailable (private browsing, etc.) - just skip persisting
    }
  };

  return (
    <div className="h-dvh bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl h-full sm:h-screen sm:max-h-[900px] flex flex-col">
        {/* Header */}
        <div className="text-center py-2 sm:py-6 px-4 flex-shrink-0">
          <h1 className="text-xl sm:text-3xl md:text-5xl font-bold text-white mb-1 flex items-center justify-center gap-2">
            <Compass className="w-5 h-5 sm:w-8 sm:h-8 md:w-12 md:h-12" />
            Find Your People
          </h1>
          <p className="hidden sm:block text-purple-200 text-base md:text-lg mb-3">
            Real events. Real people. Right here in {city.label}.
          </p>

          {/* City picker */}
          <div className="flex flex-wrap justify-center gap-2">
            {CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCity(c.id)}
                className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors border ${
                  c.id === city.id
                    ? 'bg-white text-purple-700 border-white'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {c.flag} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
          <ChatBox key={city.id} city={city} />
        </div>
      </div>
    </div>
  );
}

export default App;
