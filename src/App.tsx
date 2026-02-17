import React, { useState, useEffect } from 'react';
import { Star, Heart, Sparkles, Zap, Trophy, Gift, Settings, Home, User } from 'lucide-react';

interface GameStats {
  level: number;
  experience: number;
  happiness: number;
  energy: number;
  coins: number;
  lastFed: number;
  lastPlayed: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: React.ReactNode;
}

function App() {
  const [gameStats, setGameStats] = useState<GameStats>({
    level: 1,
    experience: 0,
    happiness: 80,
    energy: 70,
    coins: 100,
    lastFed: Date.now(),
    lastPlayed: Date.now()
  });

  const [currentScreen, setCurrentScreen] = useState<'home' | 'play' | 'shop' | 'achievements' | 'profile'>('home');
  const [catAnimation, setCatAnimation] = useState('idle');
  const [showReward, setShowReward] = useState(false);
  const [rewardText, setRewardText] = useState('');

  const [achievements] = useState<Achievement[]>([
    { id: '1', title: 'First Steps', description: 'Play with your cosmic feline for the first time', unlocked: true, icon: <Star className="w-6 h-6" /> },
    { id: '2', title: 'Caring Owner', description: 'Feed your feline 10 times', unlocked: false, icon: <Heart className="w-6 h-6" /> },
    { id: '3', title: 'Space Explorer', description: 'Reach level 5', unlocked: false, icon: <Sparkles className="w-6 h-6" /> },
    { id: '4', title: 'Cosmic Collector', description: 'Collect 1000 stardust coins', unlocked: false, icon: <Trophy className="w-6 h-6" /> }
  ]);

  // Game mechanics
  const feedCat = () => {
    if (gameStats.coins >= 10) {
      setGameStats(prev => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 20),
        energy: Math.min(100, prev.energy + 15),
        coins: prev.coins - 10,
        experience: prev.experience + 5,
        lastFed: Date.now()
      }));
      setCatAnimation('eating');
      showRewardAnimation('+20 Happiness, +15 Energy');
      setTimeout(() => setCatAnimation('idle'), 2000);
    }
  };

  const playCat = () => {
    if (gameStats.energy >= 20) {
      setGameStats(prev => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 15),
        energy: prev.energy - 20,
        coins: prev.coins + 15,
        experience: prev.experience + 10,
        lastPlayed: Date.now()
      }));
      setCatAnimation('playing');
      showRewardAnimation('+15 Happiness, +15 Coins');
      setTimeout(() => setCatAnimation('idle'), 3000);
    }
  };

  const petCat = () => {
    setGameStats(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 5),
      experience: prev.experience + 2
    }));
    setCatAnimation('happy');
    setTimeout(() => setCatAnimation('idle'), 1500);
  };

  const showRewardAnimation = (text: string) => {
    setRewardText(text);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2000);
  };

  // Level up logic
  useEffect(() => {
    const newLevel = Math.floor(gameStats.experience / 100) + 1;
    if (newLevel > gameStats.level) {
      setGameStats(prev => ({ ...prev, level: newLevel, coins: prev.coins + 50 }));
      showRewardAnimation(`Level Up! +50 Coins`);
    }
  }, [gameStats.experience, gameStats.level]);

  const renderCat = () => {
    const getAnimationClass = () => {
      switch (catAnimation) {
        case 'eating': return 'animate-bounce';
        case 'playing': return 'animate-spin';
        case 'happy': return 'animate-pulse';
        default: return 'animate-float-3d';
      }
    };

    return (
      <div className={`relative w-32 h-32 mx-auto ${getAnimationClass()} cursor-pointer`} onClick={petCat}>
        {/* Cat Body */}
        <div className="relative transform-gpu">
          {/* Cat Head */}
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 rounded-full mx-auto mb-2 relative shadow-2xl border-2 border-purple-300/50">
            {/* Cat Ears */}
            <div className="absolute -top-3 left-3 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-purple-400"></div>
            <div className="absolute -top-3 right-3 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-purple-400"></div>
            
            {/* Cat Eyes */}
            <div className="absolute top-6 left-4 w-2 h-2 bg-cyan-300 rounded-full animate-blink"></div>
            <div className="absolute top-6 right-4 w-2 h-2 bg-cyan-300 rounded-full animate-blink"></div>
            
            {/* Cat Nose */}
            <div className="absolute top-9 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-400 rounded-full"></div>
          </div>
          
          {/* Cat Body */}
          <div className="w-16 h-12 bg-gradient-to-b from-purple-500 via-blue-600 to-purple-700 rounded-full mx-auto shadow-xl"></div>
          
          {/* Cat Tail */}
          <div className="absolute -right-6 bottom-2 w-8 h-3 bg-gradient-to-r from-blue-500 to-purple-400 rounded-full transform rotate-12 animate-tail-wag"></div>
        </div>
      </div>
    );
  };

  const renderHomeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
      {/* Cat Display */}
      <div className="relative">
        {renderCat()}
        {showReward && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold animate-bounce">
            {rewardText}
          </div>
        )}
      </div>

      {/* Stats Display */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between bg-purple-800/30 rounded-lg p-3">
          <span className="text-purple-200">Level {gameStats.level}</span>
          <span className="text-yellow-400 font-bold">{gameStats.coins} ⭐</span>
        </div>
        
        {/* Happiness Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-pink-300 text-sm">Happiness</span>
            <span className="text-pink-300 text-sm">{gameStats.happiness}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${gameStats.happiness}%` }}
            ></div>
          </div>
        </div>

        {/* Energy Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-blue-300 text-sm">Energy</span>
            <span className="text-blue-300 text-sm">{gameStats.energy}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${gameStats.energy}%` }}
            ></div>
          </div>
        </div>

        {/* Experience Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-yellow-300 text-sm">Experience</span>
            <span className="text-yellow-300 text-sm">{gameStats.experience % 100}/100</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(gameStats.experience % 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <button
          onClick={feedCat}
          disabled={gameStats.coins < 10}
          className="bg-gradient-to-r from-green-500 to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all duration-200"
        >
          <Heart className="w-5 h-5 mx-auto mb-1" />
          Feed (10⭐)
        </button>
        
        <button
          onClick={playCat}
          disabled={gameStats.energy < 20}
          className="bg-gradient-to-r from-purple-500 to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all duration-200"
        >
          <Sparkles className="w-5 h-5 mx-auto mb-1" />
          Play
        </button>
      </div>
    </div>
  );

  const renderShopScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Cosmic Shop
      </h2>
      
      <div className="space-y-4">
        <div className="bg-purple-800/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Star Treats</h3>
              <p className="text-gray-300 text-sm">+30 Happiness</p>
            </div>
          </div>
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
            25⭐
          </button>
        </div>

        <div className="bg-purple-800/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Energy Boost</h3>
              <p className="text-gray-300 text-sm">+50 Energy</p>
            </div>
          </div>
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
            40⭐
          </button>
        </div>

        <div className="bg-purple-800/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Mystery Box</h3>
              <p className="text-gray-300 text-sm">Random reward</p>
            </div>
          </div>
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
            100⭐
          </button>
        </div>
      </div>
    </div>
  );

  const renderAchievementsScreen = () => (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Achievements
      </h2>
      
      <div className="space-y-3">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
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
              {achievement.icon}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                {achievement.title}
              </h3>
              <p className="text-gray-300 text-sm">{achievement.description}</p>
            </div>
            {achievement.unlocked && (
              <Trophy className="w-6 h-6 text-yellow-400" />
            )}
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
          <User className="w-12 h-12 text-white" />
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

        <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
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
      default: return renderHomeScreen();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Starfield Background */}
      <div className="absolute inset-0">
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

      {/* iPhone-style Container */}
      <div className="relative z-10 max-w-sm mx-auto min-h-screen bg-black/20 backdrop-blur-sm border-x border-purple-500/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-md p-4 border-b border-purple-500/20">
          <h1 className="text-xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Cosmic Feline
          </h1>
        </div>

        {/* Main Content */}
        {renderCurrentScreen()}

        {/* Bottom Navigation */}
        <div className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-md border-t border-purple-500/20 p-2">
          <div className="flex justify-around">
            <button
              onClick={() => setCurrentScreen('home')}
              className={`p-3 rounded-xl transition-all duration-200 ${
                currentScreen === 'home' 
                  ? 'bg-purple-500/30 text-purple-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Home className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setCurrentScreen('shop')}
              className={`p-3 rounded-xl transition-all duration-200 ${
                currentScreen === 'shop' 
                  ? 'bg-purple-500/30 text-purple-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gift className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setCurrentScreen('achievements')}
              className={`p-3 rounded-xl transition-all duration-200 ${
                currentScreen === 'achievements' 
                  ? 'bg-purple-500/30 text-purple-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setCurrentScreen('profile')}
              className={`p-3 rounded-xl transition-all duration-200 ${
                currentScreen === 'profile' 
                  ? 'bg-purple-500/30 text-purple-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;