import type { Locale } from '../types/content';

export const uiText: Record<
  Locale,
  {
    skipLink: string;
    nav: {
      projects: string;
      technologies: string;
      education: string;
      achievements: string;
      about: string;
      contact: string;
    };
    mobileNav: {
      walk: string;
      projects: string;
      about: string;
      contact: string;
    };
    controls: {
      disableGame: string;
      enableGame: string;
      toLight: string;
      toDark: string;
      close: string;
    };
    game: {
      loading: string;
      hint: string;
      /** Botón que aparece frente a una ventana; {section} se reemplaza por el nombre. */
      enter: string;
      enterKey: string;
    };
    hero: {
      viewProjects: string;
      downloadCv: string;
      downloadCvPending: string;
    };
    sections: {
      projectsTitle: string;
      projectsHint: string;
      technologiesTitle: string;
      educationTitle: string;
      coursesTitle: string;
      achievementsTitle: string;
      aboutTitle: string;
      contactTitle: string;
      codeLink: string;
      demoLink: string;
      docsLink: string;
      previewCardBtn: string;
    };
    contactSection: {
      eyebrow: string;
      headingLine1: string;
      headingLine2: string;
      description: string;
      emailAria: string;
      linkedinAria: string;
      githubAria: string;
    };
  }
> = {
  es: {
    skipLink: 'Saltar al contenido',
    nav: {
      projects: 'Proyectos',
      technologies: 'Tecnologías',
      education: 'Formación',
      achievements: 'Logros',
      about: 'Sobre mí',
      contact: 'Contacto',
    },
    mobileNav: {
      walk: 'El Paseo',
      projects: 'Proyectos',
      about: 'Sobre mí',
      contact: 'Contacto',
    },
    controls: {
      disableGame: 'Desactivar juego',
      enableGame: 'Activar juego',
      toLight: 'Cambiar a modo claro',
      toDark: 'Cambiar a modo oscuro',
      close: 'Cerrar',
    },
    game: {
      loading: 'Cargando los tejados…',
      hint: 'Mové al gato con WASD / flechas o tocá una ventana',
      enter: 'Entrar a {section}',
      enterKey: 'Tecla E',
    },
    hero: {
      viewProjects: 'Ver proyectos',
      downloadCv: 'Descargar CV',
      downloadCvPending: 'Descargar CV (próximamente)',
    },
    sections: {
      projectsTitle: 'Proyectos',
      projectsHint: 'Hacé clic en un proyecto para ver el detalle técnico.',
      technologiesTitle: 'Tecnologías',
      educationTitle: 'Formación',
      coursesTitle: 'Cursos y certificaciones',
      achievementsTitle: 'Logros desbloqueados',
      aboutTitle: 'Sobre mí',
      contactTitle: 'Contacto',
      codeLink: 'Código',
      demoLink: 'Demo',
      docsLink: 'Docs',
      previewCardBtn: 'Abrir vista de ventana',
    },
    contactSection: {
      eyebrow: 'CONTACTO',
      headingLine1: 'Trabajemos',
      headingLine2: 'juntos',
      description:
        '¿Buscás construir un proyecto desde cero o sumar a alguien a tu equipo? Ponete en contacto conmigo.',
      emailAria: 'Enviar un email a Belén',
      linkedinAria: 'LinkedIn de Belén (abre en otra pestaña)',
      githubAria: 'GitHub de Belén (abre en otra pestaña)',
    },
  },
  en: {
    skipLink: 'Skip to content',
    nav: {
      projects: 'Projects',
      technologies: 'Technologies',
      education: 'Education',
      achievements: 'Achievements',
      about: 'About me',
      contact: 'Contact',
    },
    mobileNav: {
      walk: 'The Walk',
      projects: 'Projects',
      about: 'About',
      contact: 'Contact',
    },
    controls: {
      disableGame: 'Disable game',
      enableGame: 'Enable game',
      toLight: 'Switch to light mode',
      toDark: 'Switch to dark mode',
      close: 'Close',
    },
    game: {
      loading: 'Loading rooftops…',
      hint: 'Move the cat with WASD / arrows or tap a window',
      enter: 'Enter {section}',
      enterKey: 'Key E',
    },
    hero: {
      viewProjects: 'View projects',
      downloadCv: 'Download CV',
      downloadCvPending: 'Download CV (coming soon)',
    },
    sections: {
      projectsTitle: 'Projects',
      projectsHint: 'Click any project to expand technical details.',
      technologiesTitle: 'Technologies',
      educationTitle: 'Education',
      coursesTitle: 'Courses & certifications',
      achievementsTitle: 'Unlocked achievements',
      aboutTitle: 'About me',
      contactTitle: 'Contact',
      codeLink: 'Code',
      demoLink: 'Live demo',
      docsLink: 'Docs',
      previewCardBtn: 'Open window preview',
    },
    contactSection: {
      eyebrow: 'CONTACT',
      headingLine1: "Let's work",
      headingLine2: 'together',
      description:
        'Looking to build a project from scratch or add someone to your team? Get in touch with me.',
      emailAria: 'Send an email to Belén',
      linkedinAria: "Belén's LinkedIn (opens in a new tab)",
      githubAria: "Belén's GitHub (opens in a new tab)",
    },
  },
};
