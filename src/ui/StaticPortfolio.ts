import { uiText } from '../data/i18n';
import { profile } from '../data/profile';
import type { Locale, SectionId } from '../types/content';
import { getSectionTitle, renderSectionContent } from './renderSections';

const SECTIONS: { id: SectionId; anchor: string }[] = [
  { id: 'projects', anchor: 'proyectos' },
  { id: 'technologies', anchor: 'tecnologias' },
  { id: 'education', anchor: 'formacion' },
  { id: 'achievements', anchor: 'logros' },
  { id: 'about', anchor: 'sobre-mi' },
  { id: 'contact', anchor: 'contacto' },
];

export function renderStaticPortfolio(
  locale: Locale,
  inlineNameSvg: string,
  onOpenWindow?: (sectionId: SectionId) => void
): HTMLElement {
  const t = uiText[locale];
  const main = document.createElement('main');
  main.id = 'contenido';
  main.className = 'container static-main';

  const cvButton = profile.cvUrl
    ? `<a class="btn-outline" href="${profile.cvUrl}" download>${t.hero.downloadCv}</a>`
    : `<span class="btn-outline btn-muted" aria-disabled="true">${t.hero.downloadCvPending}</span>`;

  const sectionsHtml = SECTIONS.map(({ id, anchor }) => {
    if (id === 'contact') {
      return `
        <section id="${anchor}" class="portfolio-section" aria-labelledby="heading-contact">
          ${renderSectionContent(id, locale)}
        </section>
      `;
    }
    const title = getSectionTitle(id, locale);
    const previewBtn = onOpenWindow
      ? `<button type="button" class="neu-control section-window-btn" data-open-window="${id}">${t.sections.previewCardBtn}</button>`
      : '';
    return `
      <section id="${anchor}" class="portfolio-section" aria-labelledby="heading-${id}">
        <div class="section-header">
          <h2 id="heading-${id}">${title}</h2>
          ${previewBtn}
        </div>
        ${renderSectionContent(id, locale)}
      </section>
    `;
  }).join('');

  main.innerHTML = `
    <section class="hero-static" aria-label="Presentación">
      <div>
        <p class="pill">${profile.aspiration[locale]}</p>
        <h1 class="hero-title">${inlineNameSvg}</h1>
        <p class="hero-location">${profile.location[locale]}</p>
        <div class="hero-actions">
          <a class="btn-primary" href="#proyectos">${t.hero.viewProjects}</a>
          ${cvButton}
        </div>
      </div>

      <div class="hero-photo">
        <img
          src="${profile.photo.src}"
          alt="${profile.photo.alt[locale]}"
          width="800"
          height="1067"
        />
      </div>
    </section>

    ${sectionsHtml}

    <footer class="site-footer">
      <p>${profile.footer[locale]}</p>
    </footer>
  `;

  if (onOpenWindow) {
    main.querySelectorAll<HTMLButtonElement>('[data-open-window]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sectionId = btn.dataset.openWindow as SectionId | undefined;
        if (sectionId) onOpenWindow(sectionId);
      });
    });
  }

  return main;
}
