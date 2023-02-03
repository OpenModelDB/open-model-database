export type ColorScheme = 'dark' | 'light';

function setColorScheme(value: ColorScheme) {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
        document.documentElement.dataset['theme'] = value;
        localStorage.setItem('theme', value);
    }
}

export function toggleColorScheme() {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
        const current = document.documentElement.dataset['theme'];

        if (current === 'light') {
            setColorScheme('dark');
        } else if (current === 'dark') {
            setColorScheme('light');
        } else {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setColorScheme(isDark ? 'light' : 'dark');
        }
    }
}
