import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import RAPIER from '@dimforge/rapier3d-compat';

// [ ] 1. Kasta tärningara (6-1)
// [ ] 2. Ska landa beroende på:
//      this.state.dice = [0, 0, 0, 0, 0];  // med olika nummer
//      private keptDice: KeptDice = [false, false, false, false, false];

/* const params = {
    segments: 50,
    edgeRadius: 0.07,
};

let boxGeometry = new THREE.BoxGeometry(1, 1, 1, params.segments, params.segments, params.segments);
 */

/* export class ThreeScene {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;

    constructor(container: HTMLElement) {
        console.log('THREE constructor()...');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;
        this.animate();
    }

    private animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}
 */
// threejsDice.ts

// for individual dice
export class Dice3D {
    private mesh: THREE.Mesh;
    private value: number = 1;

    private isAnimating: boolean = false;
    private targetRotation: THREE.Euler = new THREE.Euler(0, 0, 0);
    private currentRotationSpeed: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    constructor(scene: THREE.Scene, position: THREE.Vector3, size: number = 1) {
        const geometry = new RoundedBoxGeometry(size, size, size, 4, 0.1);
        // segments: 4, radius: 0.1
        /* const material = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            roughness: 0.3,
        }); */
        // ← new material per instance, not shared
        // this.mesh = new THREE.Mesh(geometry, material);
        // this.mesh = new THREE.Mesh(geometry, material.clone()); // ← .clone()
        this.mesh = new THREE.Mesh(geometry, []); // empty materials, set in setValue
        // this.mesh.position.copy(position); dont set initial position
        scene.add(this.mesh);
        this.setValue(1); // init with 1 as face
    }
    /* constructor(scene: THREE.Scene, position: THREE.Vector3, size: number = 1) {
        const geometry = new THREE.Roun(size, size, size);
        const material = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.3 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    } */
    setValue(value: number): void {
        this.value = Math.min(Math.max(value, 1), 6);
        this.mesh.material = [
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(3) }), // +x right
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(4) }), // -x left
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(this.value) }), // +y top ← show value on top
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(7 - this.value) }), // -y bottom (opposite = 7 - value)
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(2) }), // +z front
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(5) }), // -z back
        ];

        // Reset rotation so top face is visible
        this.mesh.rotation.set(0, 0, 0);
    }

    private createFaceTexture(value: number): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);

        const dotPositions: Record<number, [number, number][]> = {
            1: [[256, 256]],
            2: [
                [128, 128],
                [384, 384],
            ],
            3: [
                [128, 128],
                [256, 256],
                [384, 384],
            ],
            4: [
                [128, 128],
                [384, 128],
                [128, 384],
                [384, 384],
            ],
            5: [
                [128, 128],
                [384, 128],
                [256, 256],
                [128, 384],
                [384, 384],
            ],
            6: [
                [128, 128],
                [384, 128],
                [128, 256],
                [384, 256],
                [128, 384],
                [384, 384],
            ],
        };

        ctx.fillStyle = '#1a1a1a';
        const positions = dotPositions[value] ?? [];
        positions.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 40, 0, Math.PI * 2);
            ctx.fill();
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 16;
        return texture;
    }

    // Face rotations that show the correct face on top (+y)
    private static readonly faceRotations: Record<number, [number, number, number]> = {
        1: [0, 0, 0], // 1 on top
        2: [0, 0, -Math.PI / 2], // 2 on top
        3: [Math.PI / 2, 0, 0], // 3 on top
        4: [-Math.PI / 2, 0, 0], // 4 on top
        5: [0, 0, Math.PI / 2], // 5 on top
        6: [Math.PI, 0, 0], // 6 on top
    };

    animateTo(value: number): void {
        this.value = Math.min(Math.max(value, 1), 6);
        this.isAnimating = true;

        this.currentRotationSpeed.set(
            0,
            (Math.random() - 0.5) * 1.0, // only spin on Y axis
            0,
        );

        // Target is always flat — only Y rotation varies (doesn't affect which face is on top)
        this.targetRotation.set(0, Math.random() * Math.PI * 2, 0);

        setTimeout(() => {
            this.isAnimating = false;
            this.updateMaterials();
        }, 800);
    }
    /* animateTo(value: number): void {
        this.value = Math.min(Math.max(value, 1), 6);
        this.isAnimating = true;

        // Start with random fast spinning
        this.currentRotationSpeed.set(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
        );

        const target = Dice3D.faceRotations[this.value] ?? [0, 0, 0];
        this.targetRotation.set(...target);

        // After spin duration, ease to final rotation
        setTimeout(() => {
            this.isAnimating = false;
            this.updateMaterials();
        }, 800);
    } */
    update(): void {
        if (this.isAnimating) {
            // Fast random spin
            this.mesh.rotation.x += this.currentRotationSpeed.x;
            this.mesh.rotation.y += this.currentRotationSpeed.y;
            this.mesh.rotation.z += this.currentRotationSpeed.z;
            // Slow down
            this.currentRotationSpeed.multiplyScalar(0.95);
        } else {
            // Ease to target rotation
            this.mesh.rotation.x += (this.targetRotation.x - this.mesh.rotation.x) * 0.1;
            this.mesh.rotation.y += (this.targetRotation.y - this.mesh.rotation.y) * 0.1;
            this.mesh.rotation.z += (this.targetRotation.z - this.mesh.rotation.z) * 0.1;
        }
    }

    private updateMaterials(): void {
        this.mesh.material = [
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(3) }), // +x
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(4) }), // -x
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(this.value) }), // +y TOP ← always correct
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(7 - this.value) }), // -y bottom
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(2) }), // +z
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(5) }), // -z
        ];
    }

    getMesh(): THREE.Mesh {
        return this.mesh;
    }
}

// Handle multiple dice
export class ThreeScene {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private dice: Dice3D[] = [];
    private diceValues: number[] = [1, 1, 1, 1, 1];
    private world!: RAPIER.World;
    private diceBodies: RAPIER.RigidBody[] = [];
    private pendingValues: number[] = [];
    private settled: boolean[] = [false, false, false, false, false];

    constructor(container: HTMLElement) {
        console.log('THREE constructor()...');

        if (!container) {
            throw new Error('Container element is required');
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e293b);

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(width, height);
        container.appendChild(this.renderer.domElement);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(2, 5, 3);
        this.scene.add(directionalLight);

        // Create 5 dice in a row
        const spacing = 1.2;
        const startX = -2.4;
        for (let i = 0; i < 5; i++) {
            const position = new THREE.Vector3(startX + i * spacing, 0, 0);
            const die = new Dice3D(this.scene, position, 0.8);
            this.dice.push(die);
        }

        // diagonal, relation around läng side cylinder, 180deg
        this.camera.position.set(0.8, 4, 1); // diag(r),

        // (lr, xy, view(xy))
        this.camera.lookAt(0, 0, 0);

        this.initPhysics();
        this.animate();
        this.handleResize(container);
    }

    private async initPhysics(): Promise<void> {
        await RAPIER.init();
        // In initPhysics(), add side walls
        this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
        const wallL = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(-3.5, 2, 0));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.1, 5, 2), wallL);

        const wallR = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(3.5, 2, 0));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.1, 5, 2), wallR);

        // Ground plane
        const groundBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.1, 10), groundBody);

        // Create physics bodies for each die
        for (let i = 0; i < 5; i++) {
            const spacing = 1.2;
            const startX = -2.4;
            const x = startX + i * spacing;

            const rigidBody = this.world.createRigidBody(
                // RAPIER.RigidBodyDesc.dynamic()
                RAPIER.RigidBodyDesc.fixed()
                    .setTranslation(x, 6 + Math.random() * 3, 0) // drop from above
                    .setRotation({ x: Math.random(), y: Math.random(), z: Math.random(), w: 1 }) // random rotation
                    .setLinearDamping(0.3)
                    .setAngularDamping(0.5),
            );

            this.world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.4, 0.4, 0.4)
                    .setRestitution(0.3) // bounciness
                    .setFriction(0.8),
                rigidBody,
            );

            this.diceBodies.push(rigidBody);
        }
    }

    getTopFace(rotation: RAPIER.Rotation): number {
        console.debug('🪳 getTopFace()');
        const q = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);

        // The 6 face normals in local space
        const faces = [
            { value: 1, axis: new THREE.Vector3(0, 1, 0) }, // +Y top
            { value: 6, axis: new THREE.Vector3(0, -1, 0) }, // -Y bottom
            { value: 2, axis: new THREE.Vector3(1, 0, 0) }, // +X right
            { value: 5, axis: new THREE.Vector3(-1, 0, 0) }, // -X left
            { value: 3, axis: new THREE.Vector3(0, 0, 1) }, // +Z front
            { value: 4, axis: new THREE.Vector3(0, 0, -1) }, // -Z back
        ];

        // Rotate each face normal by the dice's quaternion, find which points most upward
        let topFace = 1;
        let maxY = -Infinity;

        faces.forEach(({ value, axis }) => {
            const worldAxis = axis.clone().applyQuaternion(q);
            if (worldAxis.y > maxY) {
                maxY = worldAxis.y;
                topFace = value;
            }
        });

        console.debug('🪳 topFace:', topFace);
        return topFace;
    }

    updateDiceValues(values: number[]): void {
        this.pendingValues = [...values];
        this.settled = [false, false, false, false, false];

        this.diceBodies.forEach((body, i) => {
            const spacing = 1.2;
            const x = -2.4 + i * spacing;

            body.setBodyType(RAPIER.RigidBodyType.Dynamic, true); // ← wake up on roll
            // In updateDiceValues() and initPhysics(), add Z offset
            body.setTranslation(
                {
                    x: x + (Math.random() - 0.5) * 0.5, // small X jitter
                    y: 6 + Math.random() * 3,
                    z: (Math.random() - 0.5) * 2, // ← spread in Z
                },
                true,
            )
            body.setRotation({ x: Math.random(), y: Math.random(), z: Math.random(), w: 1 }, true);
            body.setLinvel({ x: (Math.random() - 0.5) * 2, y: 0, z: 0 }, true);
            body.setAngvel({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }, true);
        });
    }
    /* updateDiceValues(values: number[]): void {
        this.pendingValues = [...values];
        this.settled = [false, false, false, false, false];

        // Reset dice to above and drop
        this.diceBodies.forEach((body, i) => {
            const spacing = 1.2;
            const x = -2.4 + i * spacing;
            body.setTranslation({ x, y: 6 + Math.random() * 3, z: 0 }, true);
            body.setRotation({ x: Math.random(), y: Math.random(), z: Math.random(), w: 1 }, true);
            body.setLinvel({ x: (Math.random() - 0.5) * 2, y: 0, z: 0 }, true);
            body.setAngvel({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }, true);
        });
    } */

    private animate(): void {
        requestAnimationFrame(() => this.animate());

        if (this.world) {
            this.world.step();

            this.diceBodies.forEach((body, i) => {
                const pos = body.translation();
                const rot = body.rotation();

                // Sync Three.js mesh with physics body
                this.dice[i]?.getMesh().position.set(pos.x, pos.y, pos.z);
                this.dice[i]?.getMesh().quaternion.set(rot.x, rot.y, rot.z, rot.w);

                // Check if settled (low velocity)
                const vel = body.linvel();
                const angVel = body.angvel();
                const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
                const angSpeed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2);

                if (!this.settled[i] && speed < 0.1 && angSpeed < 0.1) {
                    this.settled[i] = true;
                    const topFace = this.getTopFace(body.rotation()); // ← read from physics
                    this.dice[i]?.setValue(topFace);
                    this.diceValues[i] = topFace; // store result
                }
                /* if (!this.settled[i] && speed < 0.1 && angSpeed < 0.1 && this.pendingValues.length > 0) {
                    this.settled[i] = true;
                    // Snap to correct face value once settled
                    const val = this.pendingValues[i];
                    if (val !== undefined) this.dice[i]?.setValue(val);
                } */
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    /*  updateDiceValues(values: number[]): void {
        const length = Math.min(this.dice.length, values.length);
        for (let i = 0; i < length; i++) {
            const val = values[i];
            if (val !== undefined && val >= 1 && val <= 6) {
                this.dice[i]?.animateTo(val); // ← animateTo instead of setValue
            }
        }
    } */

    /* updateDiceValues(values: number[]): void {
        console.debug('🪳 updateDiceValues(values) -->', values);
        if (!values || values.length === 0) return;

        this.diceValues = [...values];
        console.debug('🪳 this.diceValues:', this.diceValues);

        // ✅ Safe iteration
        const length = Math.min(this.dice.length, values.length);
        for (let i = 0; i < length; i++) {
            const val = values[i];
            if (val !== undefined && val >= 1 && val <= 6) {
                this.dice[i]?.setValue(val);
            }
        }
    } */

    /* private animate(): void {
        requestAnimationFrame(() => this.animate());
        this.dice.forEach((die) => die.update()); // ← call update every frame
        this.renderer.render(this.scene, this.camera);
    } */

    private handleResize(container: HTMLElement): void {
        window.addEventListener('resize', () => {
            const width = container.clientWidth;
            const height = container.clientHeight;

            if (width && height) {
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }
        });
    }
}
