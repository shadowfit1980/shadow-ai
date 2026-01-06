/**
 * 🌍 Localization System
 * 
 * Multi-language support:
 * - String tables
 * - Pluralization
 * - Formatting
 * - RTL support
 */

import { EventEmitter } from 'events';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ko' | 'ar' | 'ru';

export interface LanguageConfig {
    code: LanguageCode;
    name: string;
    nativeName: string;
    rtl: boolean;
    pluralRules: (n: number) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
}

export interface TranslationEntry {
    key: string;
    values: Record<LanguageCode, string | Record<string, string>>;
}

export class LocalizationSystem extends EventEmitter {
    private static instance: LocalizationSystem;
    private languages: Map<LanguageCode, LanguageConfig> = new Map();
    private translations: Map<string, TranslationEntry> = new Map();
    private currentLanguage: LanguageCode = 'en';

    private constructor() {
        super();
        this.initializeLanguages();
        this.initializeDefaultStrings();
    }

    static getInstance(): LocalizationSystem {
        if (!LocalizationSystem.instance) {
            LocalizationSystem.instance = new LocalizationSystem();
        }
        return LocalizationSystem.instance;
    }

    private initializeLanguages(): void {
        this.languages.set('en', {
            code: 'en', name: 'English', nativeName: 'English', rtl: false,
            pluralRules: n => n === 1 ? 'one' : 'other'
        });
        this.languages.set('es', {
            code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false,
            pluralRules: n => n === 1 ? 'one' : 'other'
        });
        this.languages.set('fr', {
            code: 'fr', name: 'French', nativeName: 'Français', rtl: false,
            pluralRules: n => n <= 1 ? 'one' : 'other'
        });
        this.languages.set('de', {
            code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false,
            pluralRules: n => n === 1 ? 'one' : 'other'
        });
        this.languages.set('ja', {
            code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false,
            pluralRules: () => 'other'
        });
        this.languages.set('zh', {
            code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false,
            pluralRules: () => 'other'
        });
        this.languages.set('ar', {
            code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true,
            pluralRules: n => {
                if (n === 0) return 'zero';
                if (n === 1) return 'one';
                if (n === 2) return 'two';
                if (n % 100 >= 3 && n % 100 <= 10) return 'few';
                if (n % 100 >= 11 && n % 100 <= 99) return 'many';
                return 'other';
            }
        });
        this.languages.set('ru', {
            code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false,
            pluralRules: n => {
                if (n % 10 === 1 && n % 100 !== 11) return 'one';
                if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'few';
                return 'many';
            }
        });
    }

    private initializeDefaultStrings(): void {
        // UI strings
        this.addTranslation('ui.play', {
            en: 'Play', es: 'Jugar', fr: 'Jouer', de: 'Spielen',
            ja: 'プレイ', zh: '开始', ru: 'Играть', ar: 'العب'
        });
        this.addTranslation('ui.pause', {
            en: 'Paused', es: 'Pausado', fr: 'Pause', de: 'Pausiert',
            ja: '一時停止', zh: '暂停', ru: 'Пауза', ar: 'إيقاف مؤقت'
        });
        this.addTranslation('ui.resume', {
            en: 'Resume', es: 'Continuar', fr: 'Reprendre', de: 'Fortsetzen',
            ja: '再開', zh: '继续', ru: 'Продолжить', ar: 'استئناف'
        });
        this.addTranslation('ui.options', {
            en: 'Options', es: 'Opciones', fr: 'Options', de: 'Optionen',
            ja: 'オプション', zh: '选项', ru: 'Настройки', ar: 'خيارات'
        });
        this.addTranslation('ui.quit', {
            en: 'Quit', es: 'Salir', fr: 'Quitter', de: 'Beenden',
            ja: '終了', zh: '退出', ru: 'Выход', ar: 'خروج'
        });

        // Game strings
        this.addTranslation('game.score', {
            en: 'Score: {0}', es: 'Puntos: {0}', fr: 'Score: {0}', de: 'Punkte: {0}',
            ja: 'スコア: {0}', zh: '分数: {0}', ru: 'Счёт: {0}', ar: 'النتيجة: {0}'
        });
        this.addTranslation('game.health', {
            en: 'Health', es: 'Salud', fr: 'Santé', de: 'Gesundheit',
            ja: 'HP', zh: '生命', ru: 'Здоровье', ar: 'الصحة'
        });
        this.addTranslation('game.level', {
            en: 'Level {0}', es: 'Nivel {0}', fr: 'Niveau {0}', de: 'Level {0}',
            ja: 'レベル {0}', zh: '第 {0} 关', ru: 'Уровень {0}', ar: 'المستوى {0}'
        });
        this.addTranslation('game.gameOver', {
            en: 'Game Over', es: 'Fin del Juego', fr: 'Fin de Partie', de: 'Spiel Vorbei',
            ja: 'ゲームオーバー', zh: '游戏结束', ru: 'Игра Окончена', ar: 'انتهت اللعبة'
        });
        this.addTranslation('game.victory', {
            en: 'Victory!', es: '¡Victoria!', fr: 'Victoire!', de: 'Sieg!',
            ja: '勝利！', zh: '胜利！', ru: 'Победа!', ar: 'النصر!'
        });

        // Plural example
        this.addTranslation('game.coins', {
            en: { one: '{0} coin', other: '{0} coins' },
            es: { one: '{0} moneda', other: '{0} monedas' },
            fr: { one: '{0} pièce', other: '{0} pièces' },
            de: { one: '{0} Münze', other: '{0} Münzen' },
            ja: '{0}コイン',
            zh: '{0}枚金币',
            ru: { one: '{0} монета', few: '{0} монеты', many: '{0} монет' },
            ar: { zero: 'لا عملات', one: 'عملة واحدة', two: 'عملتان', few: '{0} عملات', many: '{0} عملة', other: '{0} عملة' }
        });
    }

    addTranslation(key: string, values: Record<string, string | Record<string, string>>): void {
        this.translations.set(key, { key, values: values as any });
    }

    setLanguage(code: LanguageCode): void {
        if (this.languages.has(code)) {
            this.currentLanguage = code;
            this.emit('languageChanged', code);
        }
    }

    getLanguage(): LanguageCode {
        return this.currentLanguage;
    }

    getLanguageConfig(): LanguageConfig | undefined {
        return this.languages.get(this.currentLanguage);
    }

    getAllLanguages(): LanguageConfig[] {
        return Array.from(this.languages.values());
    }

    t(key: string, ...args: any[]): string {
        const entry = this.translations.get(key);
        if (!entry) return key;

        let value = entry.values[this.currentLanguage] || entry.values['en'] || key;

        // Handle pluralization
        if (typeof value === 'object' && args.length > 0) {
            const n = args[0];
            const langConfig = this.languages.get(this.currentLanguage);
            const pluralForm = langConfig?.pluralRules(n) || 'other';
            value = (value as Record<string, string>)[pluralForm] || (value as Record<string, string>)['other'] || key;
        }

        // Replace placeholders
        let result = value as string;
        args.forEach((arg, i) => {
            result = result.replace(`{${i}}`, String(arg));
        });

        return result;
    }

    generateLocalizationCode(): string {
        return `
class Localization {
    constructor() {
        this.strings = new Map();
        this.currentLang = 'en';
        this.languages = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
    }

    load(lang, strings) {
        this.strings.set(lang, strings);
    }

    setLanguage(lang) {
        if (this.strings.has(lang)) {
            this.currentLang = lang;
            document.documentElement.dir = ['ar', 'he'].includes(lang) ? 'rtl' : 'ltr';
        }
    }

    t(key, ...args) {
        const langStrings = this.strings.get(this.currentLang) || this.strings.get('en');
        let value = langStrings?.[key] || key;

        // Handle pluralization
        if (typeof value === 'object' && args.length > 0) {
            const n = args[0];
            const form = this.getPluralForm(n);
            value = value[form] || value.other || key;
        }

        // Replace {0}, {1}, etc.
        args.forEach((arg, i) => {
            value = value.replace(\`{\${i}}\`, arg);
        });

        return value;
    }

    getPluralForm(n) {
        // Simplified English rules
        return n === 1 ? 'one' : 'other';
    }
}

// Usage
const i18n = new Localization();
i18n.load('en', {
    'ui.play': 'Play',
    'ui.pause': 'Paused',
    'game.score': 'Score: {0}',
    'game.coins': { one: '{0} coin', other: '{0} coins' }
});
i18n.load('es', {
    'ui.play': 'Jugar',
    'ui.pause': 'Pausado',
    'game.score': 'Puntos: {0}',
    'game.coins': { one: '{0} moneda', other: '{0} monedas' }
});

// Get translated string
i18n.t('game.score', 100);  // "Score: 100"
i18n.t('game.coins', 5);    // "5 coins"
`;
    }
}

export const localizationSystem = LocalizationSystem.getInstance();
