import { ref, readonly } from 'vue';
import { zh } from './locales/zh';
import { en } from './locales/en';

const locales: Record<string, any> = { zh, en };

const getBrowserLang = () => {
    const lang = navigator.language.split('-')[0];
    return locales[lang] ? lang : 'en';
};

const currentLocale = ref(localStorage.getItem('lang') || getBrowserLang());

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

    const setLocale = (lang: 'zh' | 'en') => {
        currentLocale.value = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
    };

    return { t, setLocale, locale: readonly(currentLocale) };
}
