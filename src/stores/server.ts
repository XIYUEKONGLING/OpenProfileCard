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

        const tryFetch = async (url: string) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            return await response.json();
        };

        try {
            let result;
            try {
                // Attempt 1: Standard API root
                result = await tryFetch(baseUrl);
            } catch (e) {
                // Attempt 2: Static index.json fallback
                const fallbackUrl = baseUrl.endsWith('/') ? `${baseUrl}index.json` : `${baseUrl}/index.json`;
                result = await tryFetch(fallbackUrl);
            }

            const data: ServerResponseDto = result.Data || result;

            meta.value = data.SiteMeta;
            info.value = data.ServerInfo;
            features.value = data.Features;

            // 1. Update Document Title
            if (meta.value?.SiteName) {
                document.title = meta.value.SiteName;
            }

            // 2. Update Meta Description
            if (meta.value?.SiteDescription) {
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) metaDesc.setAttribute('content', meta.value.SiteDescription);
            }

            // 3. Update Favicon
            if (meta.value?.Favicon && meta.value.Favicon.Value) {
                const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (faviconLink) {
                    faviconLink.href = meta.value.Favicon.Value;
                }
            }
        } catch (e) {
            console.error('CRITICAL: Server metadata fetch failed even with static fallback.', e);
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
