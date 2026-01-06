/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/renderer/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
                neon: {
                    pink: '#ff006e',
                    purple: '#8338ec',
                    blue: '#3a86ff',
                    cyan: '#06ffa5',
                    yellow: '#ffbe0b',
                },
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px #06ffa5, 0 0 10px #06ffa5' },
                    '100%': { boxShadow: '0 0 10px #06ffa5, 0 0 20px #06ffa5, 0 0 30px #06ffa5' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'cyber-grid': 'linear-gradient(rgba(6, 255, 165, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 255, 165, 0.1) 1px, transparent 1px)',
            },
            backgroundSize: {
                'grid': '20px 20px',
            },
        },
    },
    plugins: [],
}
