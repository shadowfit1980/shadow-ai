/**
 * Internationalization (i18n) Generator
 * 
 * Generate i18n setup for Next.js, React, Vue, and Flutter.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type I18nFramework = 'next-intl' | 'react-i18next' | 'vue-i18n' | 'flutter';

// ============================================================================
// I18N GENERATOR
// ============================================================================

export class I18nGenerator extends EventEmitter {
    private static instance: I18nGenerator;

    private constructor() {
        super();
    }

    static getInstance(): I18nGenerator {
        if (!I18nGenerator.instance) {
            I18nGenerator.instance = new I18nGenerator();
        }
        return I18nGenerator.instance;
    }

    // ========================================================================
    // NEXT-INTL
    // ========================================================================

    generateNextIntl(): string {
        return `// i18n/config.ts
export const locales = ['en', 'es', 'fr', 'de', 'ar', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(\`./messages/\${locale}.json\`)).default,
}));

// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\\\..*).*)'],
};

// messages/en.json
{
  "common": {
    "welcome": "Welcome",
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "auth": {
    "login": "Log in",
    "logout": "Log out",
    "register": "Sign up",
    "forgotPassword": "Forgot password?"
  },
  "errors": {
    "notFound": "Page not found",
    "serverError": "Something went wrong"
  }
}

// messages/es.json
{
  "common": {
    "welcome": "Bienvenido",
    "home": "Inicio",
    "about": "Acerca de",
    "contact": "Contacto"
  },
  "auth": {
    "login": "Iniciar sesión",
    "logout": "Cerrar sesión",
    "register": "Registrarse",
    "forgotPassword": "¿Olvidaste tu contraseña?"
  }
}

// Usage in components
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <nav>
        <a href="/">{t('home')}</a>
        <a href="/about">{t('about')}</a>
      </nav>
    </div>
  );
}

// With parameters
// messages/en.json: "greeting": "Hello, {name}!"
// t('greeting', { name: 'John' })

// Pluralization
// messages/en.json: "items": "{count, plural, =0 {No items} one {# item} other {# items}}"
// t('items', { count: 5 })

// Language switcher
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  );
}
`;
    }

    // ========================================================================
    // REACT-I18NEXT
    // ========================================================================

    generateReactI18next(): string {
        return `// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'de'],
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    ns: ['common', 'auth', 'errors'],
    defaultNS: 'common',
  });

export default i18n;

// locales/en/common.json
{
  "welcome": "Welcome to our app",
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}

// Usage
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <nav>
        <a>{t('nav.home')}</a>
        <a>{t('nav.about')}</a>
      </nav>
      
      <button onClick={() => i18n.changeLanguage('es')}>
        Español
      </button>
    </div>
  );
}

// With namespace
function AuthComponent() {
  const { t } = useTranslation('auth');
  return <button>{t('login')}</button>;
}

// Trans component for rich text
import { Trans } from 'react-i18next';

// locales/en/common.json: "terms": "By signing up, you agree to our <link>Terms of Service</link>"

function Terms() {
  return (
    <Trans i18nKey="terms" t={t}>
      By signing up, you agree to our <a href="/terms">Terms of Service</a>
    </Trans>
  );
}

// Language switcher hook
function useLanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
  ];
  
  return {
    currentLanguage: i18n.language,
    languages,
    changeLanguage: (code: string) => i18n.changeLanguage(code),
  };
}
`;
    }

    // ========================================================================
    // VUE I18N
    // ========================================================================

    generateVueI18n(): string {
        return `// plugins/i18n.ts
import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, es },
});

// main.ts
import { createApp } from 'vue';
import { i18n } from './plugins/i18n';
import App from './App.vue';

createApp(App).use(i18n).mount('#app');

// locales/en.json
{
  "common": {
    "welcome": "Welcome",
    "greeting": "Hello, {name}!"
  }
}

// Usage in components
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
</script>

<template>
  <h1>{{ t('common.welcome') }}</h1>
  <p>{{ t('common.greeting', { name: 'John' }) }}</p>
  
  <select v-model="locale">
    <option value="en">English</option>
    <option value="es">Español</option>
  </select>
</template>

// With Composition API
import { useI18n } from 'vue-i18n';

export function useLanguage() {
  const { locale, availableLocales, t } = useI18n();
  
  const setLanguage = (lang: string) => {
    locale.value = lang;
    localStorage.setItem('locale', lang);
  };
  
  return { locale, availableLocales, t, setLanguage };
}
`;
    }

    // ========================================================================
    // FLUTTER
    // ========================================================================

    generateFlutterI18n(): string {
        return `// Using flutter_localizations and intl
// pubspec.yaml:
// dependencies:
//   flutter_localizations:
//     sdk: flutter
//   intl: ^0.18.0

// l10n.yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart

// lib/l10n/app_en.arb
{
  "@@locale": "en",
  "welcome": "Welcome",
  "greeting": "Hello, {name}!",
  "@greeting": {
    "placeholders": {
      "name": {
        "type": "String"
      }
    }
  },
  "itemCount": "{count, plural, =0{No items} =1{1 item} other{{count} items}}",
  "@itemCount": {
    "placeholders": {
      "count": {
        "type": "int"
      }
    }
  }
}

// lib/l10n/app_es.arb
{
  "@@locale": "es",
  "welcome": "Bienvenido",
  "greeting": "¡Hola, {name}!",
  "itemCount": "{count, plural, =0{Sin artículos} =1{1 artículo} other{{count} artículos}}"
}

// main.dart
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  Locale _locale = const Locale('en');

  void setLocale(Locale locale) {
    setState(() => _locale = locale);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      locale: _locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'),
        Locale('es'),
        Locale('fr'),
      ],
      home: const HomePage(),
    );
  }
}

// Usage
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.welcome)),
      body: Column(
        children: [
          Text(l10n.greeting('John')),
          Text(l10n.itemCount(5)),
        ],
      ),
    );
  }
}

// Language provider with Riverpod
import 'package:flutter_riverpod/flutter_riverpod.dart';

final localeProvider = StateProvider<Locale>((ref) => const Locale('en'));

// Usage:
// final locale = ref.watch(localeProvider);
// ref.read(localeProvider.notifier).state = const Locale('es');
`;
    }

    /**
     * Generate translation file template
     */
    generateTranslationTemplate(languages: string[]): Record<string, any> {
        const template = {
            common: {
                welcome: '',
                home: '',
                about: '',
                contact: '',
                settings: '',
                profile: '',
                search: '',
                cancel: '',
                save: '',
                delete: '',
                edit: '',
                loading: '',
            },
            auth: {
                login: '',
                logout: '',
                register: '',
                email: '',
                password: '',
                forgotPassword: '',
                resetPassword: '',
            },
            errors: {
                notFound: '',
                serverError: '',
                unauthorized: '',
                invalidInput: '',
            },
        };

        const translations: Record<string, any> = {};

        languages.forEach(lang => {
            translations[lang] = JSON.parse(JSON.stringify(template));
        });

        return translations;
    }
}

export const i18nGenerator = I18nGenerator.getInstance();
