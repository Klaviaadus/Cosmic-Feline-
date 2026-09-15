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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-screen max-h-[900px] flex flex-col">
        {/* Header */}
        <div className="text-center py-8 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Compass className="w-10 h-10 md:w-12 md:h-12" />
            Find Your People
          </h1>
          <p className="text-purple-200 text-lg mb-4">Real events. Real people. Right here in {city.label}.</p>

          {/* City picker */}
          <div className="flex justify-center gap-2">
            {CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCity(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
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
