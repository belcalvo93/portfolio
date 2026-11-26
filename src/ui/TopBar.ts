import { uiText } from '../data/i18n';
import type { Locale } from '../types/content';

const SUN_ICON = `
  <svg class="theme-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" />
    <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </g>
  </svg>`;

const MOON_ICON = `
  <svg class="theme-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z" />
  </svg>`;

export interface TopBarOptions {
  locale: Locale;
  theme: 'dark' | 'light';
  gameEnabled: boolean;
  onToggleGame: () => void;
  onToggleLocale: () => void;
  onToggleTheme: () => void;
}

export function renderTopBar(options: TopBarOptions): HTMLElement {
  const { locale, theme, gameEnabled, onToggleGame, onToggleLocale, onToggleTheme } = options;
  const t = uiText[locale];
  // El ícono muestra el modo actual; la etiqueta dice qué pasa al tocarlo
  const themeLabel = theme === 'dark' ? t.controls.toLight : t.controls.toDark;

  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML = `
    <a class="monogram" href="#contenido" aria-label="Belén Calvo, inicio">BC</a>

    <nav aria-label="Navegación principal">
      <ul class="topbar-nav">
        <li><a href="#proyectos">${t.nav.projects}</a></li>
        <li><a href="#tecnologias">${t.nav.technologies}</a></li>
        <li><a href="#formacion">${t.nav.education}</a></li>
        <li><a href="#logros">${t.nav.achievements}</a></li>
        <li><a href="#sobre-mi">${t.nav.about}</a></li>
        <li><a href="#contacto">${t.nav.contact}</a></li>
      </ul>
    </nav>

    <div class="topbar-actions">
      <button id="toggle-game" class="neu-control" type="button">
        ${gameEnabled ? t.controls.disableGame : t.controls.enableGame}
      </button>
      <button id="toggle-lang" class="neu-control" type="button" aria-label="Cambiar idioma">
        ${locale === 'es' ? 'ES / EN' : 'EN / ES'}
      </button>
      <button id="toggle-theme" class="neu-control theme-toggle" type="button"
        aria-label="${themeLabel}" title="${themeLabel}">
        ${theme === 'dark' ? MOON_ICON : SUN_ICON}
      </button>
    </div>
  `;

  header.querySelector('#toggle-game')?.addEventListener('click', onToggleGame);
  header.querySelector('#toggle-lang')?.addEventListener('click', onToggleLocale);
  header.querySelector('#toggle-theme')?.addEventListener('click', onToggleTheme);

  return header;
}
