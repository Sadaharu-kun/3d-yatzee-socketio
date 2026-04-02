# Starta Projekt

1. npm install
2. npm run dev
    - Startar server med Vite

# Run Server

npm run dev
npm run start

---

- npx --watch server.ts

# Vite for immediate TailwindCSS

dev:vite: vite
Remove public serving from compiled first
Vite funkar inte med CommonJS

# Compile CSS

Add public to use compiled from output.
"scripts": {
"dev": "concurrently \"npm run dev:css\" \"npm run dev:server\"",
"dev:server": "tsx watch src/server.ts",
"dev:css": "tailwindcss -i ./src/input.css -o ./src/public/css/output.css --watch",
"start": "tsx watch server.ts",
"test": "echo \"Error: no test specified\" && exit 1"
},

# Lägg till i egen kodquiz som exempel

newDiceArray.forEach((dieVal: number) => frequencyArr[dieVal - 1]++);
// frequencyArr[dieVal - 1] = frequencyArr[dieval - 1] + 1

newDiceArray.forEach((dieVal: number) => {
const index = dieVal - 1;
if (index >= 0 && index < frequencyArr.length) {
frequencyArr[index] = (frequencyArr[index] ?? 0) + 1;
}
});
