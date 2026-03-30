import type { KeptDice, GameState } from '../../types.ts';
import { YatzeeGame } from './yatzeeGame.ts';
import { ThreeScene } from '../utils/threejsDice.ts';

// Rendera yatzee spelet i DOM
export class GameRender {
    private yatzeeGame: YatzeeGame;
    private container: HTMLElement;
    private threeScene: ThreeScene | null = null;
    private keptDice: KeptDice = [false, false, false, false, false];
    private onFinalDice: ((gameState: GameState) => void) | null = null; // Acceptera GameState

    constructor(container: HTMLElement, player: string, threeScene?: ThreeScene) {
        console.debug('🪳 GameRender constructor()...');

        this.yatzeeGame = new YatzeeGame(player);
        console.log(player, 'joined!');
        this.container = container;
        this.threeScene = threeScene || null;
        this.render();

        // Registrera callback, pass values to YatzeeGame
        this.threeScene?.setOnDiceSettled((values) => {
            this.yatzeeGame.setDiceFromPhysics(values); // update game state
            this.renderDice(values); // update dom
            this.updateRollBtn();
        });
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

    //======( PRIVATE )======
    private render(): void {
        console.debug('🪳 render()');
        this.container.innerHTML = `
            <div>
                <header><h3>Antal spelare: <span id="player-count">0</span></h3></header>
                <ul class="m-4 px-2" id="player-list"></ul>
            </div>
            <div id="roll-dice-btn" class="flex justify-center p-4 bg-blue-500 shadow-blue-900"><button>Kasta tärningar</button></div>
            <div id="dice-container" class="flex bg-red-500"></div>
            <div id="final-kept-dice" class="flex bg-red-500"><button id="final-kept-dice-btn">Skicka slutvärdet</button></div>
            <div id="score-container" class="bg-green-500">
                <table>
                    <thead>
                        <tr>
                            <th>Övre Sektion</th>
                            <td>Ränka Poäng</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        </tr>
                        <tr>
                            <td>Två</td>
                            <td>Addera bara ettor</td>
                        </tr>
                        <tr>
                            <td>Tre</td>
                            <td>Addera bara ihop tvåor</td>
                        </tr>
                        <tr>
                            <td>Fyra</td>
                            <td>Addera bara ihop fyror</td>
                        </tr>
                            <td>Fem</td>
                            <td>Addera bara ihop femmor</td>
                        <tr>
                            <td>Sex</td>
                            <td>Addera bara ihop sexor</td>
                        </tr>
                        <tr>
                            <td>Totalt</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Bonus</td>
                            <td>Om summan blir 63 eller över</td>
                            <td>+ 35 poäng</td>
                        </tr>
                        <tr>
                            <td>Resultat</td>
                        </tr>
                    </tbody>
                </table>

                <table>
                    <thead>
                        <tr>
                            <th>Nedre Sektion</th>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>3 kombo</td>
                            <td>Addera summan av alla tärningar</td>
                            </tr>
                        <tr>
                            <td>4 kombo</td>
                            <td>Addera summan av alla tärningar</td>
                        </tr>
                        <tr>
                            <td>Full House</td>
                            <td>+ 25 poäng</td>
                        </tr>
                            <td>Small Straight</td>
                            <td>+ 30 poäng</td>
                        <tr>
                            <td>Large Straight</td>
                            <td>+ 40 poäng</td>
                        </tr>
                        <tr>
                            <td>Yatzee</td>
                            <td>+ 50 poäng</td>
                        </tr>
                        <tr>
                            <td>Chance</td>
                            <td>Summera alla tärningar</td>
                        </tr>
                        <tr>
                            <td>Yatzee Bonus</td>
                            <td>checkbox för varje bonus</td>
                            <td>poäng 100 * X</td>
                        </tr>
                        <tr>
                            <td>Totalt Övre Sektion</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Totalt Nedre Sektion</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Slutresultat</td>
                            <td>... summera med JavaScript</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        this.container.querySelector('#roll-dice-btn')?.addEventListener('click', () => {
            console.debug('🪳 handling dice roll...');
            this.handleDiceRoll();
        });

        // Ska till socket från client
        this.container.querySelector('#final-kept-dice-btn')?.addEventListener('click', () => {
            console.debug('🪳 handling final kept dice...');
            // const finalDice = this.yatzeeGame.getDice();
            console.warn('SKA ha valt ut vilka tärningar som ville sparat');
            console.warn('OCH nu är bara resultatet från den användaren den rundan.');
            console.debug('PRECIS INNAN this.getGameState()');
            const gameState = this.getGameState();
            console.debug('🪳 ? onFinalDice... (gameState)', gameState);
            this.onFinalDice?.(gameState);
        });
    }

    private handleDiceRoll(): void {
        console.group(`handleDiceRoll()`);

        console.debug('🪳 just decremet rollsLeft');
        const dice = this.yatzeeGame.rollDice(this.keptDice);
        this.renderDice(dice);

        // Update 3D dice
        if (this.threeScene) {
            console.info('Updating dice values...');
            //! this.threeScene.updateDiceValues(dice);
            this.threeScene.updateDiceValues([]); // Physics sätter värden
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

    private renderDice(dice: number[]): void {
        console.debug('🪳 renderDice(dice) -->', dice);

        const diceContainer = this.container.querySelector('#dice-container') as HTMLElement;
        if (!diceContainer) return console.error('diceContainer hittas inte');

        const diceSymbols = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

        diceContainer.innerHTML = dice
            .map(
                (val, i) => `
        <div
            class="die cursor-pointer text-4xl p-2 rounded border-2 border-transparent transition-all select-none
                   ${this.keptDice[i] ? 'border-yellow-400 bg-yellow-100 scale-110' : 'opacity-60'}"
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
                const index = Number((el as HTMLElement).dataset.index);
                this.keptDice[index] = !this.keptDice[index]; // toggle kept
                this.renderDice(dice); // re-render to show selection
            });
        });
    }
}
