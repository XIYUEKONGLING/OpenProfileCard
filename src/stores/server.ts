import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ServerInfoDto, SiteMetadataDto, ServerResponseDto } from '@/api/types';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const useServerStore = defineStore('server', () => {
    const meta = ref<SiteMetadataDto | null>(null);
    const info = ref<ServerInfoDto | null>(null);
    const isInitialized = ref(false);

    const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'auto');

    function setTheme(mode: ThemeMode) {
        theme.value = mode;
        localStorage.setItem('theme', mode);
        applyTheme();
    }

    function applyTheme() {
        const isDark = theme.value === 'auto'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : theme.value === 'dark';

        document.documentElement.classList.toggle('dark', isDark);
    }

    async function detectServer(): Promise<void> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        try {
            const response = await fetch(`${baseUrl}`);
            if (response.ok) {
                const result = await response.json();
                const data: ServerResponseDto = result.Data || result;
                meta.value = data.SiteMeta;
                info.value = data.ServerInfo;
                if (meta.value?.SiteName) document.title = meta.value.SiteName;
            }
        } catch (e) {
            console.error('SERVER_INIT_ERR', e);
        } finally {
            isInitialized.value = true;
            applyTheme(); // 初始化时应用主题
        }
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (theme.value === 'auto') applyTheme();
    });

    return { meta, info, isInitialized, theme, setTheme, detectServer };
});
