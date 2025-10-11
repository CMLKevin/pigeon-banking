/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        phantom: {
          // Phantom's signature dark purple palette
          bg: {
            primary: '#1A1B23',
            secondary: '#27283A',
            tertiary: '#2F3142',
          },
          purple: {
            light: '#C4B5FD',
            DEFAULT: '#AB9FF2',
            dark: '#8B7FD8',
          },
          accent: {
            primary: '#AB9FF2',
            secondary: '#78F5E6',
            gradient: 'linear-gradient(135deg, #AB9FF2 0%, #78F5E6 100%)',
          },
          border: {
            light: '#3D3F54',
            DEFAULT: '#2F3142',
            dark: '#1F2028',
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#A8A9B8',
            tertiary: '#75768B',
            accent: '#AB9FF2',
          },
          success: '#4ADE80',
          warning: '#FBBF24',
          error: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-phantom': 'linear-gradient(135deg, #AB9FF2 0%, #78F5E6 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1A1B23 0%, #0F1015 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(171, 159, 242, 0.1) 0%, rgba(120, 245, 230, 0.05) 100%)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        'button': '0 2px 8px rgba(171, 159, 242, 0.3)',
        'input': '0 0 0 3px rgba(171, 159, 242, 0.2)',
        'glow': '0 0 20px rgba(171, 159, 242, 0.4)',
        'glow-sm': '0 0 10px rgba(171, 159, 242, 0.3)',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(171, 159, 242, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(171, 159, 242, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}

