import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { uiText } from './data/i18n';
import { nameLogoSvg } from './data/nameLogo';
import type { SceneManager } from './game/SceneManager';
import type { Locale, SectionId } from './types/content';
import { renderMobileNav } from './ui/MobileNav';
import { renderStaticPortfolio } from './ui/StaticPortfolio';
import { getSectionTitle } from './ui/renderSections';
import { renderTopBar } from './ui/TopBar';
import { WindowPanel } from './ui/WindowPanel';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  let locale: Locale = 'es';
  let theme: 'dark' | 'light' = 'dark';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gameEnabled = !prefersReducedMotion;

  let sceneManager: SceneManager | null = null;
  let gameHost: HTMLDivElement | null = null;
  let loadGeneration = 0;

  const modalRoot = document.createElement('div');
  document.body.appendChild(modalRoot);
  // Al cerrar la tarjeta, si el gato estaba adentro, vuelve a salir al techo
  const windowPanel = new WindowPanel(modalRoot, () => sceneManager?.exitWindow());

  const openWindow = (sectionId: SectionId) => {
    windowPanel.open(sectionId, locale);
  };

  // Botón "Entrar a …" que aparece cuando el gato queda frente a una ventana
  let nearSection: SectionId | null = null;
  let enterButton: HTMLButtonElement | null = null;
  let warmFade: HTMLDivElement | null = null;

  const renderEnterButton = () => {
    if (!enterButton) return;
    const stage = enterButton.closest('.game-stage');
    stage?.classList.toggle('has-enter', nearSection !== null);
    enterButton.hidden = nearSection === null;
    if (!nearSection) return;
    const label = uiText[locale].game.enter.replace('{section}', getSectionTitle(nearSection, locale));
    enterButton.innerHTML = `<span>${label}</span><kbd aria-hidden="true">E</kbd>`;
    enterButton.setAttribute('aria-keyshortcuts', 'E');
  };

  const handleEnterWindow = (sectionId: SectionId) => {
    // Fundido cálido corto, como si la luz de la ventana llenara la pantalla
    if (warmFade && !prefersReducedMotion) {
      warmFade.classList.remove('is-active');
      void warmFade.offsetWidth; // reinicia la animación
      warmFade.classList.add('is-active');
    }
    windowPanel.open(sectionId, locale, true);
  };

  const disposeScene = () => {
    loadGeneration++;
    if (sceneManager) {
      sceneManager.dispose();
      sceneManager = null;
    }
    gameHost?.remove();
    gameHost = null;
    enterButton = null;
    warmFade = null;
    nearSection = null;
  };

  const syncChrome = () => {
    document.documentElement.lang = locale;
    document.documentElement.setAttribute('data-theme', theme);

    const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
    if (skipLink) {
      skipLink.textContent = uiText[locale].skipLink;
    }

    const oldTopBar = app.querySelector('.topbar');
    const newTopBar = renderTopBar({
      locale,
      theme,
      gameEnabled,
      onToggleGame: () => {
        gameEnabled = !gameEnabled;
        if (gameEnabled) {
          void mountGameMode();
        } else {
          disposeScene();
          renderStaticMode();
        }
      },
      onToggleLocale: () => {
        locale = locale === 'es' ? 'en' : 'es';
        sceneManager?.setLocale(locale);
        if (gameEnabled) {
          syncChrome();
          const hint = app.querySelector<HTMLElement>('.game-hint');
          if (hint) hint.textContent = uiText[locale].game.hint;
          renderEnterButton();
        } else {
          renderStaticMode();
        }
      },
      onToggleTheme: () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        sceneManager?.setTheme(theme);
        syncChrome();
      },
    });

    if (oldTopBar) {
      oldTopBar.replaceWith(newTopBar);
    } else {
      app.prepend(newTopBar);
    }

    const oldMobile = app.querySelector('.mobile-nav');
    const newMobile = renderMobileNav(locale, gameEnabled, () => {
      if (!gameEnabled) {
        gameEnabled = true;
        void mountGameMode();
      }
    });
    if (oldMobile) {
      oldMobile.replaceWith(newMobile);
    } else {
      app.append(newMobile);
    }
  };

  const renderStaticMode = () => {
    app.innerHTML = '';
    syncChrome();
    const staticPortfolio = renderStaticPortfolio(locale, nameLogoSvg, openWindow);
    const mobileNav = app.querySelector('.mobile-nav');
    if (mobileNav) {
      app.insertBefore(staticPortfolio, mobileNav);
    } else {
      app.append(staticPortfolio);
    }
  };

  const mountGameMode = async () => {
    const currentGen = ++loadGeneration;

    // Mientras carga Three.js de forma diferida, la vista lectura sigue disponible
    if (!app.querySelector('.static-main')) {
      renderStaticMode();
    } else {
      syncChrome();
    }

    const loadingBadge = document.createElement('div');
    loadingBadge.className = 'game-loading';
    loadingBadge.setAttribute('role', 'status');
    loadingBadge.textContent = uiText[locale].game.loading;
    app.appendChild(loadingBadge);

    try {
      const { SceneManager: SceneManagerClass } = await import('./game/SceneManager');
      loadingBadge.remove();

      if (!gameEnabled || currentGen !== loadGeneration) {
        return;
      }

      app.querySelector('.static-main')?.remove();

      const stage = document.createElement('main');
      stage.id = 'contenido';
      stage.className = 'game-stage';
      stage.setAttribute('aria-label', 'Escena 3D Tejados al atardecer');

      gameHost = document.createElement('div');
      gameHost.className = 'game-canvas-host';
      stage.appendChild(gameHost);

      const hint = document.createElement('p');
      hint.className = 'game-hint';
      hint.textContent = uiText[locale].game.hint;
      stage.appendChild(hint);

      // Zona "en vivo": el lector de pantalla anuncia cuando aparece el botón
      const enterRegion = document.createElement('div');
      enterRegion.className = 'game-enter-region';
      enterRegion.setAttribute('aria-live', 'polite');
      enterButton = document.createElement('button');
      enterButton.type = 'button';
      enterButton.className = 'game-enter';
      enterButton.hidden = true;
      enterButton.addEventListener('click', () => sceneManager?.enterWindow());
      enterRegion.appendChild(enterButton);
      stage.appendChild(enterRegion);

      warmFade = document.createElement('div');
      warmFade.className = 'game-warm-fade';
      warmFade.setAttribute('aria-hidden', 'true');
      warmFade.addEventListener('animationend', () => warmFade?.classList.remove('is-active'));
      stage.appendChild(warmFade);

      const mobileNav = app.querySelector('.mobile-nav');
      if (mobileNav) {
        app.insertBefore(stage, mobileNav);
      } else {
        app.appendChild(stage);
      }

      sceneManager = new SceneManagerClass({
        container: gameHost,
        theme,
        locale,
        reducedMotion: prefersReducedMotion,
        onNearWindowChange: (sectionId) => {
          nearSection = sectionId;
          renderEnterButton();
        },
        onEnterWindow: handleEnterWindow,
      });
    } catch {
      loadingBadge.remove();
      gameEnabled = false;
      renderStaticMode();
    }
  };

  if (gameEnabled) {
    void mountGameMode();
  } else {
    renderStaticMode();
  }
}
