/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      perspective: {
        '1000': '1000px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      dropShadow: {
        'glow': '0 0 10px rgba(255, 255, 255, 0.8)',
        'glow-cyan': '0 0 15px rgba(34, 211, 238, 0.8)',
        'glow-pink': '0 0 15px rgba(236, 72, 153, 0.8)',
        'glow-yellow': '0 0 15px rgba(250, 204, 21, 0.8)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.8)',
        'glow-purple': '0 0 15px rgba(147, 51, 234, 0.8)',
      },
      animation: {
        // 3D Floating and Movement
        'float-3d': 'float3d 6s ease-in-out infinite',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        'orbit': 'orbit 15s linear infinite',
        'bob': 'bob 4s ease-in-out infinite',
        
        // Cat Animations
        'head-tilt': 'headTilt 8s ease-in-out infinite',
        'ear-twitch': 'earTwitch 3s ease-in-out infinite',
        'ear-twitch-reverse': 'earTwitchReverse 3s ease-in-out infinite',
        'blink': 'blink 4s ease-in-out infinite',
        'blink-delayed': 'blinkDelayed 4s ease-in-out infinite',
        'nose-twitch': 'noseTwitch 2s ease-in-out infinite',
        'whisker-left': 'whiskerLeft 3s ease-in-out infinite',
        'whisker-left-delayed': 'whiskerLeftDelayed 3s ease-in-out infinite',
        'whisker-right': 'whiskerRight 3s ease-in-out infinite',
        'whisker-right-delayed': 'whiskerRightDelayed 3s ease-in-out infinite',
        'body-sway': 'bodySway 5s ease-in-out infinite',
        'tail-wag': 'tailWag 2s ease-in-out infinite',
        
        // Glow and Light Effects
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'glow-pulse-delayed': 'glowPulseDelayed 3s ease-in-out infinite',
        'pulse-3d': 'pulse3d 2s ease-in-out infinite',
        'sparkle-3d': 'sparkle3d 3s ease-in-out infinite',
        
        // Text Animations
        'title-glow': 'titleGlow 4s ease-in-out infinite',
        'title-glow-delayed': 'titleGlowDelayed 4s ease-in-out infinite',
        'subtitle-float': 'subtitleFloat 6s ease-in-out infinite',
        
        // Heart and Star Effects
        'heart-beat': 'heartBeat 2s ease-in-out infinite',
        'heart-beat-delayed': 'heartBeatDelayed 2s ease-in-out infinite',
        'hearts-dance': 'heartsDance 8s ease-in-out infinite',
        'star-twinkle-3d': 'starTwinkle3d 3s ease-in-out infinite',
        'constellation-drift': 'constellationDrift 12s ease-in-out infinite',
        
        // Background Effects
        'twinkle-3d': 'twinkle3d 4s ease-in-out infinite',
        'nebula-drift': 'nebulaDrift 20s ease-in-out infinite',
        'nebula-drift-reverse': 'nebulaDriftReverse 25s ease-in-out infinite',
        'cosmic-waves': 'cosmicWaves 8s ease-in-out infinite',
      },
      keyframes: {
        // 3D Movement Keyframes
        float3d: {
          '0%, 100%': { transform: 'translateY(0px) translateZ(0px) rotateX(0deg)' },
          '25%': { transform: 'translateY(-10px) translateZ(15px) rotateX(2deg)' },
          '50%': { transform: 'translateY(-5px) translateZ(25px) rotateX(0deg)' },
          '75%': { transform: 'translateY(-15px) translateZ(10px) rotateX(-2deg)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        
        // Cat Animation Keyframes
        headTilt: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(2deg)' },
          '75%': { transform: 'rotate(-2deg)' },
        },
        earTwitch: {
          '0%, 90%, 100%': { transform: 'rotate(0deg)' },
          '5%, 15%': { transform: 'rotate(5deg)' },
        },
        earTwitchReverse: {
          '0%, 90%, 100%': { transform: 'rotate(0deg)' },
          '10%, 20%': { transform: 'rotate(-5deg)' },
        },
        blink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
        blinkDelayed: {
          '0%, 85%, 100%': { transform: 'scaleY(1)' },
          '90%': { transform: 'scaleY(0.1)' },
        },
        noseTwitch: {
          '0%, 80%, 100%': { transform: 'scale(1)' },
          '10%, 20%': { transform: 'scale(1.2)' },
        },
        whiskerLeft: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        whiskerLeftDelayed: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(3deg)' },
        },
        whiskerRight: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-5deg)' },
        },
        whiskerRightDelayed: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
        },
        bodySway: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '33%': { transform: 'rotate(1deg)' },
          '66%': { transform: 'rotate(-1deg)' },
        },
        tailWag: {
          '0%, 100%': { transform: 'rotate(12deg)' },
          '50%': { transform: 'rotate(25deg)' },
        },
        
        // Glow Effect Keyframes
        glowPulse: {
          '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
        glowPulseDelayed: {
          '0%, 100%': { opacity: 0.2, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.1)' },
        },
        pulse3d: {
          '0%, 100%': { opacity: 0.4, transform: 'scale(1) translateZ(0px)' },
          '50%': { opacity: 1, transform: 'scale(1.3) translateZ(20px)' },
        },
        sparkle3d: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1) rotate(0deg) translateZ(0px)' },
          '50%': { opacity: 1, transform: 'scale(1.4) rotate(180deg) translateZ(30px)' },
        },
        
        // Text Animation Keyframes
        titleGlow: {
          '0%, 100%': { textShadow: '0 0 20px rgba(147, 51, 234, 0.5)' },
          '50%': { textShadow: '0 0 40px rgba(147, 51, 234, 0.8), 0 0 60px rgba(236, 72, 153, 0.6)' },
        },
        titleGlowDelayed: {
          '0%, 100%': { textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
          '50%': { textShadow: '0 0 40px rgba(59, 130, 246, 0.8), 0 0 60px rgba(147, 51, 234, 0.6)' },
        },
        subtitleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        
        // Heart and Star Keyframes
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        heartBeatDelayed: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.3)' },
        },
        heartsDance: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        starTwinkle3d: {
          '0%, 100%': { opacity: 0.5, transform: 'scale(1) rotate(0deg) translateZ(0px)' },
          '50%': { opacity: 1, transform: 'scale(1.5) rotate(180deg) translateZ(40px)' },
        },
        constellationDrift: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        
        // Background Effect Keyframes
        twinkle3d: {
          '0%, 100%': { opacity: 0.3, transform: 'scale(1) translateZ(0px)' },
          '50%': { opacity: 1, transform: 'scale(1.5) translateZ(50px)' },
        },
        nebulaDrift: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.1)' },
        },
        nebulaDriftReverse: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(-180deg) scale(0.9)' },
        },
        cosmicWaves: {
          '0%, 100%': { opacity: 0.7 },
          '50%': { opacity: 0.9 },
        },
      }
    },
  },
  plugins: [],
};