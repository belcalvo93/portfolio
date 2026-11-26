export type Locale = 'es' | 'en';

export type LocalizedText = {
  es: string;
  en: string;
};

export type ChipColor = 'lila' | 'fucsia' | 'azul' | 'rosado';

export interface TechChip {
  label: string;
  color: ChipColor;
}

export interface ProjectItem {
  id: string;
  title: LocalizedText;
  origin: LocalizedText;
  year: string;
  /** Borrador en lenguaje simple para personas no técnicas (revisar). */
  simpleSummary: LocalizedText;
  technicalSummary: LocalizedText;
  highlights: {
    es: string[];
    en: string[];
  };
  stack: TechChip[];
  image?: {
    src: string;
    alt: LocalizedText;
  };
  links: {
    repo?: string;
    demo?: string;
    docs?: string;
  };
}

export interface TechnologyGroup {
  id: string;
  title: LocalizedText;
  items: TechChip[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: LocalizedText;
  period: LocalizedText;
  detail: LocalizedText;
}

export interface CourseEntry {
  id: string;
  title: string;
  provider: string;
  year: string;
}

export interface AchievementItem {
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
  period: string;
}

export interface ProfileData {
  name: string;
  aspiration: LocalizedText;
  role: LocalizedText;
  location: LocalizedText;
  about: LocalizedText;
  photo: {
    src: string;
    alt: LocalizedText;
  };
  cvUrl?: string;
  links: {
    email: string;
    github: string;
    linkedin: string;
  };
  footer: LocalizedText;
}

export type SectionId =
  | 'projects'
  | 'technologies'
  | 'education'
  | 'achievements'
  | 'about'
  | 'contact';
