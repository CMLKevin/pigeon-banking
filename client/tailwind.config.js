/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neo-Noir Art Deco Color Palette
        noir: {
          // Deep blacks and greys
          black: '#0A0A0A',
          darker: '#121212',
          dark: '#1A1A1A',
          charcoal: '#2D2D2D',
          slate: '#3A3A3A',
          steel: '#4A4A4A',
        },
        gold: {
          // Metallic golds
          light: '#FFD700',
          DEFAULT: '#D4AF37',
          dark: '#B8941E',
          bronze: '#CD7F32',
          champagne: '#F7E7CE',
          antique: '#C9B037',
        },
        deco: {
          // Art deco accent colors
          cream: '#F5F5DC',
          ivory: '#FFFFF0',
          silver: '#C0C0C0',
          pearl: '#EAE0C8',
          burgundy: '#800020',
          emerald: '#50C878',
        },
        phantom: {
          // Keep for compatibility, remap to new colors
          bg: {
            primary: '#0A0A0A',
            secondary: '#1A1A1A',
            tertiary: '#2D2D2D',
          },
          accent: {
            primary: '#D4AF37',
            secondary: '#CD7F32',
          },
          border: {
            light: '#4A4A4A',
            DEFAULT: '#3A3A3A',
            dark: '#2D2D2D',
          },
          text: {
            primary: '#F5F5DC',
            secondary: '#C0C0C0',
            tertiary: '#8A8A8A',
            accent: '#D4AF37',
          },
          success: '#50C878',
          warning: '#FFD700',
          error: '#DC143C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        // Neo-noir art deco gradients
        'gradient-phantom': 'linear-gradient(135deg, #D4AF37 0%, #CD7F32 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8941E 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0A0A 0%, #121212 100%)',
        'gradient-noir': 'linear-gradient(180deg, #1A1A1A 0%, #0A0A0A 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(205, 127, 50, 0.05) 100%)',
        'gradient-metallic': 'linear-gradient(135deg, #FFD700 0%, #D4AF37 25%, #B8941E 50%, #D4AF37 75%, #FFD700 100%)',
        'deco-zigzag': 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212, 175, 55, 0.1) 10px, rgba(212, 175, 55, 0.1) 20px)',
        'deco-chevron': 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(212, 175, 55, 0.05) 20px, rgba(212, 175, 55, 0.05) 40px)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(212, 175, 55, 0.1)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4), 0 0 30px rgba(212, 175, 55, 0.2)',
        'button': '0 2px 8px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 215, 0, 0.2)',
        'input': '0 0 0 2px rgba(212, 175, 55, 0.3)',
        'glow': '0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.2)',
        'glow-sm': '0 0 15px rgba(212, 175, 55, 0.4)',
        'gold-glow': '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(212, 175, 55, 0.3)',
        'inset-deco': 'inset 0 2px 4px rgba(0, 0, 0, 0.6), inset 0 -1px 2px rgba(212, 175, 55, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 30px rgba(212, 175, 55, 0.4), 0 0 60px rgba(212, 175, 55, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(212, 175, 55, 0.2)' },
        },
        shimmerGold: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        artDecoSlide: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

