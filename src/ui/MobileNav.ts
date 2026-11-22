import { uiText } from '../data/i18n';
import type { Locale } from '../types/content';

export function renderMobileNav(locale: Locale, gameEnabled: boolean, onSelectWalk: () => void): HTMLElement {
  const t = uiText[locale].mobileNav;
  const nav = document.createElement('nav');
  nav.className = 'mobile-nav';
  nav.setAttribute('aria-label', 'Navegación móvil');

  nav.innerHTML = `
    <button type="button" class="${gameEnabled ? 'is-active' : ''}" data-mobile-walk>
      <span aria-hidden="true">🐾</span><span>${t.walk}</span>
    </button>
    <a href="#proyectos"><span aria-hidden="true">📁</span><span>${t.projects}</span></a>
    <a href="#sobre-mi"><span aria-hidden="true">👤</span><span>${t.about}</span></a>
    <a href="#contacto"><span aria-hidden="true">✉️</span><span>${t.contact}</span></a>
  `;

  nav.querySelector('[data-mobile-walk]')?.addEventListener('click', onSelectWalk);
  return nav;
}
