/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'fade-50': '#f9f8ff',
                'fade-100': '#f3f2fd',
                'fade-200': '#e5e4ee',
                'fade-300': '#d4d3dd',
                'fade-400': '#a2a1ab',
                'fade-500': '#72717a',
                'fade-600': '#55545c',
                'fade-700': '#403f47',
                'fade-800': '#28272f',
                'fade-900': '#17171e',
                accent: '#4d48a9',
                'accent-50': '#feeaff',
                'accent-100': '#f8e4ff',
                'accent-200': '#e9d6ff',
                'accent-300': '#d8c5ff',
                'accent-400': '#a394ff',
                'accent-500': '#6e64ca',
                'accent-600': '#4d48a9',
                'accent-700': '#323391',
                'accent-800': '#031c74',
                'accent-900': '#000c60',
            },
        },
        screens: {
            xl: '1400px',
        },
    },
    darkMode: ['class', '[data-theme="dark"]'],
    plugins: [require('@tailwindcss/line-clamp'), require('@headlessui/tailwindcss')],
};
