// i18n의 기본 설정을 정의하고 있습니다.
export const fallbackLng = 'en';
export const languages = ['en', 'ko', 'ja', 'zh'];
export const defaultNS = 'common';

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  };
} 