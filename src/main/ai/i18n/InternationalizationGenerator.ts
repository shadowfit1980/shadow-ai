/**
 * Internationalization Generator
 * 
 * Generate and manage i18n translation files.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

interface Translation {
    key: string;
    value: string;
    context?: string;
}

interface LocaleFile {
    locale: string;
    translations: Record<string, string>;
}

export class InternationalizationGenerator extends EventEmitter {
    private static instance: InternationalizationGenerator;

    private constructor() { super(); }

    static getInstance(): InternationalizationGenerator {
        if (!InternationalizationGenerator.instance) {
            InternationalizationGenerator.instance = new InternationalizationGenerator();
        }
        return InternationalizationGenerator.instance;
    }

    extractKeys(code: string): Translation[] {
        const translations: Translation[] = [];

        // Extract from t('key') or i18n.t('key')
        const matches = code.matchAll(/(?:t|i18n\.t|useTranslation\(\)\.t)\s*\(\s*['"]([^'"]+)['"]/g);
        for (const match of matches) {
            translations.push({ key: match[1], value: match[1].split('.').pop() || match[1] });
        }

        // Extract from <Trans>text</Trans>
        const transMatches = code.matchAll(/<Trans[^>]*>([^<]+)<\/Trans>/g);
        for (const match of transMatches) {
            const key = match[1].toLowerCase().replace(/\s+/g, '_');
            translations.push({ key, value: match[1] });
        }

        return translations;
    }

    generateLocaleFile(locale: string, translations: Translation[]): string {
        const obj: Record<string, string> = {};
        for (const t of translations) {
            const parts = t.key.split('.');
            let current: any = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = current[parts[i]] || {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = t.value;
        }
        return JSON.stringify(obj, null, 2);
    }

    mergeLocales(base: LocaleFile, translations: Record<string, string>): LocaleFile {
        return {
            locale: base.locale,
            translations: { ...base.translations, ...translations }
        };
    }

    findMissingKeys(base: LocaleFile, target: LocaleFile): string[] {
        const baseKeys = Object.keys(this.flattenObject(base.translations));
        const targetKeys = new Set(Object.keys(this.flattenObject(target.translations)));
        return baseKeys.filter(k => !targetKeys.has(k));
    }

    private flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                Object.assign(result, this.flattenObject(value, fullKey));
            } else {
                result[fullKey] = value;
            }
        }
        return result;
    }

    generateReactHook(): string {
        return `import { useTranslation as useI18nTranslation } from 'react-i18next';

export function useTranslation(namespace?: string) {
  const { t, i18n } = useI18nTranslation(namespace);
  
  return {
    t,
    locale: i18n.language,
    changeLocale: (locale: string) => i18n.changeLanguage(locale),
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh']
  };
}
`;
    }

    generateConfig(locales: string[], defaultLocale = 'en'): string {
        return `import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
${locales.map(l => `import ${l} from './locales/${l}.json';`).join('\n')}

i18n.use(initReactI18next).init({
  resources: {
${locales.map(l => `    ${l}: { translation: ${l} }`).join(',\n')}
  },
  lng: '${defaultLocale}',
  fallbackLng: '${defaultLocale}',
  interpolation: { escapeValue: false }
});

export default i18n;
`;
    }

    suggestTranslation(key: string, locale: string): string {
        // Simple placeholder - in real impl would use translation API
        const prefixes: Record<string, string> = {
            es: '[ES] ', fr: '[FR] ', de: '[DE] ', ja: '[JA] ', zh: '[ZH] '
        };
        return (prefixes[locale] || '') + key.split('.').pop()?.replace(/_/g, ' ') || key;
    }
}

export const internationalizationGenerator = InternationalizationGenerator.getInstance();
