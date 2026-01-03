import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ServerResponseDto, SiteMetadataDto } from '../api/types';

export const useServerStore = defineStore('server', () => {
    const meta = ref<SiteMetadataDto | null>(null);
    const isInitialized = ref(false);

    /**
     * Fetches server info and site metadata (Title, Logo, etc.)
     */
    async function detectServer(): Promise<void> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        try {
            // Fetch combined index or standalone meta
            const response = await fetch(`${baseUrl}`);
            if (response.ok) {
                const result = await response.json();
                const data: ServerResponseDto = result.Data || result;

                meta.value = data.SiteMeta;

                // Update browser tab title dynamically from backend
                if (meta.value?.SiteName) {
                    document.title = meta.value.SiteName;
                }
            }
        } catch (e) {
            console.error('Metadata fetch failed', e);
        }
        isInitialized.value = true;
    }

    return { meta, isInitialized, detectServer };
});
