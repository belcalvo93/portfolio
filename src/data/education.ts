import type { CourseEntry, EducationEntry } from '../types/content';

export const education: EducationEntry[] = [
  {
    id: 'utn-tup',
    institution: 'Universidad Tecnológica Nacional – Facultad Regional Mendoza',
    degree: {
      es: 'Tecnicatura Universitaria en Programación',
      en: 'University Technical Degree in Programming',
    },
    period: {
      es: '2.º año · 2025 – actualidad · Egreso estimado: 2027',
      en: '2nd year · 2025 – present · Expected graduation: 2027',
    },
    detail: {
      es: 'Formación orientada a programación, bases de datos relacionales, ingeniería de software y desarrollo web.',
      en: 'Focused on programming, relational databases, software engineering, and web development.',
    },
  },
];

export const courses: CourseEntry[] = [
  {
    id: 'santander-ds',
    title: 'Introducción a la Ciencia de Datos',
    provider: 'Santander Open Academy',
    year: '2026',
  },
  {
    id: 'big-school-ia',
    title: 'Iniciación al Desarrollo con IA',
    provider: 'BIG school',
    year: '2026',
  },
  {
    id: 'codigo-facilito-java',
    title: 'Curso de Java Profesional',
    provider: 'Código Facilito',
    year: '2026',
  },
  {
    id: 'egg-trainee',
    title: 'Programador Trainee',
    provider: 'Egg Education',
    year: '2024',
  },
  {
    id: 'argentina-programa',
    title: 'Argentina Programa — Programador Full Stack, módulo inicial',
    provider: 'Argentina Programa',
    year: '2023',
  },
  {
    id: 'casa-del-futuro',
    title: 'Programación Web HTML & CSS',
    provider: 'Casa del Futuro, Godoy Cruz',
    year: '2023',
  },
];
