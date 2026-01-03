import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

export const useUIStore = defineStore('ui', () => {
    const toasts = ref<Toast[]>([]);
    let counter = 0;

    /**
     * Pushes a new notification to the stack
     */
    function notify(message: string, type: ToastType = 'info'): void {
        const id = ++counter;
        toasts.value.push({ id, message, type });

        // Auto remove after 4 seconds
        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id);
        }, 4000);
    }

    return { toasts, notify };
});
