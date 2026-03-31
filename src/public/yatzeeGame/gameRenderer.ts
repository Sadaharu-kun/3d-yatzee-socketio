// gameRenderer.ts
import type { UnwantedDice, GameState, DiceCombo, FinalGameState, FinalGameResults } from '../../types.ts';
import { YatzeeGame } from './yatzeeGame.ts';
import { ThreeScene } from '../utils/threejsDice.ts';

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

    private onScoreUpdate: ((player: string, category: string, score: number) => void) | null = null;
    private onFinalDice: ((gameState: GameState) => void) | null = null; // Acceptera GameState
    private onGameComplete: ((finalResults: FinalGameResults) => void) | null = null; // Acceptera GameState

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

    public setOnFinalDice(callback: (gameState: GameState) => void): void {
        console.debug('🪳 setOnFinalDice(callback)');
        this.onFinalDice = callback;
    }

    public setOnGameComplete(callback: (finalResults: FinalGameResults) => void): void {
        console.debug('🪳 setOnGameComplete(callback)');
        this.onGameComplete = callback;
    }

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
        console.info('scoreCategory(category) -->', category);

        // Hämta nuvarande tärningsvärden
        const dice = this.yatzeeGame.getDice();
        const combo = this.yatzeeGame.getDiceCombo(dice);

        let score: number = 0;
        const categoryMap: Record<string, DiceCombo> = {
            Ettor: 'ones',
            Tvåor: 'twos',
            Treor: 'threes',
            Fyror: 'fours',
            Femmor: 'fives',
            Sexor: 'sixes',
            '3 kombo': 'threeOfAKind',
            '4 kombo': 'fourOfAKind',
            'Full House': 'fullHouse',
            'Small Straight': 'smallStraight',
            'Large Straight': 'largeStraight',
            Yatzee: 'yatzee',
            Chance: 'chance',
        };

        const diceCombo = categoryMap[category];
        if (!diceCombo) {
            console.error('Okänd kategori:', category);
            return;
        }

        // Kolla om redan ifylld
        if (this.yatzeeGame.isCategoryScored(diceCombo)) {
            console.warn(`Kategori (${category}) är redan använd!`);
            return;
        }

        // Uppdatera gamestate
        this.yatzeeGame.scoreCategory(diceCombo);

        // Skicka till (ScoreTable)
        const player = this.yatzeeGame.getCurrentPlayer().playerName;
        this.onScoreUpdate?.(player, category, score);

        // UI
        this.updateGameRound(this.yatzeeGame.getRound(), player);

        // Ställ om unwantedDice för nästa rond
        this.unwantedDice = [false, false, false, false, false];
    }

    public setOnScoreUpdate(callback: (player: string, category: string, score: number) => void): void {
        console.info('setOnScoreUpdate(player, category, score)');
        this.onScoreUpdate = callback;
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
                    <div class="flex-1 min-h-0 bg-orange-500" id="three-container"></div>
                </div>
            </div>
        `;

        // Element Referenser
        this.gameRoundElement = this.container.querySelector('#game-round');
        this.playerListElement = this.container.querySelector('#player-list');
        this.playerCountElement = this.container.querySelector('#player-count');
        this.threeContainer = this.container.querySelector('#three-container');

        // SKAPA ThreeScene i den nya containern
        if (this.threeContainer) {
            console.debug('🪳 SKAPAR ThreeScene i GameRender');
            this.threeScene = new ThreeScene(this.threeContainer);

            // Callback för dice settled
            this.threeScene.setOnDiceSettled((values) => {
                this.yatzeeGame.setDiceFromPhysics(values);
                this.renderDice(values);
                this.updateRollBtn();
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
            console.info('🪳 handling final kept dice...');
            // const finalDice = this.yatzeeGame.getDice();
            console.warn('SKA ha valt ut vilka tärningar som ville sparat');
            console.warn('OCH nu är bara resultatet från den användaren den rundan.');
            console.debug('PRECIS INNAN this.getGameState()');

            console.warn('Ska bara skicka slutvärden till server efter 13 ronden!!');

            /*
            const gameState = this.getGameState();
            console.debug('🪳 ? onFinalDice... (gameState)', gameState);
            this.onFinalDice?.(gameState); */

            // Bara om spel är slut
            if (this.yatzeeGame.isGameOver()) {
                console.warn('Yatzee spel är slut');
                console.debug('🪳 Hämta värden från alla spelare?');

                console.debug('🪳 Räkna ut vinnaren');
                const winner = this.calculateWinner();

                // Hämta HELA spelets state med alla poäng
                const finalResults: FinalGameResults = {
                    players: this.yatzeeGame.getAllPlayers(),
                    finalScores: this.yatzeeGame.getAllScores(),
                    winner: winner || 'inte fixat än',
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
                /* alert('Game completed! Results sent to server.'); */
            } else {
                console.warn('Game is not over yet! Complete all rounds first.');
                // Optional: Show message to user
                alert(`Game not finished! Round ${this.yatzeeGame.getRound()}/13 remaining.`);
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
        console.debug('🪳 just decremented rollsLeft');

        // Randomiserar tärningar fel, går emot fysiken
        /* const dice = this.yatzeeGame.rollDice(this.unwantedDice);
        console.warn('🪳 NOT FROM PHYSICS: dice -->', dice);
        console.warn('this.renderDice(dice) << inte från PHYSICS');
        this.renderDice(dice); */

        // Update 3D dice - pass unwantedDice to only re-roll non-kept dice
        if (this.threeScene) {
            console.info('3D Tärningarnas värden bestämms från FYSIK');
            console.warn('Tärningar som ska kastas fysiskt -->', this.unwantedDice);

            console.info('Updating 3D dice with unwantedDice:', this.unwantedDice);
            // Pass unwantedDice to ThreeScene so it knows which dice to re-roll
            this.threeScene.updateDiceValues(this.unwantedDice);
        }
        console.groupEnd();
    }

    private updateRollBtn(): void {
        console.debug('🪳 updateRollBtn() --> Uppdatera tärningskastknappen');
        const btn = this.container.querySelector('#roll-dice-btn button') as HTMLButtonElement;
        const rollsLeft = this.yatzeeGame.getRollsLeft(); // getter till YatzeeGame
        if (btn) {
            btn.textContent = `Kasta tärningar (${rollsLeft} kast kvar)`;
            btn.disabled = rollsLeft === 0;
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

                // Toggle: false -> true (mark for re-roll), true -> false (keep)
                this.unwantedDice[index] = !this.unwantedDice[index];
                console.debug('🪳 this.renderDice(dice) -->', dice);

                this.renderDice(dice); // rendera igen för att visa val
                console.debug('🪳 unwantedDice after choice:', this.unwantedDice);
            });
        });
    }
}
