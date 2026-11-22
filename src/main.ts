import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <header class="topbar">
      <a class="monogram" href="#contenido" aria-label="Belén Calvo, inicio">BC</a>

      <nav aria-label="Navegación principal">
        <ul class="topbar-nav">
          <li><a href="#proyectos" aria-current="page">Proyectos</a></li>
          <li><a href="#tecnologias">Tecnologías</a></li>
          <li><a href="#formacion">Formación</a></li>
          <li><a href="#contacto">Contacto</a></li>
        </ul>
      </nav>

      <div class="topbar-actions">
        <button id="toggle-game" class="neu-control" type="button">Desactivar juego</button>
        <button id="toggle-lang" class="neu-control" type="button" aria-label="Cambiar idioma">ES / EN</button>
        <button id="toggle-theme" class="neu-control" type="button" aria-label="Cambiar tema claro u oscuro">Claro</button>
      </div>
    </header>

    <main id="contenido" class="container" style="padding-bottom: 5.5rem;">
      <section class="hero-static" aria-label="Presentación">
        <div>
          <p class="pill">Aspiración: Desarrolladora backend</p>
          <h1>Belén Calvo</h1>
          <p class="hero-role">Estudiante de Programación — Backend, Frontend y Bases de Datos</p>
          <p class="hero-location">Mendoza, Argentina · Modalidad remota o híbrida</p>
          <div class="hero-actions">
            <a class="btn-primary" href="#proyectos">Ver proyectos</a>
            <a class="btn-outline" href="#contacto">Descargar CV</a>
          </div>
          <p class="mono" style="font-size: 0.85rem; color: var(--text-muted);">
            { vista previa de estilos base · Paso 2 }
          </p>
        </div>

        <div class="hero-photo">
          <img
            src="assets/img/foto-belen-retrato.webp"
            alt="Retrato de Belén Calvo"
            width="800"
            height="1067"
          />
        </div>
      </section>

      <section class="glass-panel" aria-label="Muestra de componentes">
        <h2>Muestra de sistema visual</h2>
        <p>
          Fondo plano con grano sutil, panel con glassmorphism AA, chips por color y barra de logro.
          La escena 3D con carga diferida entra en el Paso 4.
        </p>
        <ul class="chip-list" style="margin-bottom: 1.25rem;">
          <li class="chip chip--lila">FastAPI</li>
          <li class="chip chip--azul">PostgreSQL</li>
          <li class="chip chip--fucsia">Python</li>
          <li class="chip chip--rosado">Spec-Driven Development</li>
        </ul>
        <div class="surface-card">
          <strong>Parcial 1 de Programación III con 100/100</strong>
          <div class="achievement-bar" aria-hidden="true"></div>
        </div>
      </section>
    </main>

    <nav class="mobile-nav" aria-label="Navegación móvil">
      <button type="button" class="is-active">🐾<span>El Paseo</span></button>
      <a href="#proyectos">📁<span>Proyectos</span></a>
      <a href="#sobre-mi">👤<span>Sobre mí</span></a>
      <a href="#contacto">✉️<span>Contacto</span></a>
    </nav>
  `;

  const root = document.documentElement;
  const themeBtn = document.querySelector<HTMLButtonElement>('#toggle-theme');
  themeBtn?.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    root.setAttribute('data-theme', isLight ? 'dark' : 'light');
    themeBtn.textContent = isLight ? 'Claro' : 'Oscuro';
  });
}
