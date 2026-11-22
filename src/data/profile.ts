import type { ProfileData } from '../types/content';

export const profile: ProfileData = {
  name: 'Belén Calvo',
  aspiration: {
    es: 'Aspiración: Desarrolladora backend',
    en: 'Goal: Backend Developer',
  },
  role: {
    es: 'Estudiante de Programación — Backend, Frontend y Bases de Datos',
    en: 'Programming Student — Backend, Frontend & Databases',
  },
  location: {
    es: 'Mendoza, Argentina · Modalidad remota o híbrida',
    en: 'Mendoza, Argentina · Remote or hybrid',
  },
  about: {
    es: 'Estudiante de 2.º año de la Tecnicatura Universitaria en Programación (UTN – Facultad Regional Mendoza), con egreso estimado en 2027. Desarrollo proyectos grupales de backend con Python y FastAPI, bases de datos PostgreSQL y frontend con HTML, CSS y JavaScript, trabajando con Git/GitHub, ramas y pull requests. Aplico metodologías actuales de desarrollo asistido por IA (Spec-Driven Development, TDD y agentes de código). Fui ayudante de cátedra en Matemática, donde rediseñé el aula virtual de Moodle con HTML y CSS.',
    en: 'Second-year student of the University Technical Degree in Programming (UTN – Mendoza Regional Faculty), expected graduation in 2027. I build team backend projects with Python and FastAPI, PostgreSQL databases, and frontends with HTML, CSS, and JavaScript using Git/GitHub branches and pull requests. I apply AI-assisted development workflows (Spec-Driven Development, TDD, and code agents). Previously served as a Mathematics teaching assistant, redesigning the Moodle virtual classroom with HTML and CSS.',
  },
  photo: {
    src: 'assets/img/foto-belen-fundida.webp',
    alt: {
      es: 'Retrato de Belén Calvo',
      en: 'Portrait of Belén Calvo',
    },
  },
  // TODO: completar Belén — subir el PDF a public/assets/cv/ y agregar la ruta aquí
  cvUrl: undefined,
  links: {
    email: 'beluucalvo@live.com.ar',
    github: 'https://github.com/belcalvo93',
    linkedin: 'https://www.linkedin.com/in/belucalvo/',
  },
  footer: {
    es: '© 2026 Belén Calvo · Mendoza, Argentina',
    en: '© 2026 Belén Calvo · Mendoza, Argentina',
  },
};
