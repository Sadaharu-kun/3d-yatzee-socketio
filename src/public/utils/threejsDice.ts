// threejsDice.ts
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import RAPIER from '@dimforge/rapier3d-compat';

import type { UnwantedDice } from '../../types.ts';

// Individuella tärningar
export class Dice3D {
    private mesh: THREE.Mesh;
    private value: number = 1;
    private faceColor: string;
    private isAnimating: boolean = false;
    private targetRotation: THREE.Euler = new THREE.Euler(0, 0, 0);
    private currentRotationSpeed: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    constructor(scene: THREE.Scene, position: THREE.Vector3, size: number = 1, color: string = '#ffffff') {
        this.faceColor = color;

        const geometry = new RoundedBoxGeometry(size, size, size, 4, 0.1);
        // segments: 4, radius: 0.1
        /* const material = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            roughness: 0.3,
        }); */
        // ← new material per instance, not shared
        // this.mesh = new THREE.Mesh(geometry, material);
        // this.mesh = new THREE.Mesh(geometry, material.clone()); // ← .clone()
        //? this.mesh = new THREE.Mesh(geometry, []); // empty materials, set in setValue
        // this.mesh.position.copy(position); dont set initial position

        // Initialize with default materials
        this.mesh = new THREE.Mesh(geometry, [
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(3) }), // +x
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(4) }), // -x
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(1) }), // +y TOP
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(6) }), // -y bottom
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(2) }), // +z
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(5) }), // -z
        ]);

        scene.add(this.mesh);
        this.setValue(1); // init with 1 as face
    }

    setValue(value: number): void {
        console.groupCollapsed(`setValue(${value}) för tärning ${this.faceColor}`);

        this.value = Math.min(Math.max(value, 1), 6);

        // Standard dice layout - opposite faces sum to 7
        // Face arrangement (index order: +x, -x, +y, -y, +z, -z)
        this.mesh.material = [
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(3) }), // +x (right)
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(4) }), // -x (left)
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(this.value) }), // +y (top)
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(7 - this.value) }), // -y (bottom)
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(2) }), // +z (front)
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(5) }), // -z (back)
        ];

        console.debug(`🪳 Tärning fick värdet: ${this.value} (bottom: ${7 - this.value})`);
        console.groupEnd();
    }
    /* setValue(value: number): void {
        console.groupCollapsed(`setValue(${value}) för tärning ${this.faceColor}`);

        this.value = Math.min(Math.max(value, 1), 6);

        this.value = Math.min(Math.max(value, 1), 6);

        // Update materials based on value
        this.mesh.material = [
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(3) }), // +x
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(4) }), // -x
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(this.value) }), // +y TOP
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(7 - this.value) }), // -y bottom
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(2) }), // +z
            new THREE.MeshStandardMaterial({ map: this.createFaceTexture(5) }), // -z
        ];

        console.warn('SKA inte rotera mesh!');
        console.debug(`🪳 Tärning fick värdet: ${value}`);
        console.groupEnd();
    } */

    private createFaceTexture(value: number): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;

        // ctx.fillStyle = '#ffffff'; just white
        ctx.fillStyle = this.faceColor;
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

        console.warn('Snurrar på x-axel');
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
    private simulationActive: boolean = false;
    private resizeObserver: ResizeObserver | null = null;
    // Callback to GameRender
    private onDiceSettled: ((values: number[]) => void) | null = null;

    constructor(container: HTMLElement) {
        console.log('THREE constructor()...');
        if (!container) {
            throw new Error('Container element is required');
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e293b);

        // Initialize camera with placeholder aspect ratio, corrected in requestAnimationFrame
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        // Fixa sizing - set canvas to fill container
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        container.appendChild(this.renderer.domElement);

        // Make container relative for absolute positioning if needed
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';

        // Use ResizeObserver to watch container size changes
        this.resizeObserver = new ResizeObserver(() => {
            this.updateRendererSize(container);
        });
        this.resizeObserver.observe(container);
        // Initial size setup
        this.updateRendererSize(container);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(2, 5, 3);
        this.scene.add(directionalLight);

        // Create 5 dice in a row
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'];
        const spacing = 1.2;
        const startX = -2.4;

        for (let i = 0; i < 5; i++) {
            const position = new THREE.Vector3(startX + i * spacing, 0, 0);
            const die = new Dice3D(this.scene, position, 0.8, colors[i]);
            this.dice.push(die);
            console.debug('🪳 GÖM innan klickar på knappen "kasta tärningar"');
            die.getMesh().visible = false;
        }

        this.camera.position.set(0, 7, 6);
        this.camera.lookAt(0, 0, 0);

        this.initPhysics();
        this.animate();
        this.handleResize(container);
    }

    /* private async initPhysics(): Promise<void> {
        await RAPIER.init();
        this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

        // Left wall
        const wallL = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(-3.5, 2, 0));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.1, 10, 3), wallL);

        // Right wall
        const wallR = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(3.5, 2, 0));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.1, 10, 3), wallR);

        // Front wall (toward camera)
        const wallF = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 2, 2));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(5, 10, 0.1), wallF);

        // Back wall
        const wallB = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 2, -2));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(5, 10, 0.1), wallB);

        // Ground
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
    } */
    private async initPhysics(): Promise<void> {
        await RAPIER.init();
        this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

        // Create walls and ground as FIXED bodies
        // Left wall
        const wallL = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(-3.5, 2, 0));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.1, 10, 3), wallL);

        // Right wall
        const wallR = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(3.5, 2, 0));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.1, 10, 3), wallR);

        // Front wall (toward camera)
        const wallF = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 2, 2));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(5, 10, 0.1), wallF);

        // Back wall
        const wallB = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 2, -2));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(5, 10, 0.1), wallB);

        // Ground
        const groundBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0));
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.1, 10), groundBody);

        // Create physics bodies for each die as DYNAMIC
        for (let i = 0; i < 5; i++) {
            const spacing = 1.2;
            const startX = -2.4;
            const x = startX + i * spacing;

            // Create DYNAMIC bodies for dice
            const rigidBody = this.world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic() // <- Change from fixed to dynamic
                    .setTranslation(x, 6 + Math.random() * 3, 0)
                    .setRotation({ x: Math.random(), y: Math.random(), z: Math.random(), w: 1 })
                    .setLinearDamping(0.3)
                    .setAngularDamping(0.5),
            );

            this.world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.4, 0.4, 0.4).setRestitution(0.3).setFriction(0.8),
                rigidBody,
            );

            this.diceBodies.push(rigidBody);
        }
    }
    getTopFace(rotation: RAPIER.Rotation): number {
        console.groupCollapsed('🪳 getTopFace()');
        const q = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);

        // Define the 6 face directions in LOCAL space
        // The face values must match the material indices in setValue()
        const faces = [
            // Order must match the material array in setValue()
            { value: 3, axis: new THREE.Vector3(1, 0, 0) }, // +X face (right)
            { value: 4, axis: new THREE.Vector3(-1, 0, 0) }, // -X face (left)
            { value: 1, axis: new THREE.Vector3(0, 1, 0) }, // +Y face (top)
            { value: 6, axis: new THREE.Vector3(0, -1, 0) }, // -Y face (bottom)
            { value: 2, axis: new THREE.Vector3(0, 0, 1) }, // +Z face (front)
            { value: 5, axis: new THREE.Vector3(0, 0, -1) }, // -Z face (back)
        ];

        // Rotate each face normal by the dice's quaternion to get world direction
        // Find which face points most upward (highest Y value)
        let topValue = 1;
        let highestY = -Infinity;

        faces.forEach(({ value, axis }) => {
            const worldDirection = axis.clone().applyQuaternion(q);
            // Use a small epsilon to handle floating point precision
            if (worldDirection.y > highestY + 0.001) {
                highestY = worldDirection.y;
                topValue = value;
            }
        });

        console.debug(`🪳 top face value: ${topValue} (highest Y: ${highestY.toFixed(3)})`);
        console.groupEnd();
        return topValue;
    }
    /* getTopFace(rotation: RAPIER.Rotation): number {
        console.groupCollapsed('🪳 getTopFace()');
        const q = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);

        // Define the 6 face directions in LOCAL space
        // In local space, the cube's faces are at these directions
        const faces = [
            // The order of these vectors matters - they correspond to the material indices
            { value: 3, axis: new THREE.Vector3(1, 0, 0) }, // +X face (right)
            { value: 4, axis: new THREE.Vector3(-1, 0, 0) }, // -X face (left)
            { value: 1, axis: new THREE.Vector3(0, 1, 0) }, // +Y face (top)
            { value: 6, axis: new THREE.Vector3(0, -1, 0) }, // -Y face (bottom)
            { value: 2, axis: new THREE.Vector3(0, 0, 1) }, // +Z face (front)
            { value: 5, axis: new THREE.Vector3(0, 0, -1) }, // -Z face (back)
        ];

        // Rotate each face normal by the dice's quaternion to get world direction
        // Find which face points most upward (highest Y value)
        let topValue = 1;
        let highestY = -Infinity;

        faces.forEach(({ value, axis }) => {
            const worldDirection = axis.clone().applyQuaternion(q);
            if (worldDirection.y > highestY) {
                highestY = worldDirection.y;
                topValue = value;
            }
        });

        console.debug(`🪳 top face value: ${topValue} (highest Y: ${highestY})`);
        console.groupEnd();
        return topValue;
    } */

    updateDiceValues(unwantedDice?: UnwantedDice): void {
        console.group(`updateDiceValues() - Rullar tärning`);
        console.debug('🪳 unwantedDice:', unwantedDice);

        console.debug('🪳 nollställer state');
        this.settled = [false, false, false, false, false];
        this.diceValues = [0, 0, 0, 0, 0];

        this.diceBodies.forEach((body, i) => {
            // Set body type to dynamic
            body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);

            // If unwantedDice[i] is false or unwantedDice not provided, re-roll this die
            // const shouldReRoll = !unwantedDice || !unwantedDice[i]; # motsats
            // Kasta om när unwantedDice[i] är true
            const shouldReRoll = !unwantedDice || unwantedDice[i];

            if (shouldReRoll) {
                console.debug(`🪳 Kastar om tärning --> ${i}`);
                // Reset position with some random offset
                body.setTranslation(
                    {
                        x: -2.4 + i * 1.2 + (Math.random() - 0.5) * 0.5,
                        y: 6 + Math.random() * 3,
                        z: (Math.random() - 0.5) * 2,
                    },
                    true,
                );
                // Add random rotation
                body.setRotation({ x: Math.random(), y: Math.random(), z: Math.random(), w: 1 }, true);
                // Add random linear velocity
                body.setLinvel({ x: (Math.random() - 0.5) * 2, y: 0, z: 0 }, true);
                // Add random angular velocity for spinning
                body.setAngvel({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }, true);
            } else {
                console.debug(`🪳 Keeping die ${i} in place`);
                // Keep the die where it is - don't reset position or add forces
                // Set very low velocity to ensure it stays settled
                body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                body.setAngvel({ x: 0, y: 0, z: 0 }, true);
                // Mark as already settled to avoid re-triggering callback
                this.settled[i] = true;
                // Get current top face value
                const topFace = this.getTopFace(body.rotation());
                this.diceValues[i] = topFace;
            }
        });

        console.groupEnd();
    }
    /* updateDiceValues(_values: number[]): void {
        console.group(`updateDiceValues() - Rullar tärning`);

        console.debug('🪳 nollställer state');
        this.settled = [false, false, false, false, false];
        this.diceValues = [0, 0, 0, 0, 0];
        // this.isRolling = true
        this.diceBodies.forEach((body, i) => {
            body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
            body.setTranslation(
                {
                    x: -2.4 + i * 1.2 + (Math.random() - 0.5) * 0.5,
                    y: 6 + Math.random() * 3,
                    z: (Math.random() - 0.5) * 2,
                },
                true,
            );
            body.setRotation({ x: Math.random(), y: Math.random(), z: Math.random(), w: 1 }, true);
            body.setLinvel({ x: (Math.random() - 0.5) * 2, y: 0, z: 0 }, true);
            body.setAngvel({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }, true);
        });

        console.groupEnd();
    } */

    setOnDiceSettled(callback: (values: number[]) => void) {
        console.warn('🪳 setOnDiceSettled(callback)');
        this.onDiceSettled = callback;
    }

    private animate(): void {
        // console.group(`private animate()`); räknar oändligt med try finally
        requestAnimationFrame(() => this.animate());

        if (this.simulationActive && this.world) {
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

                if (
                    !this.settled[i] &&
                    body.bodyType() === RAPIER.RigidBodyType.Dynamic &&
                    speed < 0.1 &&
                    angSpeed < 0.1
                ) {
                    this.settled[i] = true;

                    const topFace = this.getTopFace(body.rotation());
                    //! this.dice[i]?.setValue(topFace);
                    this.diceValues[i] = topFace;

                    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'];
                    console.log(
                        `%c Die index:${i} color:${colors[i]} → face:${topFace} | all values so far: [${this.diceValues}]`,
                        `color: ${colors[i]}; font-weight: bold`,
                    );

                    if (this.settled.every(Boolean)) {
                        console.log('🎲 Final values:', this.diceValues);
                        this.onDiceSettled?.(this.diceValues);
                    }
                }
            });
        }

        // Visar statisk bild innan första tärningskast
        this.renderer.render(this.scene, this.camera);
    }

    private updateRendererSize(container: HTMLElement): void {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width > 0 && height > 0) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }

    private handleResize(container: HTMLElement): void {
        window.addEventListener('resize', () => {
            this.updateRendererSize(container);
        });
    }
    /*   private handleResize(container: HTMLElement): void {
        const resize = () => {
            // const width = container.offsetWidth;
            // const height = container.offsetHeight;
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (width && height) {
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }
        };

        window.addEventListener('resize', resize);
        console.warn('Resizing 3D simulation');
        resize(); // call direkt för att sätta startstorlek
    } */

    // Clean up observer when done
    public dispose(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
    public startSimulation(): void {
        console.info('startSimulation()');
        this.simulationActive = true;
        console.debug('🪳 Visar tärningar igen');
        this.dice.forEach((die) => (die.getMesh().visible = true));
    }
}
