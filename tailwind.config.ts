import type { Config } from 'tailwindcss';
import lineClamp from '@tailwindcss/line-clamp';
import colors from 'tailwindcss/colors';

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './meeting/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            container: {
                center: true,
                padding: '1rem',
                screens: {
                    sm: '640px',
                    md: '768px',
                    lg: '1024px',
                    xl: '1280px',
                },
            },
            animation: {
                'fade-in-up': 'fadeInSlideUp 1s ease-out forwards',
                blob: 'blob 7s infinite cubic-bezier(0.68, -0.55, 0.27, 1.55)',
            },
            keyframes: {
                fadeInSlideUp: {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
            },
            colors: {
                ...colors,
                gray: {
                    50: '#555555',
                    100: '#FFFFFF',
                    150: '#3f4046',
                    200: '#EFEFEF',
                    250: '#3F4346',
                    300: '#DADADA',
                    350: '#344154',
                    400: '#818181',
                    450: '#455A64',
                    500: '#6F767E',
                    600: '#404B53',
                    650: '#202427',
                    700: '#232830',
                    750: '#1A1C22',
                    800: '#050A0E',
                    850: '#26282C',
                    900: '#95959E',
                },
                purple: {
                    350: '#5568FE',
                    550: '#596BFF',
                    600: '#586FEA',
                    650: '#2B3480',
                    700: '#4F63D2',
                    750: '#6246FB',
                    300: '#4658BB',
                },
                red: {
                    150: '#D32F2F',
                    250: '#FF6262',
                    650: '#FF5D5D',
                },
                pink: {
                    150: '#EC4899',
                    250: '#FFB5B5',
                    750: '#2c1a22',
                },
                green: {
                    150: '#3BA55D',
                    250: '#40A954',
                    350: '#34A85333',
                    450: '#34A85380',
                    550: '#87E5A2',
                    650: '#96F3D24D',
                    750: '#A3FEE3',
                },
                blue: {
                    350: '#76d9e6',
                },
            },
            fontFamily: {
                lato: ['Lato', 'sans-serif'],
                sans: [
                    'Lato',
                    'BlinkMacSystemFont',
                    '-apple-system',
                    'Segoe UI',
                    'Roboto',
                    'Oxygen',
                    'Ubuntu',
                    'Cantarell',
                    'Fira Sans',
                    'Droid Sans',
                    'Helvetica Neue',
                    'Helvetica',
                    'Arial',
                    'sans-serif',
                ],
                mono: ['Source Code Pro', 'Menlo', 'monospace'],
            },
        },
    },
    plugins: [lineClamp],
};

export default config;
