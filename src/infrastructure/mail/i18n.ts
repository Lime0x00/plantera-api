import welcomeEn from '../../lang/en/emails';
import welcomeAr from '../../lang/ar/emails';

export type Locale = 'en' | 'ar';

interface Translation {
  welcome: {
    subject: string;
    greeting: string;
    body: string;
    cta: string;
    footer: string;
  };
  resetPassword: {
    subject: string;
    greeting: string;
    codeLabel: string;
    expires: string;
    cta: string;
    ignore: string;
    footer: string;
  };
  securityAlert: {
    subject: string;
    greeting: string;
    reasonLabel: string;
    actionLabel: string;
    cta: string;
    ignore: string;
    footer: string;
  };
}

const translations: Record<Locale, Translation> = {
  en: welcomeEn,
  ar: welcomeAr,
};

export function t(
  locale: Locale,
  key: keyof Translation
): Translation[keyof Translation] {
  return translations[locale]?.[key] ?? translations.en[key];
}
