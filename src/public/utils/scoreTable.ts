import { CategoryMap } from '../../types.ts';
import type { DiceCombo } from '../../types.ts';

// ScoreTable.ts
export class ScoreTable {
    private container: HTMLElement;
    private playerHeaders: HTMLElement;
    private tbody: HTMLElement;
    private scores: Map<string, Map<string, number>> = new Map();
    private tbodyUpper: HTMLElement;
    private tbodyLower: HTMLElement;
    private playerHeadersLower: HTMLElement;

    private onScoreSelected: ((player: string, category: string) => void) | null = null;

    constructor() {
        console.info('ScoreTable constructor()...');
        this.container = document.querySelector('#score-container') as HTMLElement;
        this.tbody = this.container.querySelector('tbody') as HTMLElement;
        this.tbodyUpper = this.container.querySelector('#tbody-upper') as HTMLElement;
        this.tbodyLower = this.container.querySelector('#tbody-lower') as HTMLElement;
        this.playerHeaders = this.container.querySelector('#player-names-upper') as HTMLElement;
        this.playerHeadersLower = this.container.querySelector('#player-names-lower') as HTMLElement;

        const { container, tbody, tbodyUpper, tbodyLower, playerHeaders, playerHeadersLower } = this;

        if ([container, tbody, tbodyUpper, tbodyLower, playerHeaders, playerHeadersLower].some((el) => !el)) {
            throw new Error('Saknar scoreTable element');
        }

        console.debug('Validerar table struktur');
        this.validateTableCategories();
    }

    //======( PUBLIC )======

    // Calculate and update totals for all players
    public updateAllTotals(): void {
        const players = this.getCurrentPlayers();

        players.forEach((player) => {
            const playerScores = this.scores.get(player);
            if (!playerScores) return;

            // Calculate upper section total (Ettor through Sexor)
            const upperCategories = ['Ettor', 'Tvåor', 'Treor', 'Fyror', 'Femmor', 'Sexor'];
            let upperTotal = 0;
            upperCategories.forEach((cat) => {
                upperTotal += playerScores.get(cat) || 0;
            });

            // Update upper section total row
            this.updateTotalRow('Totalt', upperTotal, player);

            // Calculate and update bonus (if upper total >= 63)
            const bonus = upperTotal >= 63 ? 35 : 0;
            this.updateTotalRow('Bonus', bonus, player);

            // Calculate upper result (upper total + bonus)
            const upperResult = upperTotal + bonus;
            this.updateTotalRow('Resultat', upperResult, player);

            // Calculate lower section total
            const lowerCategories = [
                '3 kombo',
                '4 kombo',
                'Full House',
                'Small Straight',
                'Large Straight',
                'Yatzee',
                'Chance',
            ];
            let lowerTotal = 0;
            lowerCategories.forEach((cat) => {
                lowerTotal += playerScores.get(cat) || 0;
            });

            // Add Yatzee bonus (if multiple Yatzees)
            const yatzeeCount = playerScores.get('Yatzee') ? 1 : 0; // Track actual count
            const yatzeeBonus = (yatzeeCount - 1) * 100;
            lowerTotal += yatzeeBonus;

            // Update lower section total row
            this.updateTotalRow('Totalt Nedre Sektion', lowerTotal, player);

            // Update overall total
            const grandTotal = upperResult + lowerTotal;
            this.updateTotalRow('Slutresultat', grandTotal, player);
        });
    }
    // Update a specific total row for a player
    private updateTotalRow(rowName: string, value: number, player: string): void {
        // Find the row (could be in upper or lower tbody)
        let targetRow = this.findCategoryRow(rowName);
        if (!targetRow && rowName === 'Totalt Nedre Sektion') {
            targetRow = this.findCategoryRow('Totalt Nedre Sektion');
        }
        if (!targetRow && rowName === 'Slutresultat') {
            targetRow = this.findCategoryRow('Slutresultat');
        }
        if (!targetRow) return;

        const playerIndex = this.getPlayerIndex(player);
        if (playerIndex < 0) return;

        const cells = targetRow.querySelectorAll('td');
        const targetCell = cells[playerIndex + 2]; // +2 to skip info columns
        if (targetCell) {
            targetCell.textContent = value.toString();
        }
    }

    // Update the entire score table with new players
    public updatePlayers(players: string[]): void {
        this.saveCurrentScores();
        this.updatePlayerHeaders(players);
        this.updateScoreRows(players, this.onScoreSelected ?? undefined); // re-attach after rebuild
    }

    // Update a specific score for a player
    public updateScore(player: string, category: string, score: number): void {
        if (!this.scores.has(player)) {
            this.scores.set(player, new Map());
        }
        this.scores.get(player)!.set(category, score);

        const row = this.findCategoryRow(category);
        if (!row) return console.error('Row not found for category:', category);

        const playerIndex = this.getPlayerIndex(player);
        if (playerIndex < 0) return console.error('Player not found:', player);

        // Skip th + 2 fixed td columns, then find player column
        const allTds = row.querySelectorAll('td');
        const targetCell = allTds[playerIndex + 2]; // +2 to skip info columns
        if (targetCell) {
            targetCell.textContent = score.toString();
        }
    }

    // Get scores for a player
    public getPlayerScores(player: string): Map<string, number> {
        console.info('getPlayerScores(player): Map<string, number>');
        return this.scores.get(player) || new Map();
    }

    public enableScoreSelection(onScoreSelected: (player: string, category: string) => void): void {
        this.onScoreSelected = onScoreSelected; // store it
        this.updateScoreRows(this.getCurrentPlayers(), onScoreSelected); // attach immediately
    }

    //======( PRIVATE )======
    // Private methods
    private validateTableCategories(): void {
        console.info('validateTableCategories()');
        const expectedCategories = Object.keys(CategoryMap);
        const ignoredRows = [
            'Totalt',
            'Bonus',
            'Resultat',
            'Totalt Övre Sektion',
            'Totalt Nedre Sektion',
            'Slutresultat',
            'Yatzee Bonus',
        ];

        [this.tbodyUpper, this.tbodyLower].forEach((tbody) => {
            tbody.querySelectorAll('tr').forEach((row) => {
                const cell = row.querySelector('th:first-child, td:first-child');
                const name = cell?.textContent?.trim();
                if (name && !ignoredRows.includes(name) && !expectedCategories.includes(name)) {
                    console.warn(`HTML category "${name}" has no match in CategoryMap`);
                }
            });
        });
    }

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
            const category = row.querySelector('th:first-child, td:first-child')?.textContent?.trim();
            if (!category) return;

            players.forEach((player, index) => {
                const scoreCell = row.querySelector(`td:nth-child(${index + 4})`);
                if (scoreCell && scoreCell.textContent !== '-') {
                    const score = parseInt(scoreCell.textContent) || 0;
                    this.scores.get(player)!.set(category, score);
                }
            });
        });
    }

    // UPDATE: player, score
    private updateScoreRows(players: string[], onScoreSelected?: (player: string, category: string) => void): void {
        const ignoredRows = [
            'Yatzee Bonus', // Handled separately
        ];

        [this.tbodyUpper, this.tbodyLower].forEach((tbody) => {
            tbody.querySelectorAll('tr').forEach((row) => {
                const firstCell = row.querySelector('th:first-child, td:first-child');
                if (!firstCell) return;
                const category = firstCell.textContent?.trim();
                if (!category) return;

                // Remove only player cells, keep first 2 td's (info columns)
                Array.from(row.querySelectorAll('td'))
                    .slice(2)
                    .forEach((cell) => cell.remove());

                players.forEach((player) => {
                    const td = document.createElement('td');
                    let score = this.scores.get(player)?.get(category);

                    // Calculate totals on the fly
                    if (
                        category === 'Totalt' ||
                        category === 'Resultat' ||
                        category === 'Totalt Nedre Sektion' ||
                        category === 'Slutresultat'
                    ) {
                        score = undefined; // Will be calculated later
                    }

                    td.textContent = score?.toString() ?? '-';
                    td.className = 'text-center px-2 py-1 border border-gray-600';

                    const isScoreable = !ignoredRows.includes(category);
                    const isAlreadyScored = this.scores.get(player)?.has(category);

                    if (onScoreSelected && isScoreable && !isAlreadyScored) {
                        td.classList.add('cursor-pointer', 'hover:bg-green-300', 'transition-colors');
                        td.addEventListener('click', () => {
                            onScoreSelected(player, category);
                        });
                    }

                    row.appendChild(td);
                });
            });
        });

        // Recalculate all totals after rebuilding rows
        this.updateAllTotals();
    }
    /*  private updateScoreRows(players: string[], onScoreSelected?: (player: string, category: string) => void): void {
        const ignoredRows = [
            'Totalt',
            'Bonus',
            'Resultat',
            'Totalt Övre Sektion',
            'Totalt Nedre Sektion',
            'Slutresultat',
            'Yatzee Bonus',
        ];

        [this.tbodyUpper, this.tbodyLower].forEach((tbody) => {
            tbody.querySelectorAll('tr').forEach((row) => {
                const firstCell = row.querySelector('th:first-child, td:first-child');
                if (!firstCell) return;
                const category = firstCell.textContent?.trim();
                if (!category) return;

                // Remove only player cells, keep first 2 td's (info columns)
                Array.from(row.querySelectorAll('td'))
                    .slice(2)
                    .forEach((cell) => cell.remove());

                players.forEach((player) => {
                    const td = document.createElement('td');
                    const score = this.scores.get(player)?.get(category) ?? '-';
                    td.textContent = score.toString();
                    td.className = 'text-center px-2 py-1 border border-gray-600';

                    const isScoreable = !ignoredRows.includes(category);
                    const isAlreadyScored = this.scores.get(player)?.has(category);

                    if (onScoreSelected && isScoreable && !isAlreadyScored) {
                        td.classList.add('cursor-pointer', 'hover:bg-green-300', 'transition-colors');
                        td.addEventListener('click', () => {
                            onScoreSelected(player, category);
                        });
                    }

                    row.appendChild(td);
                });
            });
        });
    } */

    private updatePlayerHeaders(players: string[]): void {
        [this.playerHeaders, this.playerHeadersLower].forEach((headerRow) => {
            // Remove existing player headers beyond the first fixed ones
            const allHeaders = Array.from(headerRow.querySelectorAll('th, td'));
            allHeaders.slice(3).forEach((th) => th.remove());

            players.forEach((player) => {
                const th = document.createElement('th');
                th.textContent = player;
                th.className = 'px-2 py-1 border border-gray-600';
                headerRow.appendChild(th);
            });
        });
    }

    // FIND categoryRow
    private findCategoryRow(category: string): HTMLElement | null {
        const tbodies = [this.tbodyUpper, this.tbodyLower];
        for (const tbody of tbodies) {
            const rows = tbody.querySelectorAll('tr');
            for (const row of rows) {
                const firstCell = row.querySelector('th:first-child, td:first-child');
                if (firstCell?.textContent?.trim() === category) {
                    return row as HTMLElement;
                }
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

    public highlightValidCategories(combo: DiceCombo): void {
        // Clear previous highlights
        [this.tbodyUpper, this.tbodyLower].forEach((tbody) => {
            tbody.querySelectorAll('td.combo-highlight').forEach((cell) => {
                cell.classList.remove('combo-highlight', 'bg-yellow-300', 'animate-pulse');
            });
        });

        // Find matching category names for this combo
        const validCategories = Object.entries(CategoryMap)
            .filter(([_, v]) => v === combo)
            .map(([k]) => k);

        // For upper section combos, also highlight the number categories
        const upperCombos: DiceCombo[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
        if (!upperCombos.includes(combo)) {
            // For lower section combos, only highlight the exact match
        } else {
            // For upper section, highlight all unscored number rows
            const upperCategories = ['Ettor', 'Tvåor', 'Treor', 'Fyror', 'Femmor', 'Sexor'];
            upperCategories.forEach((cat) => validCategories.push(cat));
        }

        validCategories.forEach((category) => {
            const row = this.findCategoryRow(category);
            if (!row) return;

            const players = this.getCurrentPlayers();
            players.forEach((player, i) => {
                const cells = row.querySelectorAll('td');
                const cell = cells[i + 2]; // skip 2 info columns
                if (cell && !this.scores.get(player)?.has(category)) {
                    cell.classList.add('combo-highlight', 'bg-yellow-300', 'animate-pulse');
                }
            });
        });
    }

    // Highlightar scoreTable med CSS från getValidCategories(combo)
    // In ScoreTable
    public highlightCategories(validCombos: string[] | null): void {
        [this.tbodyUpper, this.tbodyLower].forEach((tbody) => {
            tbody.querySelectorAll('.combo-highlight').forEach((cell) => {
                cell.classList.remove('combo-highlight', 'bg-yellow-300', 'animate-pulse');
            });
        });
        if (!validCombos) return;

        const players = this.getCurrentPlayers();
        validCombos.forEach((category) => {
            const row = this.findCategoryRow(category);
            if (!row) return;
            players.forEach((player, i) => {
                const cells = row.querySelectorAll('td');
                const cell = cells[i + 2];
                if (cell && !this.scores.get(player)?.has(category)) {
                    cell.classList.add('combo-highlight', 'bg-yellow-300', 'animate-pulse');
                }
            });
        });
    }
}
