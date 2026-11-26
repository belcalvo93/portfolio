import * as THREE from 'three';
import type { Locale, SectionId } from '../types/content';
import { CatPlayer } from './CatPlayer';
import { InputController } from './InputController';
import { RooftopsWorld } from './RooftopsWorld';
import { findNearestWindow, getApproachPoint, hopPosition, type Point3, type WindowAnchor } from './windowLogic';

export interface SceneManagerOptions {
  container: HTMLElement;
  theme: 'dark' | 'light';
  locale: Locale;
  /** Si es true, el gato no hace la animación de entrar/salir: se abre directo. */
  reducedMotion?: boolean;
  /** Avisa cuando el gato queda frente a una ventana (o se aleja: null). */
  onNearWindowChange?: (sectionId: SectionId | null) => void;
  /** Avisa cuando el gato terminó de entrar por la ventana. */
  onEnterWindow?: (sectionId: SectionId) => void;
}

/**
 * Momentos del gato:
 * - walk: camina libre.
 * - approach: camina solo hacia una ventana que se tocó.
 * - entering / exiting: animación de salto por la ventana.
 * - inside: está "adentro" mientras se ve la tarjeta.
 */
type CatMode = 'walk' | 'approach' | 'entering' | 'inside' | 'exiting';

const ENTER_DURATION = 0.95;
const EXIT_DURATION = 0.7;
/** Parte de la animación de entrada que ocupa el salto hasta la repisa de la ventana. */
const HOP_PART = 0.55;
const FACE_WINDOW = Math.PI;
const FACE_CAMERA = 0;

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private world: RooftopsWorld;
  private cat: CatPlayer;
  private input: InputController;
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private container: HTMLElement;
  private options: SceneManagerOptions;

  private rafId: number | null = null;
  private lastTime = 0;
  private disposed = false;

  private readonly cameraOffset = new THREE.Vector3(0, 4.4, 11.2);
  private readonly lookTarget = new THREE.Vector3();
  private readonly desiredLook = new THREE.Vector3();
  private readonly desiredCamPos = new THREE.Vector3();

  private mode: CatMode = 'walk';
  private nearWindow: SectionId | null = null;
  private activeWindow: SectionId | null = null;
  private animT = 0;
  private animFrom: Point3 = { x: 0, y: 0, z: 0 };
  private readonly anchors: WindowAnchor[];

  constructor(options: SceneManagerOptions) {
    const { container, theme, locale } = options;
    this.options = options;
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(theme === 'light' ? 0xf0c8d2 : 0x272550, 0.0085);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 180);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    // Iluminación suave y cálida
    this.ambientLight = new THREE.AmbientLight(0xd9c7f0, 0.85);
    this.dirLight = new THREE.DirectionalLight(0xfda4cf, 0.9);
    this.dirLight.position.set(12, 18, 10);
    this.scene.add(this.ambientLight, this.dirLight);

    this.world = new RooftopsWorld(theme, locale);
    this.cat = new CatPlayer();
    this.cat.group.position.set(0, 0, 2);

    this.anchors = this.world.windows.map((w) => ({
      id: w.sectionId,
      x: w.position.x,
      z: w.position.z,
    }));

    this.scene.add(this.world.group, this.cat.group);

    this.camera.position.copy(this.cat.group.position).add(this.cameraOffset);
    this.lookTarget.set(0, 1.85, -2);
    this.camera.lookAt(this.lookTarget);

    this.input = new InputController(
      this.renderer.domElement,
      this.camera,
      this.world.walkableMeshes,
      this.world.windowHitMeshes,
      {
        onWindowTap: (id) => this.enterWindow(id as SectionId),
        onAction: () => this.enterWindow(),
      }
    );

    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.setTheme(theme);
    this.startLoop();
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.world.updateTheme(theme);
    const fog = this.scene.fog as THREE.FogExp2 | null;
    if (theme === 'light') {
      // Sol de amanecer: luz rosada y cálida
      if (fog) fog.color.setHex(0xf0c8d2);
      this.ambientLight.color.setHex(0xfff0f4);
      this.ambientLight.intensity = 1.0;
      this.dirLight.color.setHex(0xffd6e2);
      this.dirLight.intensity = 1.0;
    } else {
      // Luz de luna: azulada pero con fuerza suficiente para ver texturas
      if (fog) fog.color.setHex(0x272550);
      this.ambientLight.color.setHex(0xa3aee8);
      this.ambientLight.intensity = 1.15;
      this.dirLight.color.setHex(0xdde4ff);
      this.dirLight.intensity = 1.1;
    }
  }

  setLocale(locale: Locale): void {
    this.world.updateLocale(locale);
  }

  /**
   * Pide entrar por una ventana. Sin id usa la ventana que el gato tiene enfrente.
   * Si el gato está lejos, primero camina solo hasta ella.
   */
  enterWindow(sectionId?: SectionId): void {
    if (this.mode !== 'walk' && this.mode !== 'approach') return;
    const id = sectionId ?? this.nearWindow;
    if (!id) return;
    const anchor = this.world.getWindowAnchor(id);
    if (!anchor) return;

    this.activeWindow = id;
    const spot = getApproachPoint(anchor);

    if (this.options.reducedMotion) {
      this.cat.group.position.set(spot.x, 0, spot.z);
      this.cat.group.rotation.y = FACE_WINDOW;
      this.setMode('inside');
      this.options.onEnterWindow?.(id);
      return;
    }

    if (this.nearWindow === id) {
      this.startEntering();
    } else {
      this.input.setTarget(spot.x, spot.z);
      this.mode = 'approach';
    }
  }

  /** Se cerró la tarjeta: el gato vuelve a salir al techo. */
  exitWindow(): void {
    if (this.mode !== 'inside' && this.mode !== 'entering') return;
    if (this.options.reducedMotion) {
      this.finishExit();
      return;
    }
    this.animT = 0;
    this.setMode('exiting');
  }

  private startEntering(): void {
    this.input.clearTarget();
    const p = this.cat.group.position;
    this.animFrom = { x: p.x, y: 0, z: p.z };
    this.animT = 0;
    this.setMode('entering');
  }

  private finishExit(): void {
    const anchor = this.activeWindow ? this.world.getWindowAnchor(this.activeWindow) : null;
    if (anchor) {
      const spot = getApproachPoint(anchor);
      this.cat.group.position.set(spot.x, 0, spot.z);
    }
    this.cat.group.visible = true;
    this.cat.group.scale.setScalar(1);
    this.cat.group.rotation.y = FACE_CAMERA;
    this.activeWindow = null;
    this.setMode('walk');
  }

  private setMode(mode: CatMode): void {
    this.mode = mode;
    const atWindow = mode !== 'walk' && mode !== 'approach';
    // Mientras entra o está adentro, no se ofrece "Entrar" ni se ve el cartel tapando la cámara
    if (atWindow) this.setNearWindow(null);
    this.world.setLabelHidden(atWindow ? this.activeWindow : null);
  }

  private setNearWindow(id: SectionId | null): void {
    if (id === this.nearWindow) return;
    this.nearWindow = id;
    this.world.setHighlightedWindow(id);
    this.options.onNearWindowChange?.(id);
  }

  private startLoop(): void {
    if (this.rafId !== null || this.disposed) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (now: number): void => {
    if (this.disposed) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.world.update(now / 1000);

    if (this.mode === 'walk' || this.mode === 'approach') {
      this.updateWalking(dt);
    } else {
      this.updateWindowAnimation(dt);
    }

    this.camera.position.lerp(this.desiredCamPos, Math.min(1, dt * 5));
    this.lookTarget.lerp(this.desiredLook, Math.min(1, dt * 6));
    this.camera.lookAt(this.lookTarget);

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private updateWalking(dt: number): void {
    const pos = this.cat.getPosition();

    if (this.mode === 'approach' && this.input.isKeyboardMoving()) {
      // El teclado cancela el paseo automático
      this.input.clearTarget();
      this.activeWindow = null;
      this.mode = 'walk';
    }

    const move = this.input.getMoveVector(pos);
    this.cat.update(dt, move.x, move.z);

    // Mantener dentro de los tejados
    const clamped = this.world.clampPosition(pos.x, pos.z);
    pos.x = clamped.x;
    pos.z = clamped.z;

    this.setNearWindow(findNearestWindow(pos, this.anchors) as SectionId | null);

    if (this.mode === 'approach' && !this.input.hasTarget()) {
      // Llegó frente a la ventana que se tocó
      this.startEntering();
      return;
    }

    // Cámara suave en tercera persona
    this.desiredCamPos.set(pos.x + this.cameraOffset.x, pos.y + this.cameraOffset.y, pos.z + this.cameraOffset.z);
    this.desiredLook.set(pos.x, pos.y + 1.85, pos.z - 4.0);
  }

  private updateWindowAnimation(dt: number): void {
    const anchor = this.activeWindow ? this.world.getWindowAnchor(this.activeWindow) : null;
    if (!anchor) {
      this.finishExit();
      return;
    }

    // La repisa de la ventana y un punto "adentro", detrás del vidrio
    const sill: Point3 = { x: anchor.x, y: 0.5, z: anchor.z + 1.05 };
    const inside: Point3 = { x: anchor.x, y: 0.55, z: anchor.z + 0.2 };
    const spot = getApproachPoint(anchor);
    const outside: Point3 = { x: spot.x, y: 0, z: spot.z };

    // Cámara: se acerca a la ventana
    this.desiredCamPos.set(anchor.x, 2.3, anchor.z + 5.6);
    this.desiredLook.set(anchor.x, 1.1, anchor.z);

    const cat = this.cat.group;
    this.cat.update(dt, 0, 0);

    if (this.mode === 'entering') {
      this.animT = Math.min(1, this.animT + dt / ENTER_DURATION);
      cat.rotation.y = FACE_WINDOW;
      if (this.animT < HOP_PART) {
        const t = easeInOut(this.animT / HOP_PART);
        const p = hopPosition(this.animFrom, sill, t);
        cat.position.set(p.x, p.y, p.z);
        cat.scale.setScalar(1 - 0.2 * t);
      } else {
        // Se mete por la ventana: el vidrio lo va tapando
        const t = easeInOut((this.animT - HOP_PART) / (1 - HOP_PART));
        cat.position.set(sill.x, sill.y + (inside.y - sill.y) * t, sill.z + (inside.z - sill.z) * t);
      }
      if (this.animT >= 1) {
        cat.visible = false;
        this.setMode('inside');
        this.options.onEnterWindow?.(this.activeWindow as SectionId);
      }
      return;
    }

    if (this.mode === 'exiting') {
      this.animT = Math.min(1, this.animT + dt / EXIT_DURATION);
      cat.visible = true;
      const t = easeInOut(this.animT);
      const p = hopPosition(sill, outside, t);
      cat.position.set(p.x, p.y, p.z);
      cat.scale.setScalar(0.8 + 0.2 * t);
      // Gira en el aire para quedar mirando a la cámara
      cat.rotation.y = FACE_WINDOW + (FACE_CAMERA - FACE_WINDOW) * t;
      if (this.animT >= 1) this.finishExit();
    }
  }

  private onResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.stopLoop();
    } else {
      this.startLoop();
    }
  };

  dispose(): void {
    this.disposed = true;
    this.stopLoop();
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.input.dispose();
    this.world.dispose();
    this.cat.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
