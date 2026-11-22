import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { uiText } from './data/i18n';
import { nameLogoSvg } from './data/nameLogo';
import type { Locale, SectionId } from './types/content';
import { renderMobileNav } from './ui/MobileNav';
import { renderStaticPortfolio } from './ui/StaticPortfolio';
import { renderTopBar } from './ui/TopBar';
import { WindowPanel } from './ui/WindowPanel';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  let locale: Locale = 'es';
  let theme: 'dark' | 'light' = 'dark';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gameEnabled = !prefersReducedMotion;

  const modalRoot = document.createElement('div');
  document.body.appendChild(modalRoot);
  const windowPanel = new WindowPanel(modalRoot);

  const openWindow = (sectionId: SectionId) => {
    windowPanel.open(sectionId, locale);
  };

  const renderApp = () => {
    document.documentElement.lang = locale;
    document.documentElement.setAttribute('data-theme', theme);

    const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
    if (skipLink) {
      skipLink.textContent = uiText[locale].skipLink;
    }

    app.innerHTML = '';

    const topBar = renderTopBar({
      locale,
      theme,
      gameEnabled,
      onToggleGame: () => {
        gameEnabled = !gameEnabled;
        renderApp();
      },
      onToggleLocale: () => {
        locale = locale === 'es' ? 'en' : 'es';
        renderApp();
      },
      onToggleTheme: () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        renderApp();
      },
    });

    const staticPortfolio = renderStaticPortfolio(locale, nameLogoSvg, openWindow);
    const mobileNav = renderMobileNav(locale, gameEnabled, () => {
      openWindow('projects');
    });

    app.append(topBar, staticPortfolio, mobileNav);
  };

  renderApp();
}
