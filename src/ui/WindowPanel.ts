import { uiText } from '../data/i18n';
import type { Locale, SectionId } from '../types/content';
import { getSectionTitle, renderSectionContent } from './renderSections';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class WindowPanel {
  private overlay: HTMLDivElement;
  private dialog: HTMLElement;
  private titleEl: HTMLHeadingElement;
  private eyebrowEl: HTMLParagraphElement;
  private bodyEl: HTMLDivElement;
  private closeBtn: HTMLButtonElement;
  private lastFocused: HTMLElement | null = null;
  private onCloseCallback?: () => void;

  constructor(root: HTMLElement, onClose?: () => void) {
    this.onCloseCallback = onClose;

    this.overlay = document.createElement('div');
    this.overlay.className = 'window-overlay';
    this.overlay.hidden = true;

    this.overlay.innerHTML = `
      <div class="window-backdrop" data-close="true"></div>
      <section class="glass-panel window-dialog" role="dialog" aria-modal="true" aria-labelledby="window-panel-title" tabindex="-1">
        <header class="window-header">
          <span class="window-icon" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <div class="window-heading">
            <p class="window-eyebrow" hidden></p>
            <h2 id="window-panel-title"></h2>
          </div>
          <button type="button" class="neu-control window-close" aria-label="Cerrar panel"></button>
        </header>
        <div class="window-body"></div>
      </section>
    `;

    root.appendChild(this.overlay);

    this.dialog = this.overlay.querySelector('.window-dialog') as HTMLElement;
    this.titleEl = this.overlay.querySelector('#window-panel-title') as HTMLHeadingElement;
    this.eyebrowEl = this.overlay.querySelector('.window-eyebrow') as HTMLParagraphElement;
    this.bodyEl = this.overlay.querySelector('.window-body') as HTMLDivElement;
    this.closeBtn = this.overlay.querySelector('.window-close') as HTMLButtonElement;

    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      if (target?.dataset.close === 'true') {
        this.close();
      }
    });

    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * @param fromGame si se abre porque el gato entró por la ventana: se muestra como
   *   panel lateral (escritorio) u hoja desde abajo (celular), dejando ver la escena.
   */
  open(sectionId: SectionId, locale: Locale, fromGame = false): void {
    this.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const title = getSectionTitle(sectionId, locale);
    this.titleEl.textContent = title;
    this.overlay.classList.toggle('window-overlay--game', fromGame);
    this.eyebrowEl.hidden = !fromGame;
    this.eyebrowEl.textContent = `~/${title.toLowerCase()}`;
    this.closeBtn.textContent = uiText[locale].controls.close;
    this.closeBtn.setAttribute('aria-label', uiText[locale].controls.close);
    this.bodyEl.innerHTML = renderSectionContent(sectionId, locale);
    this.bodyEl.scrollTop = 0;

    this.overlay.hidden = false;
    document.body.classList.add('has-modal');

    const focusables = this.getFocusables();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      this.dialog.focus();
    }
  }

  close(): void {
    if (this.overlay.hidden) return;
    this.overlay.hidden = true;
    document.body.classList.remove('has-modal');
    this.lastFocused?.focus();
    this.lastFocused = null;
    this.onCloseCallback?.();
  }

  isOpen(): boolean {
    return !this.overlay.hidden;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.overlay.remove();
  }

  private getFocusables(): HTMLElement[] {
    return Array.from(this.dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.overlay.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      const focusables = this.getFocusables();
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };
}
