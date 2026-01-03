import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const useThemeStore = defineStore('theme', () => {
    const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'auto');

    function setTheme(mode: ThemeMode) {
        theme.value = mode;
        localStorage.setItem('theme', mode);
        applyTheme();
    }

    function applyTheme() {
        const root = document.documentElement;
        const isDark = theme.value === 'auto'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : theme.value === 'dark';

        root.classList.toggle('dark', isDark);
        root.classList.toggle('light', !isDark);

        document.querySelector('meta[name="theme-color"]')?.setAttribute(
            'content',
            isDark ? '#09090b' : '#ffffff'
        );
    }

    function init() {
        applyTheme();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (theme.value === 'auto') {
                applyTheme();
            }
        });
    }

    return { theme, setTheme, applyTheme, init };
});
