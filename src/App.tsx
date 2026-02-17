import React, { useState, useEffect, useCallback } from 'react';
import { Star, Heart, Sparkles, Zap, Trophy, Gift, Settings, Home, User, Volume2, VolumeX, Eye } from 'lucide-react';
import {
  GameStats, Achievement, GameSettings,
  computeLevel, feedCat, playCat, petCat,
  checkAchievements, buyItem,
} from './game';
import { loadStats, saveStats, loadSettings, saveSettings, loadAchievements, saveAchievements } from './storage';
import { playFeedSound, playPlaySound, playPetSound, playLevelUpSound, playBuySound, playAchievementSound } from './sound';

type Screen = 'home' | 'shop' | 'achievements' | 'profile' | 'settings';

function App() {
  const [gameStats, setGameStats] = useState<GameStats>(loadStats);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [achievements, setAchievements] = useState<Achievement[]>(loadAchievements);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [catAnimation, setCatAnimation] = useState('idle');
  const [showReward, setShowReward] = useState(false);
  const [rewardText, setRewardText] = useState('');

  // Persist state on change
  useEffect(() => { saveStats(gameStats); }, [gameStats]);
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveAchievements(achievements); }, [achievements]);

  // Check achievements whenever stats change
  useEffect(() => {
    const updated = checkAchievements(gameStats, achievements);
    const newUnlock = updated.find((a, i) => a.unlocked && !achievements[i].unlocked);
    if (newUnlock) {
      setAchievements(updated);
      if (settings.soundEnabled) playAchievementSound();
      showRewardAnimation(`Achievement: ${newUnlock.title}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStats]);

  const showRewardAnimation = (text: string) => {
    setRewardText(text);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2000);
  };

  // Level up logic
  useEffect(() => {
    const newLevel = computeLevel(gameStats.experience);
    if (newLevel > gameStats.level) {
      setGameStats(prev => ({ ...prev, level: newLevel, coins: prev.coins + 50 }));
      if (settings.soundEnabled) playLevelUpSound();
      showRewardAnimation('Level Up! +50 Coins');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStats.experience, gameStats.level]);

  const handleFeed = useCallback(() => {
    const result = feedCat(gameStats);
    if (!result) return;
    setGameStats(result);
    setCatAnimation('eating');
    if (settings.soundEnabled) playFeedSound();
    showRewardAnimation('+20 Happiness, +15 Energy');
    setTimeout(() => setCatAnimation('idle'), 2000);
  }, [gameStats, settings.soundEnabled]);

  const handlePlay = useCallback(() => {
    const result = playCat(gameStats);
    if (!result) return;
    setGameStats(result);
    setCatAnimation('playing');
    if (settings.soundEnabled) playPlaySound();
    showRewardAnimation('+15 Happiness, +15 Coins');
    setTimeout(() => setCatAnimation('idle'), 3000);
  }, [gameStats, settings.soundEnabled]);

  const handlePet = useCallback(() => {
    setGameStats(prev => petCat(prev));
    setCatAnimation('happy');
    if (settings.soundEnabled) playPetSound();
    setTimeout(() => setCatAnimation('idle'), 1500);
  }, [settings.soundEnabled]);

  const handleBuy = useCallback((cost: number, effect: Partial<GameStats>, label: string) => {
    const result = buyItem(gameStats, cost, effect);
    if (!result) return;
    setGameStats(result);
    if (settings.soundEnabled) playBuySound();
    showRewardAnimation(label);
  }, [gameStats, settings.soundEnabled]);

  const motionClass = settings.reducedMotion ? '' : 'animate-float-3d';

  const getAnimationClass = () => {
    if (settings.reducedMotion) return '';
    switch (catAnimation) {
      case 'eating': return 'animate-bounce';
      case 'playing': return 'animate-spin';
      case 'happy': return 'animate-pulse';
      default: return motionClass;
    }
  };

  // ── Render helpers ───────────────────────────────────

  const renderCat = () => (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Pet ${settings.catName}`}
      className={`relative w-32 h-32 mx-auto ${getAnimationClass()} cursor-pointer`}
      onClick={handlePet}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePet(); } }}
    >
      <div className="relative transform-gpu">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 rounded-full mx-auto mb-2 relative shadow-2xl border-2 border-purple-300/50">
          <div className="absolute -top-3 left-3 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-purple-400" />
          <div className="absolute -top-3 right-3 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-purple-400" />
          <div className={`absolute top-6 left-4 w-2 h-2 bg-cyan-300 rounded-full ${settings.reducedMotion ? '' : 'animate-blink'}`} />
          <div className={`absolute top-6 right-4 w-2 h-2 bg-cyan-300 rounded-full ${settings.reducedMotion ? '' : 'animate-blink'}`} />
          <div className="absolute top-9 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-400 rounded-full" />
        </div>
        <div className="w-16 h-12 bg-gradient-to-b from-purple-500 via-blue-600 to-purple-700 rounded-full mx-auto shadow-xl" />
        <div className={`absolute -right-6 bottom-2 w-8 h-3 bg-gradient-to-r from-blue-500 to-purple-400 rounded-full transform rotate-12 ${settings.reducedMotion ? '' : 'animate-tail-wag'}`} />
      </div>
    </div>
  );

  const renderHomeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
      <div className="relative">
        {renderCat()}
        {showReward && (
          <div role="status" aria-live="polite" className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold animate-bounce">
            {rewardText}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between bg-purple-800/30 rounded-lg p-3">
          <span className="text-purple-200">Level {gameStats.level}</span>
          <span className="text-yellow-400 font-bold">{gameStats.coins} Stardust</span>
        </div>

        {/* Happiness */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-pink-300 text-sm">Happiness</span>
            <span className="text-pink-300 text-sm">{gameStats.happiness}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={gameStats.happiness} aria-valuemin={0} aria-valuemax={100} aria-label="Happiness">
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full transition-all duration-500" style={{ width: `${gameStats.happiness}%` }} />
          </div>
        </div>

        {/* Energy */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-blue-300 text-sm">Energy</span>
            <span className="text-blue-300 text-sm">{gameStats.energy}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={gameStats.energy} aria-valuemin={0} aria-valuemax={100} aria-label="Energy">
            <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-500" style={{ width: `${gameStats.energy}%` }} />
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-yellow-300 text-sm">Experience</span>
            <span className="text-yellow-300 text-sm">{gameStats.experience % 100}/100</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={gameStats.experience % 100} aria-valuemin={0} aria-valuemax={100} aria-label="Experience">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500" style={{ width: `${gameStats.experience % 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <button
          onClick={handleFeed}
          disabled={gameStats.coins < 10}
          aria-label="Feed cat for 10 stardust"
          className="bg-gradient-to-r from-green-500 to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all duration-200"
        >
          <Heart className="w-5 h-5 mx-auto mb-1" aria-hidden="true" />
          Feed (10)
        </button>
        <button
          onClick={handlePlay}
          disabled={gameStats.energy < 20}
          aria-label="Play with cat, costs 20 energy"
          className="bg-gradient-to-r from-purple-500 to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all duration-200"
        >
          <Sparkles className="w-5 h-5 mx-auto mb-1" aria-hidden="true" />
          Play
        </button>
      </div>
    </div>
  );

  const shopItems = [
    { label: 'Star Treats', desc: '+30 Happiness', cost: 25, effect: { happiness: 30 }, icon: <Star className="w-6 h-6 text-white" aria-hidden="true" />, gradient: 'from-yellow-400 to-orange-400' },
    { label: 'Energy Boost', desc: '+50 Energy', cost: 40, effect: { energy: 50 }, icon: <Zap className="w-6 h-6 text-white" aria-hidden="true" />, gradient: 'from-blue-400 to-cyan-400' },
    { label: 'Mystery Box', desc: 'Random reward', cost: 100, effect: { happiness: Math.floor(Math.random() * 30) + 10, energy: Math.floor(Math.random() * 30) + 10, experience: Math.floor(Math.random() * 30) + 10 }, icon: <Gift className="w-6 h-6 text-white" aria-hidden="true" />, gradient: 'from-pink-400 to-purple-400' },
  ];

  const renderShopScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Cosmic Shop
      </h2>
      <div className="space-y-4">
        {shopItems.map(item => (
          <div key={item.label} className="bg-purple-800/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-r ${item.gradient} rounded-full flex items-center justify-center`}>
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-white">{item.label}</h3>
                <p className="text-gray-300 text-sm">{item.desc}</p>
              </div>
            </div>
            <button
              onClick={() => handleBuy(item.cost, item.effect, `Bought ${item.label}!`)}
              disabled={gameStats.coins < item.cost}
              aria-label={`Buy ${item.label} for ${item.cost} stardust`}
              className="bg-yellow-500 disabled:bg-gray-600 text-black disabled:text-gray-400 px-4 py-2 rounded-lg font-bold"
            >
              {item.cost}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const achievementIcons: Record<string, React.ReactNode> = {
    '1': <Star className="w-6 h-6" aria-hidden="true" />,
    '2': <Heart className="w-6 h-6" aria-hidden="true" />,
    '3': <Sparkles className="w-6 h-6" aria-hidden="true" />,
    '4': <Trophy className="w-6 h-6" aria-hidden="true" />,
  };

  const renderAchievementsScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Achievements
      </h2>
      <div className="space-y-3" role="list" aria-label="Achievements list">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            role="listitem"
            className={`rounded-xl p-4 flex items-center space-x-3 ${
              achievement.unlocked
                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
                : 'bg-gray-800/30 border border-gray-600/30'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              achievement.unlocked
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                : 'bg-gray-600 text-gray-400'
            }`}>
              {achievementIcons[achievement.id]}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                {achievement.title}
              </h3>
              <p className="text-gray-300 text-sm">{achievement.description}</p>
            </div>
            {achievement.unlocked && <Trophy className="w-6 h-6 text-yellow-400" aria-label="Unlocked" />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfileScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Profile
      </h2>
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-white" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Cosmic Guardian</h3>
          <p className="text-purple-300">Level {gameStats.level} Cat Caretaker</p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-purple-800/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{gameStats.coins}</div>
            <div className="text-sm text-gray-300">Total Coins</div>
          </div>
          <div className="bg-purple-800/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{gameStats.experience}</div>
            <div className="text-sm text-gray-300">Experience</div>
          </div>
        </div>
        <button
          onClick={() => setCurrentScreen('settings')}
          aria-label="Open settings"
          className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );

  const renderSettingsScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Settings
      </h2>
      <div className="space-y-5 max-w-sm mx-auto">
        {/* Cat name */}
        <div className="space-y-2">
          <label htmlFor="cat-name" className="text-purple-200 text-sm font-medium">Cat Name</label>
          <input
            id="cat-name"
            type="text"
            maxLength={20}
            value={settings.catName}
            onChange={e => setSettings(prev => ({ ...prev, catName: e.target.value }))}
            className="w-full bg-purple-800/30 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Sound toggle */}
        <div className="flex items-center justify-between bg-purple-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-purple-300" aria-hidden="true" /> : <VolumeX className="w-5 h-5 text-gray-400" aria-hidden="true" />}
            <span className="text-white font-medium">Sound Effects</span>
          </div>
          <button
            role="switch"
            aria-checked={settings.soundEnabled}
            aria-label="Toggle sound effects"
            onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${settings.soundEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Reduced motion toggle */}
        <div className="flex items-center justify-between bg-purple-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-purple-300" aria-hidden="true" />
            <span className="text-white font-medium">Reduce Motion</span>
          </div>
          <button
            role="switch"
            aria-checked={settings.reducedMotion}
            aria-label="Toggle reduced motion"
            onClick={() => setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }))}
            className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${settings.reducedMotion ? 'bg-purple-500' : 'bg-gray-600'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Back to profile */}
        <button
          onClick={() => setCurrentScreen('profile')}
          aria-label="Back to profile"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold mt-4"
        >
          Back to Profile
        </button>
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home': return renderHomeScreen();
      case 'shop': return renderShopScreen();
      case 'achievements': return renderAchievementsScreen();
      case 'profile': return renderProfileScreen();
      case 'settings': return renderSettingsScreen();
      default: return renderHomeScreen();
    }
  };

  const navItems: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: 'home', icon: <Home className="w-6 h-6" aria-hidden="true" />, label: 'Home' },
    { screen: 'shop', icon: <Gift className="w-6 h-6" aria-hidden="true" />, label: 'Shop' },
    { screen: 'achievements', icon: <Trophy className="w-6 h-6" aria-hidden="true" />, label: 'Achievements' },
    { screen: 'profile', icon: <User className="w-6 h-6" aria-hidden="true" />, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Starfield */}
      {!settings.reducedMotion && (
        <div className="absolute inset-0" aria-hidden="true">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-twinkle-3d"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-sm mx-auto min-h-screen bg-black/20 backdrop-blur-sm border-x border-purple-500/20 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-md p-4 border-b border-purple-500/20">
          <h1 className="text-xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {settings.catName}
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {renderCurrentScreen()}
        </main>

        {/* Bottom Navigation */}
        <nav aria-label="Main navigation" className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-md border-t border-purple-500/20 p-2">
          <div className="flex justify-around">
            {navItems.map(({ screen, icon, label }) => (
              <button
                key={screen}
                onClick={() => setCurrentScreen(screen)}
                aria-label={label}
                aria-current={currentScreen === screen ? 'page' : undefined}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  currentScreen === screen
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default App;
