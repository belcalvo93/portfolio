import type { TechnologyGroup } from '../types/content';

export const technologyGroups: TechnologyGroup[] = [
  {
    id: 'languages',
    title: { es: 'Lenguajes', en: 'Languages' },
    items: [
      { label: 'Java', color: 'fucsia' },
      { label: 'Python', color: 'azul' },
      { label: 'JavaScript', color: 'lila' },
      { label: 'TypeScript (inicial)', color: 'rosado' },
      { label: 'SQL', color: 'azul' },
      { label: 'HTML5', color: 'fucsia' },
      { label: 'CSS3', color: 'lila' },
    ],
  },
  {
    id: 'backend',
    title: { es: 'Backend', en: 'Backend' },
    items: [
      { label: 'FastAPI', color: 'fucsia' },
      { label: 'Pydantic', color: 'lila' },
      { label: 'SQLModel', color: 'azul' },
      { label: 'Alembic', color: 'rosado' },
      { label: 'APIs REST', color: 'lila' },
    ],
  },
  {
    id: 'databases',
    title: { es: 'Bases de datos', en: 'Databases' },
    items: [
      { label: 'PostgreSQL', color: 'azul' },
      { label: 'PL/pgSQL', color: 'lila' },
      { label: 'MariaDB / MySQL', color: 'fucsia' },
      { label: 'pgAdmin', color: 'rosado' },
      { label: 'DBeaver', color: 'lila' },
    ],
  },
  {
    id: 'methodologies',
    title: { es: 'Metodologías y testing', en: 'Methodologies & testing' },
    items: [
      { label: 'Spec-Driven Development (OpenSpec)', color: 'lila' },
      { label: 'TDD', color: 'fucsia' },
      { label: 'pytest', color: 'azul' },
      { label: 'POO', color: 'rosado' },
      { label: 'UML', color: 'lila' },
    ],
  },
  {
    id: 'tools',
    title: { es: 'Herramientas', en: 'Tools' },
    items: [
      { label: 'Git y GitHub', color: 'lila' },
      { label: 'VS Code', color: 'azul' },
      { label: 'IntelliJ IDEA', color: 'fucsia' },
      { label: 'Easypanel', color: 'rosado' },
      { label: 'GitHub Pages', color: 'lila' },
      { label: 'Moodle', color: 'azul' },
    ],
  },
  {
    id: 'ai',
    title: { es: 'IA aplicada al desarrollo', en: 'AI-assisted development' },
    items: [
      { label: 'Claude Code', color: 'lila' },
      { label: 'OpenCode', color: 'fucsia' },
      { label: 'Agentes con AGENTS.md', color: 'azul' },
      { label: 'Prompting por roles', color: 'rosado' },
    ],
  },
];
