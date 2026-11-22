import { uiText } from '../data/i18n';
import type { Locale } from '../types/content';

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
      <button id="toggle-theme" class="neu-control" type="button" aria-label="Cambiar tema claro u oscuro">
        ${theme === 'dark' ? t.controls.toLight : t.controls.toDark}
      </button>
    </div>
  `;

  header.querySelector('#toggle-game')?.addEventListener('click', onToggleGame);
  header.querySelector('#toggle-lang')?.addEventListener('click', onToggleLocale);
  header.querySelector('#toggle-theme')?.addEventListener('click', onToggleTheme);

  return header;
}
