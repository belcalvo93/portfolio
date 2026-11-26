import type { ProjectItem } from '../types/content';

/**
 * Para sumar un proyecto nuevo (por ejemplo Ateneo o Gatoteca), agregá un objeto
 * al arreglo `projects` respetando la interfaz `ProjectItem`.
 */
export const projects: ProjectItem[] = [
  {
    id: 'api-taller-mecanico',
    title: {
      es: 'API Taller Mecánico',
      en: 'Auto Repair Shop API',
    },
    origin: {
      es: 'Trabajo grupal · Programación III',
      en: 'Team project · Programming III',
    },
    year: '2026',
    simpleSummary: {
      // BORRADOR basado en CV — revisar
      es: 'En simple: sistema interno para que un taller mecánico organice sus datos y operaciones de forma ordenada y segura.',
      en: 'In plain words: backend system for an auto repair shop to organize operations and data securely.',
    },
    technicalSummary: {
      es: 'API REST con autenticación y patrón Unit of Work, desarrollada con Spec-Driven Development. Infraestructura base, esquema de datos con migraciones y organización del tablero del equipo.',
      en: 'REST API with authentication and Unit of Work pattern, built with Spec-Driven Development. Base infrastructure, schema migrations, and team board organization.',
    },
    highlights: {
      es: [
        'API REST con autenticación y patrón Unit of Work',
        'Infraestructura base y esquema de datos con migraciones en Alembic',
        'Organización del tablero del equipo (issues, labels y GitHub Projects)',
      ],
      en: [
        'REST API with authentication and Unit of Work pattern',
        'Base infrastructure and schema migrations with Alembic',
        'Team board organization (issues, labels, and GitHub Projects)',
      ],
    },
    stack: [
      { label: 'FastAPI', color: 'fucsia' },
      { label: 'PostgreSQL', color: 'azul' },
      { label: 'Alembic', color: 'lila' },
      { label: 'Spec-Driven Dev', color: 'rosado' },
    ],
    links: {
      repo: 'https://github.com/belcalvo93/taller-mecanico-api',
      // TODO: completar Belén — agregar URL de demo si se despliega
    },
  },
  {
    id: 'api-libreria-kiosco',
    title: {
      es: 'API Librería / Kiosco',
      en: 'Bookstore & Kiosk APIs',
    },
    origin: {
      es: 'Trabajos grupales · Programación III',
      en: 'Team projects · Programming III',
    },
    year: '2026',
    simpleSummary: {
      // BORRADOR basado en README/CV — revisar
      es: 'En simple: sistema para que una librería o kiosco administre su catálogo, clientes y ventas evitando vender productos sin stock.',
      en: 'In plain words: system for a bookstore or kiosk to manage catalog, customers, and sales while preventing overselling.',
    },
    technicalSummary: {
      es: 'APIs REST asíncronas en FastAPI y PostgreSQL: módulo de clientes, migraciones con Alembic, catálogo y pedidos con control de concurrencia.',
      en: 'Asynchronous REST APIs in FastAPI and PostgreSQL: customer module, Alembic migrations, catalog, and orders with concurrency control.',
    },
    highlights: {
      es: [
        'Librería: estructura del repo, conexión a la base, health check, migraciones con Alembic, datos iniciales, README y módulo de clientes',
        'Kiosco: API de catálogo y pedidos con programación asíncrona y control de concurrencia para evitar sobreventa de stock',
      ],
      en: [
        'Bookstore: repository setup, DB connection, health check, Alembic migrations, seed data, README, and customer module',
        'Kiosk: async catalog and orders API with concurrency control to prevent stock overselling',
      ],
    },
    stack: [
      { label: 'FastAPI', color: 'fucsia' },
      { label: 'Pydantic', color: 'lila' },
      { label: 'PostgreSQL', color: 'azul' },
      { label: 'Alembic', color: 'rosado' },
    ],
    links: {
      // TODO: completar Belén — confirmar URL del repositorio en GitHub
    },
  },
  {
    id: 'food-store',
    title: {
      es: 'Food Store — Base de datos PostgreSQL',
      en: 'Food Store — PostgreSQL Database',
    },
    origin: {
      es: 'Trabajo grupal · Base de Datos II',
      en: 'Team project · Databases II',
    },
    year: '2026',
    simpleSummary: {
      // BORRADOR basado en README/CV — revisar
      es: 'En simple: base de datos para que un negocio de comidas registre pedidos, controle su stock y consulte información rápida sin errores.',
      en: 'In plain words: database for a food business to record orders, track stock, and query data reliably.',
    },
    technicalSummary: {
      es: 'Modelado relacional en PostgreSQL, scripts SQL, funciones PL/pgSQL, consultas y backups; repositorio base del equipo con ramas por integrante y pull requests.',
      en: 'Relational modeling in PostgreSQL, SQL scripts, PL/pgSQL functions, queries, and backups; team base repository with feature branches and pull requests.',
    },
    highlights: {
      es: [
        'Modelado entidad-relación y scripts SQL en PostgreSQL',
        'Funciones PL/pgSQL, triggers, consultas y backups',
        'Flujo grupal en GitHub con una rama por integrante y pull requests',
      ],
      en: [
        'Entity-relationship modeling and SQL scripts in PostgreSQL',
        'PL/pgSQL functions, triggers, queries, and backups',
        'Team workflow on GitHub with per-member branches and pull requests',
      ],
    },
    stack: [
      { label: 'PostgreSQL', color: 'azul' },
      { label: 'PL/pgSQL', color: 'lila' },
      { label: 'SQL', color: 'fucsia' },
    ],
    image: {
      src: 'assets/img/food-store.webp',
      alt: {
        es: 'Diagrama entidad-relación de la base de datos Food Store',
        en: 'Entity-relationship diagram of the Food Store database',
      },
    },
    links: {
      repo: 'https://github.com/belcalvo93/base-datos-2',
      docs: 'https://github.com/belcalvo93/base-datos-2#readme',
    },
  },
  {
    id: 'frontend-libreria',
    title: {
      es: 'Frontend Librería',
      en: 'Bookstore Frontend',
    },
    origin: {
      es: 'Parcial 1 de Programación III · Trabajo grupal',
      en: 'Programming III Midterm 1 · Team project',
    },
    year: '2026',
    simpleSummary: {
      // BORRADOR basado en README/CV — revisar
      es: 'En simple: página web donde los clientes pueden explorar el catálogo de una librería y el equipo puede cargar libros, clientes y ventas.',
      en: 'In plain words: website where visitors browse a bookstore catalog and staff can register books, customers, and sales.',
    },
    technicalSummary: {
      es: 'Sitio web grupal desarrollado con HTML, CSS y JavaScript nativos bajo Spec-Driven Development (OpenSpec). Despliegue en VPS con Easypanel y dominio propio.',
      en: 'Team web app built with vanilla HTML, CSS, and JavaScript under Spec-Driven Development (OpenSpec). Deployed on a VPS with Easypanel and custom DNS.',
    },
    highlights: {
      es: [
        'Desarrollado con Spec-Driven Development (OpenSpec) — Calificación: 100/100',
        'Despliegue de servicios en VPS con Easypanel y configuración de dominio propio (DNS)',
      ],
      en: [
        'Built with Spec-Driven Development (OpenSpec) — Grade: 100/100',
        'Service deployment on a VPS with Easypanel and custom domain (DNS)',
      ],
    },
    stack: [
      { label: 'HTML5', color: 'fucsia' },
      { label: 'CSS3', color: 'lila' },
      { label: 'JavaScript', color: 'azul' },
      { label: 'OpenSpec', color: 'rosado' },
    ],
    links: {
      repo: 'https://github.com/belcalvo93/parcial1-libreria',
      // TODO: completar Belén — agregar URL pública si corresponde
    },
  },
  {
    id: 'turnos-odontologicos',
    title: {
      es: 'Gestión de Turnos Odontológicos',
      en: 'Dental Appointments Management',
    },
    origin: {
      es: 'Trabajo integrador grupal · Metodología I',
      en: 'Team capstone · Methodology I',
    },
    year: '2026',
    simpleSummary: {
      // BORRADOR basado en CV — revisar
      es: 'En simple: herramienta pensada para que un consultorio odontológico organice sus turnos de forma ordenada y sin superposiciones.',
      en: 'In plain words: tool designed for a dental clinic to schedule and manage appointments reliably.',
    },
    technicalSummary: {
      es: 'Sistema en Python desarrollado con TDD (pytest) y agentes de IA (OpenSpec / Active Stack). A cargo de la base de conocimiento, roadmap y bitácora de decisiones.',
      en: 'Python system built with TDD (pytest) and AI agents (OpenSpec / Active Stack). Responsible for the knowledge base, project roadmap, and decision log.',
    },
    highlights: {
      es: [
        'Desarrollo guiado por pruebas (TDD) con pytest',
        'Base de conocimiento, roadmap del proyecto y bitácora de decisiones (OpenSpec / Active Stack)',
      ],
      en: [
        'Test-driven development (TDD) with pytest',
        'Knowledge base, project roadmap, and decision log (OpenSpec / Active Stack)',
      ],
    },
    stack: [
      { label: 'Python', color: 'azul' },
      { label: 'pytest', color: 'lila' },
      { label: 'TDD', color: 'fucsia' },
      { label: 'OpenSpec', color: 'rosado' },
    ],
    links: {
      // TODO: completar Belén — agregar URL del repositorio si está publicado
    },
  },
  {
    id: 'javamaster',
    title: {
      es: 'JavaMaster — Plataforma para aprender Java',
      en: 'JavaMaster — Java Learning Platform',
    },
    origin: {
      es: 'Proyecto personal · En desarrollo',
      en: 'Personal project · In progress',
    },
    year: '2025 – Actualidad',
    simpleSummary: {
      // BORRADOR basado en README/CV — revisar
      es: 'En simple: sitio web gratuito en español para que cualquier persona aprenda Java desde cero practicando ejercicios directo en el navegador.',
      en: 'In plain words: free Spanish website to learn Java from scratch by practicing exercises right in the browser.',
    },
    technicalSummary: {
      es: 'Plataforma gratuita con lecciones y ejercicios prácticos publicada en GitHub Pages; en desarrollo el registro de usuarios y guardado de progreso.',
      en: 'Free platform with lessons and hands-on exercises published on GitHub Pages; user registration and progress persistence in development.',
    },
    highlights: {
      es: [
        'Publicada en producción en java.belencalvo.me (GitHub Pages)',
        'Lecciones y ejercicios prácticos en español',
        'En desarrollo: registro de usuarios y guardado de progreso',
      ],
      en: [
        'Live in production at java.belencalvo.me (GitHub Pages)',
        'Lessons and practical exercises in Spanish',
        'In progress: user registration and progress saving',
      ],
    },
    stack: [
      { label: 'Java', color: 'fucsia' },
      { label: 'HTML5', color: 'lila' },
      { label: 'CSS3', color: 'azul' },
      { label: 'JavaScript', color: 'rosado' },
    ],
    image: {
      src: 'assets/img/javamaster.webp',
      alt: {
        es: 'Ejercicio de JavaMaster con editor de código y validación aprobada',
        en: 'JavaMaster exercise with code editor and passing validation',
      },
    },
    links: {
      demo: 'https://java.belencalvo.me',
      repo: 'https://github.com/belcalvo93/java-learning-platform',
      docs: 'https://github.com/belcalvo93/java-learning-platform#readme',
    },
  },
];
