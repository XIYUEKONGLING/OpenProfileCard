import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const useThemeStore = defineStore('theme', () => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    const theme = ref<ThemeMode>(
        ['light', 'dark', 'auto'].includes(savedTheme) ? savedTheme : 'auto'
    );

    const getSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

    function applyTheme() {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        const isDark = theme.value === 'auto' ? getSystemDark() : theme.value === 'dark';

        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }

        const color = isDark ? '#09090b' : '#ffffff';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);

        root.style.colorScheme = isDark ? 'dark' : 'light';
    }

    function setTheme(mode: ThemeMode) {
        theme.value = mode;
        localStorage.setItem('theme', mode);
        applyTheme();
    }

    function init() {
        applyTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.onchange = () => {
            if (theme.value === 'auto') {
                applyTheme();
            }
        };
    }

    watch(theme, () => {
        applyTheme();
    });

    return { theme, setTheme, applyTheme, init };
});
