import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';

export const useUIStore = defineStore('ui', () => {
    function notify(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
        toast[type](message);
    }

    return { notify };
});
