// 클라이언트 사이드에서 i18n을 초기화하고 설정하는 역할을 합니다.
'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from './settings';

const i18nInstance = i18next.createInstance();

i18nInstance
  .use(initReactI18next)
  .use(resourcesToBackend((language: string, namespace: string) => 
    import(`./locales/${language}/${namespace}.json`)))
  .init(getOptions());

export default i18nInstance; 