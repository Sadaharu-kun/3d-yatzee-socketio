// gameRenderer.ts
import type { UnwantedDice, GameState, DiceCombo, FinalGameState, FinalGameResults } from '../../types.ts';
import { YatzeeGame } from './yatzeeGame.ts';
import { ThreeScene } from '../utils/threejsDice.ts';

import { CategoryMap } from '../../types.ts';

// Rendera yatzee spelet i DOM
export class GameRender {
    private yatzeeGame: YatzeeGame;
    private container: HTMLElement;
    private threeScene: ThreeScene | null = null;
    private unwantedDice: UnwantedDice = [false, false, false, false, false];
    private gameRoundElement: HTMLElement | null = null;
    private playerListElement: HTMLElement | null = null;
    private playerCountElement: HTMLElement | null = null;
    private threeContainer: HTMLElement | null = null;
    private diceComboAlert: HTMLElement | null = null;

    private onScoreUpdate: ((player: string, category: string, score: number, round: number) => void) | null = null;
    private onFinalDice: ((gameState: GameState) => void) | null = null; // Acceptera GameState
    private onGameComplete: ((finalResults: FinalGameResults) => void) | null = null; // Acceptera GameState
    private onComboSuggestion: ((validCategories: string[]) => void) | null = null; // Highlighta table celler

    // Flagga
    private roundSubmitted: boolean = false; // Se om har skickat individuell runda till servern
    private hasRolledThisRound: boolean = false; // För att låsa tabell cellerna

    constructor(container: HTMLElement, player: string) {
        console.debug('🪳 GameRender constructor()...');

        this.yatzeeGame = new YatzeeGame(player);
        console.log(player, 'joined!');
        this.container = container;

        this.render();

        this.updateGameRound(1, player);
        // this.updatePlayerList([player]);

        //! ThreeScene skapas i render() när threeContainer skapats
        // Registrera callback, pass values to YatzeeGame
        /*  this.threeScene?.setOnDiceSettled((values) => {
            this.yatzeeGame.setDiceFromPhysics(values); // update game state
            this.renderDice(values); // update dom
            this.updateRollBtn();
        }); */
    }

    //======( PRIVATE )======
    private render(): void {
        console.debug('🪳 render()');
        this.container.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- Left: Game UI -->
                <div class="flex-1 flex gap-2 min-h-0">
                    <!-- Game Controls Column -->
                    <div class="w-64 flex-shrink-0 flex flex-col bg-blue-600 shadow-blue-950 rounded-md">
                        <!-- Player count header -->
                        <div class="flex-shrink-0 px-2 pt-2">
                            <header>
                                <h4><span id="player-count">0</span> spelare</h4>
                            </header>
                        </div>

                        <!-- Scrollable player list -->
                        <div class="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
                            <ul id="player-list" class="flex flex-col gap-1"></ul>
                        </div>

                        <!-- Game round display -->
                        <div id="game-round" class="p-2"></div>

                        <!-- SHOW which dice combo with text -->
                        <div class="m-2 p-2 border bg-slate-500 text-center rounded-md" id="dice-combo-alert"></div>

                        <!-- Dice container -->
                        <div id="dice-container" class="flex m-2 rounded-md border justify-center items-center gap-2 p-2 bg-blue-500 shadow-blue-900 min-h-[100px]"></div>

                        <!-- KASTA BUTTON -->
                        <div id="roll-dice-btn" class="flex justify-center p-2">
                            <button class="bg-blue-500 shadow-blue-900 p-2">Kasta tärningar</button>
                        </div>

                        <!-- FINAL BUTTON -->
                        <div id="final-kept-dice" class="flex justify-center p-2">
                            <button class="bg-red-500 shadow-red-900/50" id="final-kept-dice-btn">Skicka slutvärdet</button>
                        </div>
                    </div>

                    <!-- Three.js Canvas Column -->
                    <div class="flex-1 min-h-0 relative bg-orange-500" id="three-container"></div>
                </div>
            </div>
        `;

        // Element Referenser
        this.gameRoundElement = this.container.querySelector('#game-round');
        this.playerListElement = this.container.querySelector('#player-list');
        this.playerCountElement = this.container.querySelector('#player-count');
        this.threeContainer = this.container.querySelector('#three-container');
        this.diceComboAlert = this.container.querySelector('#dice-combo-alert');

        // SKAPA ThreeScene i den nya containern
        if (this.threeContainer) {
            console.debug('🪳 SKAPAR ThreeScene i GameRender');
            this.threeScene = new ThreeScene(this.threeContainer);

            // Callback för dice settled
            // Callback för dice settled
            this.threeScene.setOnDiceSettled((values) => {
                this.yatzeeGame.setDiceFromPhysics(values);
                this.renderDice(values);
                this.updateRollBtn();
                this.hasRolledThisRound = true;

                // Visa kombinationen
                const combo = this.yatzeeGame.getDiceCombo(values);
                console.info('combo:', combo);

                // Visa text för vilken combo som finns
                if (!this.diceComboAlert) return console.error('Hittar inte this.diceComboAlert');
                const displayName = Object.entries(CategoryMap).find(([_, v]) => v === combo)?.[0] ?? combo;
                this.diceComboAlert.innerHTML = `Du fick &rarr; <u><span class="font-extrabold">${displayName}</span></u>`;

                // ✅ ONLY auto-score when NO rolls left AND no valid categories
                const rollsLeft = this.yatzeeGame.getRollsLeft();
                const validCategories = this.getValidCategories(combo);
                const hasValidCategories = validCategories.some((cat) => {
                    const diceCombo = CategoryMap[cat];
                    return diceCombo && !this.yatzeeGame.isCategoryScored(diceCombo);
                });

                // ✅ Check if out of rolls AND no valid categories
                if (rollsLeft === 0 && !hasValidCategories) {
                    console.warn('⚠️ No rolls left AND no valid scoring categories! Auto-submitting with 0...');

                    const allCategories = Object.values(CategoryMap);
                    const unscoredCategory = allCategories.find((combo) => !this.yatzeeGame.isCategoryScored(combo));

                    if (unscoredCategory) {
                        const categoryName =
                            Object.entries(CategoryMap).find(([_, v]) => v === unscoredCategory)?.[0] ||
                            unscoredCategory;
                        console.warn(`🎲 Auto-scoring 0 for category: ${categoryName}`);

                        const player = this.yatzeeGame.getCurrentPlayer().playerName;
                        const currentRound = this.yatzeeGame.getRound();

                        this.yatzeeGame.forceScoreCategory(unscoredCategory, 0);
                        this.onScoreUpdate?.(player, categoryName, 0, currentRound);
                        // [ ] Ska den vara 0 här?

                        this.submitRoundResult(currentRound, player);
                        this.updateGameRound(this.yatzeeGame.getRound(), this.yatzeeGame.getCurrentPlayer().playerName);
                        this.resetForNextRound();
                    }
                    return;
                }

                // Only highlight if there are still rolls left or valid categories exist
                if (hasValidCategories || rollsLeft > 0) {
                    this.onComboSuggestion?.(this.getValidCategories(combo));
                }

                console.info('Callback för dice settled.');
                if (rollsLeft === 0) {
                    console.warn(
                        '0 tärningskast kvar, men det finns giltiga kategorier. Spelare måste välja kategori.',
                    );
                }

                // Visa kombinationen
                //! this.showComboSuggestion(this.getValidCategories(combo)); Ingen text bara highligta table celler
                this.onComboSuggestion?.(this.getValidCategories(combo)); // highlightar celler i table
                // Sätt poäng till spelaren

                console.info('Callback för dice settled. Auto submit när slut på kast');
                if (this.yatzeeGame.getRollsLeft() === 0) {
                    console.warn('0 tärningskast kvar, auto-submit om 3 sekunder...');
                    console.warn('tog bort setTimeout...');
                    console.warn('Spelare måste välja kategori. ');

                    //! ingen submit här, ska vänta på scoreCategory()
                }
            });
        } else {
            console.error('Three container not found in GameRender');
        }

        // Roll Dice Btn
        this.container.querySelector('#roll-dice-btn')?.addEventListener('click', () => {
            console.info('🪳 handling dice roll...');
            this.handleDiceRoll();
        });

        // Ska till socket från client
        this.container.querySelector('#final-kept-dice-btn')?.addEventListener('click', () => {
            console.warn('🪳 Hanterar röd final-kept-dice-btn...');

            /*
            const gameState = this.getGameState();
            console.debug('🪳 ? onFinalDice... (gameState)', gameState);
            this.onFinalDice?.(gameState); */

            const gameState = this.getGameState();
            const currentRound = this.yatzeeGame.getRound();
            const player = this.yatzeeGame.getCurrentPlayer().playerName;
            const rollsLeft = this.yatzeeGame.getRollsLeft();

            console.table({ gameState, currentRound, rollsLeft });

            // 1. Kolla om spelet är slut --> skicka finalResults
            if (this.yatzeeGame.isGameOver()) {
                console.warn('Yatzee spel är slut');
                console.info('Hämta värden från alla spelare?');
                console.info('Räkna ut vinnaren');

                const winner = this.calculateWinner();
                console.info('Hämta HELA spelets state med alla poäng');
                const finalResults: FinalGameResults = {
                    players: this.yatzeeGame.getAllPlayers(),
                    finalScores: this.yatzeeGame.getAllScores(),
                    winner: winner || 'Funkar inte',
                };
                /*  // Hämta HELA spelets state med alla poäng
                const fullGameState: FinalGameState = {
                    players: this.yatzeeGame.getAllPlayers(),
                    currentPlayer: this.yatzeeGame.getCurrentPlayer().playerName,
                    round: this.yatzeeGame.getRound(),
                    isGameOver: true,
                    finalScores: this.yatzeeGame.getAllScores(),
                }; */

                console.warn('SPELET ÄR SLUT: skickar finalResults till servern', finalResults);
                this.onGameComplete?.(finalResults);

                //? Optional: Disable button after sending
                const finalBtn = this.container.querySelector('#final-kept-dice-btn') as HTMLButtonElement;
                if (finalBtn) {
                    finalBtn.disabled = true;
                    finalBtn.textContent = 'Resultat skickat!';
                }

                //? Show game over message
                alert('Game completed! Results sent to server.');
            } else {
                // 2. Om rundor innan 13 så skickas rundansResultat
                alert('Game är inte slut än. Fyll i poängtabellen för att submitta för denna rundan');
            }
        });
    }

    private calculateWinner(): string {
        const allScores = this.yatzeeGame.getAllScores();
        let highestScore = -1;
        let winner = '';

        for (const [player, scores] of Object.entries(allScores)) {
            const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
            if (total > highestScore) {
                highestScore = total;
                winner = player;
            }
        }

        return winner;
    }

    private handleDiceRoll(): void {
        console.group(`handleDiceRoll()`);

        //! Hur få till 0 utan att truycka på knappen?
        // Kolla om har kast kvar
        if (this.yatzeeGame.getRollsLeft() === 0) {
            console.warn('INGA KAST KVAR. Auto-submittar runda till socket');
            //! this.submitRoundResult(); score och submit händer bara när spelare väljer kategori

            console.groupEnd();
            return;
        } else {
            console.warn('getRollsLeft är inte 0');
            console.warn('getRollsLeft() -->', this.yatzeeGame.getRollsLeft());
            // utan error så fortsätter koden efter blocket
        }

        console.info('Kollar vilka tärningar som ska kasta om...');
        // Kolla vilka tärningar som ska kastas
        const hasUnwanted = this.unwantedDice.some((unwanted) => unwanted === true);
        let diceToReRoll: UnwantedDice;
        if (hasUnwanted) {
            // Om några är valda, rulla bara dem
            diceToReRoll = this.unwantedDice;
            console.debug('🪳 Kastar valda tärningar:', diceToReRoll);
        } else {
            // Inga valda tärningar --> kastar ALLA tärningar
            console.debug('🪳 Inga tärningar valda --> rullar om alla tärningar');
            diceToReRoll = [true, true, true, true, true];
        }

        // Minska tärningskast i game state
        this.yatzeeGame.decrementRollsLeft();
        console.debug(`🪳 Kast kvar efter minskning --> ${this.yatzeeGame.getRollsLeft()}`);
        this.updateRollBtn();
        console.debug('🪳 Uppdaterar UI för att visa hur många kast kvar...');

        // Uppdatera 3D Tärningar
        if (this.threeScene) {
            console.info('3D Tärningarnas värden bestämms från FYSIK');
            console.warn('Tärningar som ska kastas fysiskt -->', diceToReRoll); // tidigare this.unwantedDice

            console.info('Starta 3D simulering');
            this.threeScene.startSimulation();
            // Skicka unwantedDice till ThreeScene för omkast
            this.threeScene.updateDiceValues(diceToReRoll); // tidigare this.unwantedDice
        }
        console.groupEnd();
    }

    private submitRoundResult(currentRound: number, player: string): void {
        console.info(`🪳 submitRoundResult() - Round: ${currentRound}, Player: ${player}`);
        console.debug(`🪳 roundSubmitted flag: ${this.roundSubmitted}`);

        if (this.roundSubmitted) {
            console.warn('⚠️ Round already submitted! Skipping duplicate.');
            return;
        }

        const playerScores = this.yatzeeGame.getCurrentPlayer().scores;
        const hasScore = Object.keys(playerScores).length > 0;
        if (!hasScore) {
            console.error('Spelaren har inte några poäng än.');
            return;
        }

        this.roundSubmitted = true;

        const gameState = this.getGameState();
        const roundResult: GameState = {
            currentPlayer: player,
            dice: gameState.dice,
            scores: playerScores,
            rollsLeft: gameState.rollsLeft,
            round: currentRound,
        };

        console.debug('🪳 Skickar rundas resultat till server:', roundResult);
        this.onFinalDice?.(roundResult);
    }

    private updateRollBtn(): void {
        console.debug('🪳 updateRollBtn() --> Uppdatera tärningskastknappen');
        const btn = this.container.querySelector('#roll-dice-btn button') as HTMLButtonElement;
        const rollsLeft = this.yatzeeGame.getRollsLeft(); // getter till YatzeeGame
        if (btn) {
            btn.textContent = `Kasta tärningar (${rollsLeft} kast kvar)`;
            //! btn.disabled = rollsLeft === 0; # Om stänger av blir den inte 0 och då blir det ingen auto-submit
            // annars skrivs kommentaren ut vare sig den är av eller på
            rollsLeft === 0 && console.warn('INAKTIVERAR knapp (0 kast kvar)');
        }
    }

    // Rendera tärningsknappar för att välja vilka tärningar som ska behållas
    private renderDice(dice: number[]): void {
        console.debug('🪳 renderDice(dice) -->', dice);

        const diceContainer = this.container.querySelector('#dice-container') as HTMLElement;
        if (!diceContainer) return console.error('diceContainer hittas inte');

        const diceSymbols = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

        diceContainer.innerHTML = dice
            .map(
                (val, i) => `
                    <div
                        class="die cursor-pointer text-5xl rounded border-2 border-transparent transition-all select-none duration-700 hover:text-black hover:animate-bounce
                            ${this.unwantedDice[i] ? 'border-yellow-400 bg-red-100 text-black scale-110' : 'opacity-60'}"
                        data-index="${i}"
                    >
                        ${diceSymbols[val] ?? val}
                    </div>
                `,
            )
            .join('');

        // Add click listeners to each die
        diceContainer.querySelectorAll('.die').forEach((el) => {
            el.addEventListener('click', () => {
                console.info('Klickade på en tärning');

                const index = Number((el as HTMLElement).dataset.index);
                console.debug('🪳 toggle unwantedDice');

                // TOGGLE:
                // false --> true (Kasta om),
                // true --> false (Behåll)
                this.unwantedDice[index] = !this.unwantedDice[index];
                console.debug('🪳 unwantedDice after choice:', this.unwantedDice);

                console.info('Renderar om för att visa val');
                this.renderDice(dice); // rendera igen för att visa val
            });
        });
    }

    // Bestämmer vilka combos som är klickbara
    private getValidCategories(combo: DiceCombo): string[] {
        const alwaysValid = ['Chance'];
        const dice = this.yatzeeGame.getDice();

        // Only highlight upper categories where player actually has matching dice
        const upperCategories = [
            { name: 'Ettor', value: 1 },
            { name: 'Tvåor', value: 2 },
            { name: 'Treor', value: 3 },
            { name: 'Fyror', value: 4 },
            { name: 'Femmor', value: 5 },
            { name: 'Sexor', value: 6 },
        ]
            .filter(({ value }) => dice.includes(value))
            .map(({ name }) => name);

        const exactMatch = Object.entries(CategoryMap)
            .filter(([_, v]) => v === combo)
            .map(([k]) => k);

        const additionalValid: string[] = [];
        if (['yatzee', 'fourOfAKind', 'threeOfAKind', 'fullHouse'].includes(combo)) {
            additionalValid.push('3 kombo');
        }
        if (['yatzee', 'fourOfAKind'].includes(combo)) {
            additionalValid.push('4 kombo');
        }

        return [...new Set([...exactMatch, ...additionalValid, ...upperCategories, ...alwaysValid])];
    }

    //======( PUBLIC )======
    public getGameState(): GameState {
        console.debug('🪳 getGameState()...');
        /* return {
            dice: this.yatzeeGame.getDice(),
            rollsLeft: this.yatzeeGame.getRollsLeft(),
            scores: this.yatzeeGame.getScores(),
            currentPlayer: this.yatzeeGame.getCurrentPlayer(),
        }; */
        return this.yatzeeGame.getGameState();
    }

    //===( CALLBACKS )===
    public setOnComboSuggestion(callback: (validCategories: string[]) => void): void {
        console.info('setOnComboSuggestion(CALLBACK)');
        this.onComboSuggestion = callback;
    }

    public setOnFinalDice(callback: (gameState: GameState) => void): void {
        console.info('setOnFinalDice(CALLBACK)');
        this.onFinalDice = callback;
    }

    public setOnGameComplete(callback: (finalResults: FinalGameResults) => void): void {
        console.info('setOnGameComplete(CALLBACK)');
        this.onGameComplete = callback;
    }
    //! Ingen #combo-suggestion textfält, ska bara highlighta table celler
    /* private showComboSuggestion(validCategories: string[]): void {
        console.info('showComboSuggestion(validCategories)');

        const comboEl = this.container.querySelector('#combo-suggestion');
        if (!comboEl) return console.error('Hittar inte #combo-suggestion');

        // validCategories are already display names, no need for CategoryMap lookup
        comboEl.textContent = `Förslag: ${validCategories.join(', ')}`;

        this.onComboSuggestion?.(validCategories);
    } */

    public updateGameRound(round: number, playerName?: string): void {
        console.debug('🪳 updateGameRound(round, playerName)');
        if (this.gameRoundElement) {
            this.gameRoundElement.innerHTML = `
            <div class="bg-gray-700 rounded">
                <h4 class="text-center">Runda ${round}/13</h4>
                ${playerName ? `<p class="text-center">Spelare: ${playerName}</p>` : ''}
            </div>
        `;
        }
    }

    public updatePlayerList(players: string[], currentPlayer?: string): void {
        console.debug('🪳 updatePlayerList()', players);

        if (this.playerCountElement) {
            this.playerCountElement.textContent = players.length.toString();
        } else {
            console.warn('playerCountElement not found');
        }

        if (this.playerListElement) {
            this.playerListElement.innerHTML = players
                .map(
                    (player) =>
                        `<li class="px-2 ${currentPlayer === player ? 'bg-blue-500 shadow-blue-800' : 'bg-gray-600'} rounded">${player}</li>`,
                )
                .join('');
        } else {
            console.warn('playerListElement not found');
        }
    }

    public scoreCategory(category: string): void {
        console.info('scoreCategory(category):', category);

        if (!this.hasRolledThisRound) return console.warn('Måste kasta tärningarna först!');

        const diceCombo = CategoryMap[category];
        if (!diceCombo) return console.error('Okänd kategori:', category);

        if (this.yatzeeGame.isCategoryScored(diceCombo)) {
            console.warn(`Kategori (${category}) är redan använd!`);
            return;
        }

        const player = this.yatzeeGame.getCurrentPlayer().playerName;

        // Ökar runda till 2
        const score = this.yatzeeGame.scoreCategory(diceCombo);
        console.debug(`Sparat poäng: ${score}`);
        // Nu kan skicka rätt runda
        const currentRound = this.yatzeeGame.getRound();

        this.onScoreUpdate?.(player, category, score, currentRound);
        this.onComboSuggestion?.([]);

        this.submitRoundResult(currentRound, player);

        // alert('Nu nästa runda efter EMIT');
        // this.yatzeeGame.nextRound
        this.yatzeeGame.nextRound();
        this.updateGameRound(this.yatzeeGame.getRound(), this.yatzeeGame.getCurrentPlayer().playerName);
        this.resetForNextRound();
    }

    private resetForNextRound(): void {
        console.debug('🪳 resetForNextRound()');
        this.roundSubmitted = false; // var sann innan
        this.hasRolledThisRound = false;
        this.unwantedDice = [false, false, false, false, false];

        if (!this.diceComboAlert) return console.error('Hittar inte this.diceComboAlert');
        console.debug('🪳 Nollställer diceComboAlert = ""');
        this.diceComboAlert.textContent = '';

        this.updateRollBtn();
    }

    public setOnScoreUpdate(callback: (player: string, category: string, score: number, round: number) => void): void {
        console.info('setOnScoreUpdate(player, category, score, round)');
        this.onScoreUpdate = callback;
    }

    public getRound(): number {
        return this.yatzeeGame.getRound();
    }
}
