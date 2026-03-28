import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src/public', // ← tell Vite where index.html is
    optimizeDeps: {
        include: ['three'], // för vite att hantera ThreeJS
    },
    resove: {
        alias: {
            'node:fs': false,
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/socket.io': { target: 'http://localhost:3000', ws: true },
        },
    },
    build: {
        outDir: '../../public',
        emptyOutDir: true,
    },
});
