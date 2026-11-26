import * as THREE from 'three';

export interface InputCallbacks {
  /** Se tocó/clickeó una buhardilla. */
  onWindowTap?: (sectionId: string) => void;
  /** Se apretó la tecla de acción (E o Enter fuera de un botón). */
  onAction?: () => void;
  /**
   * Corrige el punto tocado a un lugar donde el gato pueda pararse
   * (si no, se quedaría caminando en el lugar contra una baranda).
   */
  clampTarget?: (x: number, z: number) => { x: number; z: number };
}

const MOVE_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

/**
 * Controla entrada por teclado (WASD / Flechas), toque/clic sobre los tejados
 * y toque/clic sobre las ventanas.
 */
export class InputController {
  private keys = new Set<string>();
  private targetPoint: THREE.Vector3 | null = null;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private domElement: HTMLElement;
  private camera: THREE.Camera;
  private walkableMeshes: THREE.Object3D[];
  private windowMeshes: THREE.Object3D[];
  private callbacks: InputCallbacks;

  constructor(
    domElement: HTMLElement,
    camera: THREE.Camera,
    walkableMeshes: THREE.Object3D[],
    windowMeshes: THREE.Object3D[] = [],
    callbacks: InputCallbacks = {}
  ) {
    this.domElement = domElement;
    this.camera = camera;
    this.walkableMeshes = walkableMeshes;
    this.windowMeshes = windowMeshes;
    this.callbacks = callbacks;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }
    // Con un panel abierto, el teclado es del panel
    if (document.body.classList.contains('has-modal')) return;

    const key = event.key.toLowerCase();
    if (MOVE_KEYS.includes(key)) {
      this.keys.add(key);
      // El teclado cancela el destino por toque
      this.targetPoint = null;
      return;
    }

    const onInteractive = target && (target.tagName === 'BUTTON' || target.tagName === 'A');
    if (!event.repeat && (key === 'e' || (key === 'enter' && !onInteractive))) {
      this.callbacks.onAction?.();
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.key.toLowerCase());
  };

  /** Si la pestaña pierde el foco no llega el keyup: soltamos todo. */
  private onBlur = (): void => {
    this.keys.clear();
  };

  private onPointerDown = (event: PointerEvent): void => {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    // Las ventanas tienen prioridad sobre el piso
    const windowHits = this.raycaster.intersectObjects(this.windowMeshes, false);
    const sectionId = windowHits[0]?.object.userData.sectionId as string | undefined;
    if (sectionId) {
      this.callbacks.onWindowTap?.(sectionId);
      return;
    }

    const hits = this.raycaster.intersectObjects(this.walkableMeshes, false);
    if (hits.length > 0) {
      const { x, z } = hits[0].point;
      this.setTarget(x, z);
    }
  };

  /** Manda al gato caminando solo hasta un punto del techo. */
  setTarget(x: number, z: number): void {
    const p = this.callbacks.clampTarget?.(x, z) ?? { x, z };
    this.targetPoint = new THREE.Vector3(p.x, 0, p.z);
  }

  hasTarget(): boolean {
    return this.targetPoint !== null;
  }

  clearTarget(): void {
    this.targetPoint = null;
  }

  isKeyboardMoving(): boolean {
    return this.keys.size > 0;
  }

  getMoveVector(currentPos: THREE.Vector3): { x: number; z: number } {
    let x = 0;
    let z = 0;

    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) z -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) z += 1;

    if (x !== 0 || z !== 0) {
      return { x, z };
    }

    if (this.targetPoint) {
      const dx = this.targetPoint.x - currentPos.x;
      const dz = this.targetPoint.z - currentPos.z;
      if (Math.hypot(dx, dz) < 0.25) {
        this.targetPoint = null;
        return { x: 0, z: 0 };
      }
      return { x: dx, z: dz };
    }

    return { x: 0, z: 0 };
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.keys.clear();
    this.targetPoint = null;
  }
}
