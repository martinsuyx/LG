import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import AppLayout from '@/layout/AppLayout.vue';
import router from './router';
import zhCN from '@/i18n/zh-CN.json';
import '@/styles/global.scss';
import '@/sdk';

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN
  }
});

const app = createApp(AppLayout);

app.use(router);
app.use(i18n);

app.mount('#app');
