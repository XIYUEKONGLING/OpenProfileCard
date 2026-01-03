import { ref, readonly } from 'vue';
import { zh } from './locales/zh';
import { en } from './locales/en';

// Define supported language types
type SupportedLang = 'zh' | 'en';

// Explicitly type the locales object
const locales: Record<SupportedLang, any> = { zh, en };

const getBrowserLang = (): SupportedLang => {
    const lang = navigator.language?.split('-')[0];
    // Check if the browser language is supported, otherwise fallback to 'en'
    return (lang && lang in locales) ? (lang as SupportedLang) : 'en';
};

// Validate value from localStorage
const getInitialLang = (): SupportedLang => {
    const saved = localStorage.getItem('lang');
    if (saved && saved in locales) {
        return saved as SupportedLang;
    }
    return getBrowserLang();
};

const currentLocale = ref<SupportedLang>(getInitialLang());

export function useI18n() {
    const t = (path: string, args?: Record<string, string | number>) => {
        const keys = path.split('.');
        let result = locales[currentLocale.value];

        for (const key of keys) {
            result = result?.[key];
            if (!result) return path;
        }

        if (args && typeof result === 'string') {
            return result.replace(/{(\w+)}/g, (_, key) => args[key]?.toString() || '');
        }
        return result;
    };

    const setLocale = (lang: SupportedLang) => {
        currentLocale.value = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
    };

    return {
        t,
        setLocale,
        locale: readonly(currentLocale)
    };
}
