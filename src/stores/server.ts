import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
    ServerInfoDto,
    SiteMetadataDto,
    ServerResponseDto,
    ServerFeaturesDto
} from '@/api/types';

export const useServerStore = defineStore('server', () => {
    const meta = ref<SiteMetadataDto | null>(null);
    const info = ref<ServerInfoDto | null>(null);
    const features = ref<ServerFeaturesDto | null>(null);
    const isInitialized = ref(false);

    async function detectServer(): Promise<void> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        try {
            const response = await fetch(`${baseUrl}`);
            if (response.ok) {
                const result = await response.json();
                // Handle both wrapped (ApiResponse) and unwrapped responses
                const data: ServerResponseDto = result.Data || result;

                meta.value = data.SiteMeta;
                info.value = data.ServerInfo;
                features.value = data.Features;

                // Apply branding to the DOM
                if (meta.value?.SiteName) {
                    document.title = meta.value.SiteName;
                }

                // Optional: Set meta description if present
                if (meta.value?.SiteDescription) {
                    const metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) metaDesc.setAttribute('content', meta.value.SiteDescription);
                }
            }
        } catch (e) {
            console.error('CRITICAL: Server metadata fetch failed.', e);
        } finally {
            isInitialized.value = true;
        }
    }

    return {
        meta,
        info,
        features,
        isInitialized,
        detectServer
    };
});
