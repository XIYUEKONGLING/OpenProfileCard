import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index';
import {useThemeStore} from "@/stores/theme.ts";
import { useServerStore } from './stores/server';
import './style.css';
import 'vue-sonner/style.css'

/**
 * Bootstrap the application
 * Ensures server detection is completed before mounting
 */
async function startApp(): Promise<void> {
    const app = createApp(App);
    const pinia = createPinia();
    app.use(pinia);

    // Initialize server state (Detect Dynamic vs Static mode)
    const themeStore = useThemeStore();
    const serverStore = useServerStore();

    themeStore.init();
    await serverStore.detectServer();

    app.use(router);
    app.mount('#app');
}

startApp().catch((err) => {
    console.error('Failed to bootstrap application:', err);
});
