import * as THREE from 'three';
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

export class ThreeScene {
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
