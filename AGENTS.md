# AGENTS.md — Portfolio de Belén Calvo

## Contexto
Portfolio personal de una estudiante de la Tecnicatura Universitaria en Programación (UTN Mendoza)
orientada a backend y bases de datos. Objetivo: conseguir entrevistas trainee/junior.
La investigación completa está en `docs/investigacion-portfolio.md`. Leela antes de
proponer estructura o contenido, en especial las secciones 4 y 5.

## Stack y publicación
- Vite + TypeScript + Three.js.
- Sin frameworks de UI (sin React/Vue); interfaz modular en TypeScript y CSS.
- Carga diferida obligatoria: `three` y todo `src/game/` se cargan con `import()` dinámico
  únicamente cuando el juego 3D está activo. La versión sin juego no descarga Three.js.
- Al desactivar el juego, liberar la escena (`dispose`) y limpiar listeners.
- Se publica en Vercel (build `npm run build`, directorio de salida `dist`), primero en
  `belencalvo.vercel.app` y después en `belencalvo.is-a.dev`.

## Estructura y separación de datos
- El contenido (proyectos, tecnologías, formación, logros, perfil e idiomas ES/EN) vive
  en `src/data/` separado de la escena 3D (`src/game/`) y de la UI (`src/ui/`).
- Para sumar un proyecto nuevo (por ejemplo Ateneo o Gatoteca), solo hay que agregar un
  objeto al arreglo `projects` en `src/data/projects.ts` siguiendo la interfaz `ProjectItem`
  de `src/types/content.ts`, sin tocar la escena 3D ni los componentes de UI.
- Las imágenes públicas están en `public/assets/img/` (retrato: `assets/img/foto-belen-fundida.webp`).

## Diseño e interfaz
- Concepto 3D: "Tejados al atardecer" — gato recorriendo techos low-poly con ventanas iluminadas.
- Paleta: fondo `#0F0D18`, lila `#C09BFF`, fucsia `#F472B6`, azul francia `#6EA8FF`, rosado `#FDA4CF`.
  Nada de lunas ni estrellas.
- Prohibido: manchas de degradé brillante desde esquinas, glows difusos de fondo, gradientes
  saturados en todo el fondo o texto con degradé. Fondos planos o con textura de grano muy sutil.
- Tipografía: títulos en `Playfair Display`, textos en `DM Sans`, detalles de código en `JetBrains Mono`.
- Modo oscuro por defecto con botón claro/oscuro y selector `ES / EN` (neumorphism suave).
- Un solo botón para alternar `"Desactivar juego"` / `"Activar juego"`.
- Arranca con el juego desactivado si el usuario tiene `prefers-reduced-motion: reduce`.
- En celular: barra inferior fija con `"El Paseo"`, `"Proyectos"`, `"Sobre mí"` y `"Contacto"`.

## Reglas de contenido (obligatorias)
- No inventar usuarios, clientes, métricas, cursos ni experiencia laboral.
- Los proyectos académicos se marcan como académicos.
- Si falta un dato, usar `[texto pendiente]` o preguntarme. Nunca inventar texto de relleno.
- Sin barras ni porcentajes de dominio de tecnologías.
- No publicar teléfono, WhatsApp ni Instagram.
- Español primero; estructura preparada para versión en inglés.

## Calidad
- Responsive (mobile first), HTML semántico, contraste suficiente (WCAG 2.2 AA),
  texto alternativo en imágenes, navegable con teclado (`Esc` cierra paneles).
- Carga rápida: imágenes optimizadas, sin animaciones pesadas innecesarias.

## Forma de trabajo
- Primero proponer un plan y esperar aprobación antes de escribir código.
- Cambios chicos; explicar cada decisión técnica en lenguaje simple.
- Commits pequeños con mensajes claros en español, sin líneas de co-autor ni menciones a
  herramientas de IA.
- Nunca subir secretos ni archivos `.env`.
- La carpeta `docs/` es privada (está en `.gitignore`): no mover su contenido a archivos públicos.
- No tocar nada relacionado con `is-a.dev`: ese pedido se hace a mano.
