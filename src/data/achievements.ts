import type { AchievementItem } from '../types/content';

export const achievements: AchievementItem[] = [
  {
    id: 'parcial-prog3',
    title: {
      es: 'Parcial 1 de Programación III con 100/100',
      en: 'Programming III Midterm 1 scored 100/100',
    },
    detail: {
      es: 'Frontend Librería desarrollado en equipo con Spec-Driven Development (OpenSpec).',
      en: 'Team bookstore frontend developed with Spec-Driven Development (OpenSpec).',
    },
    period: '2026',
  },
  {
    id: 'ayudante-utn',
    title: {
      es: 'Ayudante de cátedra de Matemática (UTN – FRM)',
      en: 'Mathematics Teaching Assistant (UTN – FRM)',
    },
    detail: {
      es: 'Diseño y maquetación de contenido de estudio en Moodle con HTML y CSS junto al Prof. Cristian Mut.',
      en: 'Designed and structured Moodle study materials with HTML and CSS alongside Prof. Cristian Mut.',
    },
    period: 'Ago – Nov 2025',
  },
  {
    id: 'javamaster-live',
    title: {
      es: 'JavaMaster publicada en java.belencalvo.me',
      en: 'JavaMaster live at java.belencalvo.me',
    },
    detail: {
      es: 'Plataforma gratuita para aprender Java en español alojada en GitHub Pages.',
      en: 'Free Spanish-language Java learning platform hosted on GitHub Pages.',
    },
    period: '2025 – Actualidad',
  },
];
