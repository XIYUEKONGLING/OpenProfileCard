import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ServerInfoDto, SiteMetadataDto, ServerResponseDto } from '@/api/types';

export const useServerStore = defineStore('server', () => {
    const meta = ref<SiteMetadataDto | null>(null);
    const info = ref<ServerInfoDto | null>(null);
    const isInitialized = ref(false);

    async function detectServer(): Promise<void> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        try {
            const response = await fetch(`${baseUrl}`);
            if (response.ok) {
                const result = await response.json();
                const data: ServerResponseDto = result.Data || result;

                meta.value = data.SiteMeta;
                info.value = data.ServerInfo;

                if (meta.value?.SiteName) {
                    document.title = meta.value.SiteName;
                }
            }
        } catch (e) {
            console.error('CRITICAL: Server metadata fetch failed.', e);
        } finally {
            isInitialized.value = true;
        }
    }

    return { meta, info, isInitialized, detectServer };
});
