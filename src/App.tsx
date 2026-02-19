import { useState, useEffect, useCallback } from 'react';
import { Star, Heart, Sparkles, Zap, Trophy, Gift, Settings, Home, User, Volume2, VolumeX, Eye } from 'lucide-react';
import {
  GameStats, Achievement, GameSettings,
  computeLevel, feedCat, playCat, petCat,
  checkAchievements, buyItem,
} from './game';
import { loadStats, saveStats, loadSettings, saveSettings, loadAchievements, saveAchievements } from './storage';
import { playFeedSound, playPlaySound, playPetSound, playLevelUpSound, playBuySound, playAchievementSound } from './sound';
import { ChatBox } from './ChatBox';

type Screen = 'home' | 'shop' | 'achievements' | 'profile' | 'settings' | 'chat';

function App() {
  const [gameStats, setGameStats] = useState<GameStats>(loadStats);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [achievements, setAchievements] = useState<Achievement[]>(loadAchievements);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [catAnimation, setCatAnimation] = useState('idle');
  const [showReward, setShowReward] = useState(false);
  const [rewardText, setRewardText] = useState('');

  useEffect(() => { saveStats(gameStats); }, [gameStats]);
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveAchievements(achievements); }, [achievements]);

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

  const renderCat = () => (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Pet ${settings.catName}`}
      className={`relative w-32 h-36 mx-auto ${getAnimationClass()} cursor-pointer`}
      onClick={handlePet}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePet(); } }}
    >
      <div className="relative transform-gpu">
        {/* Head — blocky 8-bit */}
        <div
          className="w-20 h-20 bg-black mx-auto mb-1 relative border-4 border-[#FF00FF]"
          style={{ boxShadow: '0 0 12px #FF00FF, inset 0 0 12px rgba(255,0,255,0.08)' }}
        >
          {/* Ears */}
          <div className="absolute -top-4 left-0 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-[#FF00FF]" />
          <div className="absolute -top-4 right-0 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-[#FF00FF]" />
          {/* Eyes */}
          <div
            className={`absolute top-5 left-3 w-3 h-3 bg-[#00FFFF] ${settings.reducedMotion ? '' : 'animate-blink'}`}
            style={{ boxShadow: '0 0 8px #00FFFF' }}
          />
          <div
            className={`absolute top-5 right-3 w-3 h-3 bg-[#00FFFF] ${settings.reducedMotion ? '' : 'animate-blink'}`}
            style={{ boxShadow: '0 0 8px #00FFFF' }}
          />
          {/* Nose */}
          <div
            className="absolute top-10 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-[#FF6600]"
            style={{ boxShadow: '0 0 5px #FF6600' }}
          />
          {/* Mouth */}
          <div className="absolute top-12 left-[28px] flex space-x-2">
            <div className="w-1 h-1 bg-[#FF00FF]" />
            <div className="w-1 h-1 bg-[#FF00FF]" />
          </div>
        </div>
        {/* Body */}
        <div
          className="w-14 h-10 bg-black border-2 border-[#FF00FF] mx-auto"
          style={{ boxShadow: '0 0 8px #FF00FF' }}
        />
        {/* Tail */}
        <div
          className={`absolute -right-5 bottom-2 w-7 h-2 bg-[#FF00FF] transform rotate-12 ${settings.reducedMotion ? '' : 'animate-tail-wag'}`}
          style={{ boxShadow: '0 0 8px #FF00FF' }}
        />
      </div>
    </div>
  );

  const renderHomeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
      <div className="relative">
        {renderCat()}
        {showReward && (
          <div
            role="status"
            aria-live="polite"
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black border-2 border-[#FFFF00] text-[#FFFF00] px-3 py-1 text-[7px] font-bold animate-bounce whitespace-nowrap"
            style={{ textShadow: '0 0 8px #FFFF00', boxShadow: '0 0 10px #FFFF00' }}
          >
            {rewardText}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div
          className="flex items-center justify-between border border-[#00FF00] p-3"
          style={{ boxShadow: '0 0 6px rgba(0,255,0,0.3)' }}
        >
          <span className="text-[#00FF00] text-[8px]">LVL {gameStats.level}</span>
          <span className="text-[#FFFF00] text-[8px]" style={{ textShadow: '0 0 6px #FFFF00' }}>
            {gameStats.coins} SD
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#FF00FF] text-[7px]">HAPPY</span>
            <span className="text-[#FF00FF] text-[7px]">{gameStats.happiness}%</span>
          </div>
          <div className="w-full bg-black h-3 border border-[#FF00FF]" role="progressbar" aria-valuenow={gameStats.happiness} aria-valuemin={0} aria-valuemax={100} aria-label="Happiness">
            <div className="bg-[#FF00FF] h-full transition-all duration-500" style={{ width: `${gameStats.happiness}%`, boxShadow: '0 0 6px #FF00FF' }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#00FFFF] text-[7px]">ENERGY</span>
            <span className="text-[#00FFFF] text-[7px]">{gameStats.energy}%</span>
          </div>
          <div className="w-full bg-black h-3 border border-[#00FFFF]" role="progressbar" aria-valuenow={gameStats.energy} aria-valuemin={0} aria-valuemax={100} aria-label="Energy">
            <div className="bg-[#00FFFF] h-full transition-all duration-500" style={{ width: `${gameStats.energy}%`, boxShadow: '0 0 6px #00FFFF' }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#FFFF00] text-[7px]">XP</span>
            <span className="text-[#FFFF00] text-[7px]">{gameStats.experience % 100}/100</span>
          </div>
          <div className="w-full bg-black h-3 border border-[#FFFF00]" role="progressbar" aria-valuenow={gameStats.experience % 100} aria-valuemin={0} aria-valuemax={100} aria-label="Experience">
            <div className="bg-[#FFFF00] h-full transition-all duration-500" style={{ width: `${gameStats.experience % 100}%`, boxShadow: '0 0 6px #FFFF00' }} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleFeed}
            disabled={gameStats.coins < 10}
            aria-label="Feed cat for 10 stardust"
            className="border-2 border-[#00FF00] disabled:border-gray-800 bg-black text-[#00FF00] disabled:text-gray-800 py-3 px-4 text-[7px] active:translate-y-1 transition-transform"
            style={{ boxShadow: gameStats.coins >= 10 ? '0 0 8px rgba(0,255,0,0.5)' : 'none' }}
          >
            <Heart className="w-4 h-4 mx-auto mb-1" aria-hidden="true" />
            FEED (10)
          </button>
          <button
            onClick={handlePlay}
            disabled={gameStats.energy < 20}
            aria-label="Play with cat, costs 20 energy"
            className="border-2 border-[#FF00FF] disabled:border-gray-800 bg-black text-[#FF00FF] disabled:text-gray-800 py-3 px-4 text-[7px] active:translate-y-1 transition-transform"
            style={{ boxShadow: gameStats.energy >= 20 ? '0 0 8px rgba(255,0,255,0.5)' : 'none' }}
          >
            <Sparkles className="w-4 h-4 mx-auto mb-1" aria-hidden="true" />
            PLAY
          </button>
        </div>
        <button
          onClick={() => setCurrentScreen('chat' as Screen)}
          aria-label="Chat with your cosmic cat"
          className="w-full border-2 border-[#00FFFF] bg-black text-[#00FFFF] py-3 px-4 text-[7px] active:translate-y-1 transition-transform"
          style={{ boxShadow: '0 0 8px rgba(0,255,255,0.5)' }}
        >
          <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          CHAT
        </button>
      </div>
    </div>
  );

  const shopItems = [
    { label: 'STAR TREATS', desc: '+30 HAPPY', cost: 25, effect: { happiness: 30 }, icon: <Star className="w-5 h-5 text-[#FFFF00]" aria-hidden="true" />, color: '#FFFF00' },
    { label: 'ENERGY BOOST', desc: '+50 ENERGY', cost: 40, effect: { energy: 50 }, icon: <Zap className="w-5 h-5 text-[#00FFFF]" aria-hidden="true" />, color: '#00FFFF' },
    { label: 'MYSTERY BOX', desc: 'RANDOM REWARD', cost: 100, effect: { happiness: Math.floor(Math.random() * 30) + 10, energy: Math.floor(Math.random() * 30) + 10, experience: Math.floor(Math.random() * 30) + 10 }, icon: <Gift className="w-5 h-5 text-[#FF00FF]" aria-hidden="true" />, color: '#FF00FF' },
  ];

  const renderShopScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-[10px] font-bold text-center mb-6 text-[#00FFFF]" style={{ textShadow: '0 0 10px #00FFFF' }}>
        // SHOP //
      </h2>
      <div className="space-y-4">
        {shopItems.map(item => (
          <div key={item.label} className="border border-[#00FFFF] p-4 flex items-center justify-between bg-black" style={{ boxShadow: '0 0 5px rgba(0,255,255,0.2)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 border-2 bg-black flex items-center justify-center" style={{ borderColor: item.color, boxShadow: `0 0 8px ${item.color}` }}>
                {item.icon}
              </div>
              <div>
                <h3 className="text-[8px] font-bold text-white">{item.label}</h3>
                <p className="text-[7px] text-[#00FFFF] mt-1">{item.desc}</p>
              </div>
            </div>
            <button
              onClick={() => handleBuy(item.cost, item.effect, `Bought ${item.label}!`)}
              disabled={gameStats.coins < item.cost}
              aria-label={`Buy ${item.label} for ${item.cost} stardust`}
              className="border-2 border-[#FFFF00] disabled:border-gray-800 bg-black text-[#FFFF00] disabled:text-gray-800 px-3 py-2 text-[8px]"
            >
              {item.cost}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const achievementIcons: Record<string, React.ReactNode> = {
    '1': <Star className="w-5 h-5" aria-hidden="true" />,
    '2': <Heart className="w-5 h-5" aria-hidden="true" />,
    '3': <Sparkles className="w-5 h-5" aria-hidden="true" />,
    '4': <Trophy className="w-5 h-5" aria-hidden="true" />,
  };

  const renderAchievementsScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-[10px] font-bold text-center mb-6 text-[#FFFF00]" style={{ textShadow: '0 0 10px #FFFF00' }}>
        // WINS //
      </h2>
      <div className="space-y-3" role="list" aria-label="Achievements list">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            role="listitem"
            className={`p-4 flex items-center space-x-3 border ${achievement.unlocked ? 'border-[#FFFF00]' : 'border-gray-800'}`}
            style={achievement.unlocked ? { boxShadow: '0 0 8px rgba(255,255,0,0.3)' } : {}}
          >
            <div className={`w-10 h-10 flex items-center justify-center border-2 ${achievement.unlocked ? 'border-[#FFFF00] text-[#FFFF00]' : 'border-gray-800 text-gray-700'}`}>
              {achievementIcons[achievement.id]}
            </div>
            <div className="flex-1">
              <h3 className={`text-[8px] font-bold ${achievement.unlocked ? 'text-[#FFFF00]' : 'text-gray-700'}`}>
                {achievement.title}
              </h3>
              <p className="text-[7px] text-gray-600 mt-1">{achievement.description}</p>
            </div>
            {achievement.unlocked && (
              <Trophy className="w-5 h-5 text-[#FFFF00]" aria-label="Unlocked" style={{ filter: 'drop-shadow(0 0 5px #FFFF00)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfileScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-[10px] font-bold text-center mb-6 text-[#FF00FF]" style={{ textShadow: '0 0 10px #FF00FF' }}>
        // PLAYER //
      </h2>
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto border-4 border-[#FF00FF] bg-black flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(255,0,255,0.5)' }}>
          <User className="w-12 h-12 text-[#FF00FF]" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="text-[8px] font-bold text-white">COSMIC GUARDIAN</h3>
          <p className="text-[7px] text-[#FF00FF] mt-2" style={{ textShadow: '0 0 6px #FF00FF' }}>
            LVL {gameStats.level} CAT KEEPER
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="border border-[#FFFF00] p-3 text-center bg-black">
            <div className="text-xl font-bold text-[#FFFF00]" style={{ textShadow: '0 0 8px #FFFF00' }}>{gameStats.coins}</div>
            <div className="text-[7px] text-gray-500 mt-1">COINS</div>
          </div>
          <div className="border border-[#00FFFF] p-3 text-center bg-black">
            <div className="text-xl font-bold text-[#00FFFF]" style={{ textShadow: '0 0 8px #00FFFF' }}>{gameStats.experience}</div>
            <div className="text-[7px] text-gray-500 mt-1">XP</div>
          </div>
        </div>
        <button
          onClick={() => setCurrentScreen('settings')}
          aria-label="Open settings"
          className="w-full border-2 border-gray-700 bg-black text-gray-500 py-3 text-[8px] flex items-center justify-center space-x-2 hover:border-[#FF00FF] hover:text-[#FF00FF] transition-colors"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
          <span>SETTINGS</span>
        </button>
      </div>
    </div>
  );

  const renderSettingsScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-[10px] font-bold text-center mb-6 text-[#00FF00]" style={{ textShadow: '0 0 10px #00FF00' }}>
        // CONFIG //
      </h2>
      <div className="space-y-5 max-w-sm mx-auto">
        <div className="space-y-2">
          <label htmlFor="cat-name" className="text-[#00FFFF] text-[7px] font-medium">CAT NAME:</label>
          <input
            id="cat-name"
            type="text"
            maxLength={20}
            value={settings.catName}
            onChange={e => setSettings(prev => ({ ...prev, catName: e.target.value }))}
            className="w-full bg-black border-2 border-[#00FFFF] px-4 py-2 text-[#00FFFF] text-[8px] focus:outline-none focus:border-[#FF00FF] focus:text-[#FF00FF]"
          />
        </div>

        <div className="flex items-center justify-between border border-[#9900FF] p-4" style={{ boxShadow: '0 0 5px rgba(153,0,255,0.2)' }}>
          <div className="flex items-center space-x-3">
            {settings.soundEnabled
              ? <Volume2 className="w-4 h-4 text-[#9900FF]" aria-hidden="true" />
              : <VolumeX className="w-4 h-4 text-gray-700" aria-hidden="true" />}
            <span className="text-[8px] text-white">SOUND FX</span>
          </div>
          <button
            role="switch"
            aria-checked={settings.soundEnabled}
            aria-label="Toggle sound effects"
            onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className={`w-12 h-6 relative border-2 transition-colors duration-200 ${settings.soundEnabled ? 'border-[#9900FF] bg-[#9900FF]/20' : 'border-gray-700 bg-black'}`}
          >
            <span className={`block w-5 h-4 bg-white absolute top-0.5 transition-transform duration-200 ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between border border-[#9900FF] p-4">
          <div className="flex items-center space-x-3">
            <Eye className="w-4 h-4 text-[#9900FF]" aria-hidden="true" />
            <span className="text-[8px] text-white">REDUCE MOTION</span>
          </div>
          <button
            role="switch"
            aria-checked={settings.reducedMotion}
            aria-label="Toggle reduced motion"
            onClick={() => setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }))}
            className={`w-12 h-6 relative border-2 transition-colors duration-200 ${settings.reducedMotion ? 'border-[#9900FF] bg-[#9900FF]/20' : 'border-gray-700 bg-black'}`}
          >
            <span className={`block w-5 h-4 bg-white absolute top-0.5 transition-transform duration-200 ${settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <button
          onClick={() => setCurrentScreen('profile')}
          aria-label="Back to profile"
          className="w-full border-2 border-[#00FF00] bg-black text-[#00FF00] py-3 text-[8px] mt-4"
          style={{ boxShadow: '0 0 8px rgba(0,255,0,0.3)' }}
        >
          BACK
        </button>
      </div>
    </div>
  );

  const renderChatScreen = () => (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-[#00FFFF]">
        <h2 className="text-[10px] font-bold text-center text-[#00FFFF]" style={{ textShadow: '0 0 10px #00FFFF' }}>
          // CHAT WITH {settings.catName.toUpperCase()} //
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatBox catName={settings.catName} inline={true} />
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
      case 'chat': return renderChatScreen();
      default: return renderHomeScreen();
    }
  };

  const navItems: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: 'home', icon: <Home className="w-5 h-5" aria-hidden="true" />, label: 'Home' },
    { screen: 'shop', icon: <Gift className="w-5 h-5" aria-hidden="true" />, label: 'Shop' },
    { screen: 'achievements', icon: <Trophy className="w-5 h-5" aria-hidden="true" />, label: 'Achievements' },
    { screen: 'profile', icon: <User className="w-5 h-5" aria-hidden="true" />, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen retro-bg relative overflow-hidden">
      {/* Neon pixel starfield */}
      {!settings.reducedMotion && (
        <div className="absolute inset-0" aria-hidden="true">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className={`absolute animate-twinkle-3d ${i % 3 === 0 ? 'bg-[#FF00FF]' : i % 3 === 1 ? 'bg-[#00FFFF]' : 'bg-[#00FF00]'}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '2px',
                height: '2px',
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main container */}
      <div
        className="relative z-10 max-w-sm mx-auto min-h-screen bg-black border-x-2 border-[#FF00FF] flex flex-col font-pixel"
        style={{ boxShadow: '0 0 30px rgba(255,0,255,0.25)' }}
      >
        {/* Header */}
        <header className="bg-black p-4 border-b-2 border-[#FF00FF]" style={{ boxShadow: '0 2px 15px rgba(255,0,255,0.3)' }}>
          <h1
            className="text-[11px] font-bold text-center text-[#FF00FF]"
            style={{ textShadow: '0 0 10px #FF00FF, 0 0 20px #FF00FF' }}
          >
            {settings.catName}
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {renderCurrentScreen()}
        </main>

        {/* Bottom Navigation */}
        <nav
          aria-label="Main navigation"
          className="bg-black border-t-2 border-[#FF00FF] p-2"
          style={{ boxShadow: '0 -2px 15px rgba(255,0,255,0.3)' }}
        >
          <div className="flex justify-around">
            {navItems.map(({ screen, icon, label }) => (
              <button
                key={screen}
                onClick={() => setCurrentScreen(screen)}
                aria-label={label}
                aria-current={currentScreen === screen ? 'page' : undefined}
                className={`p-3 transition-all duration-200 ${currentScreen === screen ? 'text-[#FF00FF]' : 'text-gray-700 hover:text-gray-500'}`}
                style={currentScreen === screen ? { filter: 'drop-shadow(0 0 6px #FF00FF)' } : {}}
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
