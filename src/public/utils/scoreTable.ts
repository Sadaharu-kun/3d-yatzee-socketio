// ScoreTable.ts
export class ScoreTable {
    private container: HTMLElement;
    private playerHeaders: HTMLElement;
    private tbody: HTMLElement;
    private scores: Map<string, Map<string, number>> = new Map();

    constructor() {
        console.info('ScoreTable constructor()...');
        this.container = document.querySelector('#score-container') as HTMLElement;
        if (!this.container) {
            throw new Error('Score container not found');
        }

        this.playerHeaders = this.container.querySelector('#player-names') as HTMLElement;
        this.tbody = this.container.querySelector('tbody') as HTMLElement;

        if (!this.playerHeaders || !this.tbody) {
            throw new Error('Score table structure not found');
        }
    }

    //======( PUBLIC )======
    // Update the entire score table with new players
    public updatePlayers(players: string[]): void {
        console.info('updatePlayers(players)');
        // Save existing scores before clearing
        this.saveCurrentScores();

        // Update player headers
        this.updatePlayerHeaders(players);

        // Update all rows with new player columns
        this.updateScoreRows(players);
    }

    // Update a specific score for a player
    public updateScore(player: string, category: string, score: number): void {
        console.info('updateScore(player, category, score)');
        console.table({ player, category, score });

        // Store in memory
        if (!this.scores.has(player)) {
            this.scores.set(player, new Map());
        }
        this.scores.get(player)!.set(category, score);

        // Update the DOM
        const row = this.findCategoryRow(category);
        if (row) {
            const playerIndex = this.getPlayerIndex(player);
            if (playerIndex >= 0) {
                const cells = row.querySelectorAll('td');
                const targetCell = cells[playerIndex];
                if (targetCell) {
                    targetCell.textContent = score.toString();
                }
            }
        }
    }

    // Get scores for a player
    public getPlayerScores(player: string): Map<string, number> {
        console.info('getPlayerScores(player): Map<string, number>');
        return this.scores.get(player) || new Map();
    }

    public enableScoreSelection(onScoreSelected: (player: string, category: string) => void): void {
        const rows = this.tbody.querySelectorAll('tr');

        rows.forEach((row) => {
            const categoryCell = row.querySelector('td:first-child');
            if (!categoryCell) return;

            const category = categoryCell.textContent?.trim();
            if (!category) return;

            const cells = row.querySelectorAll('td');
            // Start from index 1 (skip the category name cell)
            for (let i = 1; i < cells.length; i++) {
                const cell = cells[i];
                if (!cell) continue; // Skippa cell om undefined

                const playerIndex = i - 1;
                const players = this.getCurrentPlayers();
                const player = players[playerIndex];
                if (!player) continue; // Skippa om spelare är undefined

                // Gör bara tomma celler klickbara # Visa med CSS och hover
                // Ta bort grön bakgrund och visa tydligare
                if (cell.textContent === '-' || cell.textContent === '') {
                    cell.classList.add('cursor-pointer', 'hover:bg-green-300', 'transition-colors');

                    cell.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.debug(`Score selected: ${player} - ${category}`);
                        onScoreSelected(player, category);
                    });
                }
            }
        });
    }

    //======( PRIVATE )======
    // Private methods
    // SAVE currentScores
    private saveCurrentScores(): void {
        console.info('saveCurrentScores()');
        const players = this.getCurrentPlayers();
        const rows = this.tbody.querySelectorAll('tr');

        players.forEach((player) => {
            if (!this.scores.has(player)) {
                this.scores.set(player, new Map());
            }
        });

        rows.forEach((row) => {
            const category = row.querySelector('td:first-child')?.textContent?.trim();
            if (!category) return;

            players.forEach((player, index) => {
                const scoreCell = row.querySelector(`td:nth-child(${index + 2})`);
                if (scoreCell && scoreCell.textContent !== '-') {
                    const score = parseInt(scoreCell.textContent) || 0;
                    this.scores.get(player)!.set(category, score);
                }
            });
        });
    }

    // UPDATE: player, score
    private updatePlayerHeaders(players: string[]): void {
        console.info('updatePlayerHeaders(players)');
        // Keep the first 3 headers (Övre Sektion, Räkna Poäng, Räkna Poäng)
        const allHeaders = Array.from(this.playerHeaders.querySelectorAll('th'));
        const fixedHeaders = allHeaders.slice(0, 3);

        // Remove existing player headers
        const playerHeaders = allHeaders.slice(3);
        playerHeaders.forEach((th) => th.remove());

        // Add new player headers
        players.forEach((player) => {
            const th = document.createElement('th');
            th.textContent = player;
            th.className = 'px-2 py-1 border border-gray-600';
            this.playerHeaders.appendChild(th);
        });
    }

    private updateScoreRows(players: string[]): void {
        console.info('updateScoreRows(players) -->', players);

        if (!this.tbody) {
            console.error('Table body not found');
            return;
        }

        const rows = this.tbody.querySelectorAll('tr');
        if (!rows || rows.length === 0) {
            console.warn('No rows found in score table');
            return;
        }

        rows.forEach((row) => {
            // Get the first cell (category name) safely
            const firstCell = row.querySelector('td:first-child');
            if (!firstCell) return;

            const category = firstCell.textContent?.trim();
            if (!category) return;

            // Keep only the first cell (category name)
            const cells = Array.from(row.querySelectorAll('td'));

            // Remove all cells except the first one
            for (let i = cells.length - 1; i > 0; i--) {
                const cell = cells[i];
                if (cell && cell !== firstCell) {
                    cell.remove();
                }
            }

            // Add score cells for each player
            players.forEach((player) => {
                const td = document.createElement('td');
                const playerScores = this.scores.get(player);
                const score = playerScores?.get(category) ?? '-';
                td.textContent = score.toString();
                td.className = 'text-center px-2 py-1 border border-gray-600';
                row.appendChild(td);
            });
        });
    }

    // FIND categoryRow
    private findCategoryRow(category: string): HTMLElement | null {
        const rows = this.tbody.querySelectorAll('tr');
        for (const row of rows) {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell?.textContent?.trim() === category) {
                return row as HTMLElement;
            }
        }
        return null;
    }

    // GETTERS: currentPlayers, playerIndex
    private getCurrentPlayers(): string[] {
        // Hämta alla headers efter de befintliga 3 startvärdena
        const headers = Array.from(this.playerHeaders.querySelectorAll('th'));
        return headers.slice(3).map((th) => th.textContent || '');
    }

    private getPlayerIndex(player: string): number {
        const headers = Array.from(this.playerHeaders.querySelectorAll('th'));
        return headers.findIndex((th) => th.textContent === player) - 3;
    }
}
