import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ServerResponseDto, SiteMetadataDto } from '../api/types';

export const useServerStore = defineStore('server', () => {
    const meta = ref<SiteMetadataDto | null>(null);
    const isInitialized = ref(false);
    const isDark = ref(true); // Theme state

    /**
     * Toggles global theme between light and dark
     */
    function toggleTheme() {
        isDark.value = !isDark.value;
        const root = document.documentElement;
        if (isDark.value) {
            root.classList.remove('light');
        } else {
            root.classList.add('light');
        }
    }

    /**
     * Initializes server data and branding
     */
    async function detectServer(): Promise<void> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        try {
            const response = await fetch(`${baseUrl}`);
            if (response.ok) {
                const result = await response.json();
                const data: ServerResponseDto = result.Data || result;
                meta.value = data.SiteMeta;
                if (meta.value?.SiteName) document.title = meta.value.SiteName;
            }
        } catch (e) {
            console.error('SERVER_INIT_ERR', e);
        } finally {
            isInitialized.value = true;
        }
    }

    return { meta, isInitialized, isDark, toggleTheme, detectServer };
});
