import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ServerInfoDto } from '../api/types';

export const useServerStore = defineStore('server', () => {
    const info = ref<ServerInfoDto | null>(null);
    const isInitialized = ref(false);

    /**
     * Probes the server to identify deployment mode
     * Supports both direct API endpoints and static .json mirrors
     */
    async function detectServer(): Promise<void> {
        const endpoints = ['/api/info', '/api/info.json', '/api.json', '/api'];

        for (const url of endpoints) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    // Backend DTOs use PascalCase
                    info.value = data.Data || data;
                    break;
                }
            } catch (e) {
                // Silently continue to next endpoint
            }
        }
        isInitialized.value = true;
    }

    return { info, isInitialized, detectServer };
});
