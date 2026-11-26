import { achievements } from '../data/achievements';
import { courses, education } from '../data/education';
import { uiText } from '../data/i18n';
import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { technologyGroups } from '../data/technologies';
import type { Locale, ProjectItem, SectionId } from '../types/content';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderProjectCard(project: ProjectItem, locale: Locale): string {
  const t = uiText[locale].sections;
  const chips = project.stack
    .map((chip) => `<li class="chip chip--${chip.color}">${escapeHtml(chip.label)}</li>`)
    .join('');

  const highlights = project.highlights[locale]
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  const links: string[] = [];
  if (project.links.demo) {
    links.push(
      `<a class="btn-primary btn-sm" href="${escapeHtml(project.links.demo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.demoLink)}</a>`
    );
  }
  if (project.links.repo) {
    links.push(
      `<a class="btn-outline btn-sm" href="${escapeHtml(project.links.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.codeLink)}</a>`
    );
  }
  if (project.links.docs) {
    links.push(
      `<a class="btn-outline btn-sm" href="${escapeHtml(project.links.docs)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.docsLink)}</a>`
    );
  }

  const imageBlock = project.image
    ? `<img class="project-preview" src="${escapeHtml(project.image.src)}" alt="${escapeHtml(project.image.alt[locale])}" loading="lazy" />`
    : '';

  return `
    <details class="surface-card project-card">
      <summary class="project-summary">
        <div class="project-summary-head">
          <h3 class="project-title">${escapeHtml(project.title[locale])}</h3>
          <span class="project-meta mono">${escapeHtml(project.origin[locale])} · ${escapeHtml(project.year)}</span>
        </div>
        <p class="project-simple">${escapeHtml(project.simpleSummary[locale])}</p>
        <ul class="chip-list">${chips}</ul>
      </summary>
      <div class="project-details">
        <p>${escapeHtml(project.technicalSummary[locale])}</p>
        <ul class="project-highlights">${highlights}</ul>
        ${imageBlock}
        ${links.length > 0 ? `<div class="project-links">${links.join('')}</div>` : ''}
      </div>
    </details>
  `;
}

export function renderSectionContent(sectionId: SectionId, locale: Locale): string {
  const t = uiText[locale].sections;

  switch (sectionId) {
    case 'projects':
      return `
        <p class="section-hint">${escapeHtml(t.projectsHint)}</p>
        <div class="projects-grid">
          ${projects.map((p) => renderProjectCard(p, locale)).join('')}
        </div>
      `;

    case 'technologies':
      return `
        <div class="tech-grid">
          ${technologyGroups
            .map(
              (group) => `
              <article class="surface-card">
                <h3>${escapeHtml(group.title[locale])}</h3>
                <ul class="chip-list">
                  ${group.items
                    .map((item) => `<li class="chip chip--${item.color}">${escapeHtml(item.label)}</li>`)
                    .join('')}
                </ul>
              </article>
            `
            )
            .join('')}
        </div>
      `;

    case 'education':
      return `
        <div class="education-grid">
          ${education
            .map(
              (ed) => `
              <article class="surface-card">
                <h3>${escapeHtml(ed.degree[locale])}</h3>
                <p class="edu-inst">${escapeHtml(ed.institution)}</p>
                <p class="mono edu-period">${escapeHtml(ed.period[locale])}</p>
                <p>${escapeHtml(ed.detail[locale])}</p>
              </article>
            `
            )
            .join('')}
          <article class="surface-card">
            <h3>${escapeHtml(t.coursesTitle)}</h3>
            <ul class="course-list">
              ${courses
                .map(
                  (c) => `
                  <li>
                    <strong>${escapeHtml(c.title)}</strong>
                    <span>${escapeHtml(c.provider)} · <span class="mono">${escapeHtml(c.year)}</span></span>
                  </li>
                `
                )
                .join('')}
            </ul>
          </article>
        </div>
      `;

    case 'achievements':
      return `
        <div class="achievements-grid">
          ${achievements
            .map(
              (ach) => `
              <article class="surface-card">
                <span class="mono edu-period">${escapeHtml(ach.period)}</span>
                <h3>${escapeHtml(ach.title[locale])}</h3>
                <p>${escapeHtml(ach.detail[locale])}</p>
                <div class="achievement-bar" aria-hidden="true"></div>
              </article>
            `
            )
            .join('')}
        </div>
      `;

    case 'about':
      return `
        <article class="surface-card">
          <p>${escapeHtml(profile.about[locale])}</p>
        </article>
      `;

    case 'contact': {
      const c = uiText[locale].contactSection;
      return `
        <div class="contact-layout">
          <div class="contact-left">
            <p class="contact-eyebrow">${escapeHtml(c.eyebrow)}</p>
            <h2 id="heading-contact" class="contact-heading">
              ${escapeHtml(c.headingLine1)}<br />${escapeHtml(c.headingLine2)}
            </h2>
            <p class="contact-desc">${escapeHtml(c.description)}</p>
          </div>
          <div class="contact-right">
            <ul class="contact-icon-row">
              <li>
                <a
                  class="contact-icon-btn"
                  href="mailto:${escapeHtml(profile.links.email)}"
                  aria-label="${escapeHtml(c.emailAria)}"
                  title="${escapeHtml(c.emailAria)}"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  class="contact-icon-btn"
                  href="${escapeHtml(profile.links.linkedin)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="${escapeHtml(c.linkedinAria)}"
                  title="${escapeHtml(c.linkedinAria)}"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M8 11v5" />
                    <path d="M8 8v.01" />
                    <path d="M12 16v-5" />
                    <path d="M16 16v-3a2 2 0 0 0-4 0" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  class="contact-icon-btn"
                  href="${escapeHtml(profile.links.github)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="${escapeHtml(c.githubAria)}"
                  title="${escapeHtml(c.githubAria)}"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
      `;
    }
  }
}

export function getSectionTitle(sectionId: SectionId, locale: Locale): string {
  const t = uiText[locale].sections;
  const map: Record<SectionId, string> = {
    projects: t.projectsTitle,
    technologies: t.technologiesTitle,
    education: t.educationTitle,
    achievements: t.achievementsTitle,
    about: t.aboutTitle,
    contact: t.contactTitle,
  };
  return map[sectionId];
}
