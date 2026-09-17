import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { ChatBox } from "./ChatBox";
import { CITIES, DEFAULT_CITY_ID, getCityById } from "./cities";

const CITY_STORAGE_KEY = "selected_city";
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
      /* Storage is optional. */
    }
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#" aria-label="Find your people home">
          <span className="brand-mark">✳</span>
          <span>
            find your
            <br />
            people<span className="brand-period">.</span>
          </span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a className="active" href="#discover">
            Discover
          </a>
          <a href="#guide">
            Your local guide <ArrowUpRight size={14} />
          </a>
        </nav>
        <div className="location-select">
          <MapPin size={16} />
          <label className="sr-only" htmlFor="city">
            Your city
          </label>
          <select
            id="city"
            value={city.id}
            onChange={(e) => selectCity(e.target.value)}
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}, {c.country}
              </option>
            ))}
          </select>
        </div>
      </header>
      <main>
        <section className="intro">
          <div className="eyebrow">
            <span className="status-dot" /> LESS SCROLLING. MORE SHOWING UP.
          </div>
          <div className="intro-title">
            <h1>
              Your people are
              <br />
              out there<span className="coral">.</span>
            </h1>
            <p>
              A shared interest. A little courage.
              <br />
              The start of something real in <strong>{city.label}.</strong>
            </p>
          </div>
        </section>
        <section
          className="hero"
          aria-label="Find connections through shared interests"
        >
          <div className="hero-copy">
            <span className="hero-label">
              <Sparkles size={15} /> GOOD COMPANY STARTS HERE
            </span>
            <h2>
              Make room for
              <br />a little <em>serendipity.</em>
            </h2>
            <p>
              Find the groups, gatherings, and everyday adventures
              <br className="desktop-break" /> that turn strangers into familiar
              faces.
            </p>
            <a className="primary-button" href="#discover">
              Find your thing <ArrowDownRight size={19} />
            </a>
            <div className="hero-footnote">
              <span className="tiny-star">✳</span> Real people. Shared
              interests. In real life.
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="art-spark">✳</div>
            <div className="art-star">✦</div>
            <div className="illustration-card coffee-card">
              <span className="card-kicker">THE BEST PLANS START WITH</span>
              <div className="coffee-scene">
                <div className="coffee-cup cup-one">
                  <i />
                </div>
                <div className="coffee-cup cup-two">
                  <i />
                </div>
                <span className="coffee-spark">✧</span>
              </div>
              <strong>“Want to grab a coffee?”</strong>
              <span className="card-caption">
                A small hello goes a long way.
              </span>
            </div>
            <div className="hello-sticker">
              hello,
              <br />
              <em>new friends.</em>
              <span>☺</span>
            </div>
            <div className="ticket">
              <span className="ticket-icon">↗</span>
              <div>
                YOUR NEXT CHAPTER<strong>Somewhere you belong</strong>
              </div>
              <span className="ticket-edge">IRL</span>
            </div>
            <div className="little-note">
              a little outside your comfort zone ↗
            </div>
          </div>
        </section>
        <ChatBox key={city.id} city={city} />
      </main>
      <footer className="site-footer">
        <span className="footer-brand">✳ find your people.</span>
        <span>Less online. More out there.</span>
        <span>
          Made for real connection <span className="coral">↗</span>
        </span>
      </footer>
    </div>
  );
}
export default App;
