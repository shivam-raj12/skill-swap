// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
    // Ensure this content array correctly points to your files!
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',       // Looks for files inside the 'app' directory
        './components/**/*.{js,ts,jsx,tsx,mdx}', // Looks for files inside the 'components' directory
    ],
    theme: {
        extend: {
            container: {
                center: true,
                padding: '1rem',
            },
            // IMPORTANT: Custom animations for the HeroModern component
            animation: {
                'fade-in-up': 'fadeInSlideUp 1s ease-out forwards',
                blob: 'blob 7s infinite cubic-bezier(0.68, -0.55, 0.27, 1.55)',
            },
            keyframes: {
                fadeInSlideUp: {
                    'from': { opacity: '0', transform: 'translateY(20px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;