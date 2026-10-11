# AGENTS.md — Portfolio de Belén Calvo

## Contexto
Portfolio personal de una estudiante de la Tecnicatura en Programación (UTN Mendoza)
orientada a backend y bases de datos. Objetivo: conseguir entrevistas trainee/junior.
La investigación completa está en `docs/investigacion-portfolio.md`. Leela antes de
proponer estructura o contenido, en especial las secciones 4 y 5.

## Stack y publicación
- HTML + CSS + JavaScript puro. Sin frameworks, sin build, sin dependencias npm.
- Una sola página (`index.html`), estilos en `styles.css`, JS mínimo en `main.js`.
- Se publica en Vercel (preset "Other"), primero en `belencalvo.vercel.app` y
  después en `belencalvo.is-a.dev`.

## Estructura de la página (en este orden)
1. Cabecera: nombre, rol, ubicación (Mendoza, Argentina), enlaces a GitHub, LinkedIn,
   CV (PDF) y correo.
2. Proyectos destacados (3): problema que resuelve, stack, captura y botones
   Demo · Código · Docs.
3. Tecnologías agrupadas por área, solo las usadas en los proyectos.
4. Formación y cursos pertinentes.
5. Sobre mí (3–4 líneas).
6. Contacto: correo, LinkedIn y GitHub.

## Reglas de contenido (obligatorias)
- No inventar usuarios, clientes, métricas ni experiencia laboral.
- Los proyectos académicos se marcan como académicos.
- Si falta un dato, preguntarme. Nunca usar texto de relleno inventado.
- Sin barras ni porcentajes de dominio de tecnologías.
- No publicar teléfono, WhatsApp ni Instagram.
- Español primero; dejar preparada la estructura para una versión en inglés.

## Calidad
- Responsive (mobile first), HTML semántico, contraste suficiente (WCAG 2.2 AA),
  texto alternativo en imágenes, navegable con teclado.
- Carga rápida: imágenes optimizadas, sin animaciones pesadas.
- Diseño sobrio y orientado al contenido.

## Forma de trabajo
- Primero proponer un plan y esperar mi aprobación antes de escribir código.
- Cambios chicos; explicar cada decisión técnica en lenguaje simple.
- Commits pequeños con mensajes claros en español.
- Nunca subir secretos ni archivos `.env`.
- La carpeta `docs/` es privada (está en .gitignore): no mover su contenido a archivos públicos.
- No tocar nada relacionado con is-a.dev: ese pedido lo hago yo a mano.