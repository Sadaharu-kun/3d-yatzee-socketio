import type { KeptDice } from './yatzeeGame.ts';
import { YatzeeGame } from './yatzeeGame.ts';
import { ThreeScene } from '../utils/threejsDice.ts';

// Rendera yatzee spelet i DOM
export class GameRender {
    private yatzeeGame: YatzeeGame;
    private container: HTMLElement;
    private keptDice: KeptDice = [false, false, false, false, false];
    private threeScene: ThreeScene | null = null;

    constructor(container: HTMLElement, player: string, threeScene?: ThreeScene) {
        console.debug('🪳 GameRender constructor()...');

        this.yatzeeGame = new YatzeeGame(player);
        console.log(player, 'joined!');
        this.container = container;
        this.threeScene = threeScene || null;
        this.render();

        // Register callback, pass values to YatzeeGame
        this.threeScene?.setOnDiceSettled((values) => {
            this.yatzeeGame.setDiceFromPhysics(values); // update game state
            this.renderDice(values); // update dom
        });
    }

    private render(): void {
        console.debug('🪳 render()');
        this.container.innerHTML = `
            <div>
                <header><h3>Antal spelare: <span id="player-count">0</span></h3></header>
                <ul class="m-4 px-2" id="player-list"></ul>
            </div>
            <div id="roll-dice-btn" class="flex justify-center p-4 bg-blue-500 shadow-blue-900"><button>Kasta tärningar</button></div>
            <div id="dice-container" class="flex bg-red-500"></div>
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
            console.debug('🪳 handling dice roll');
            this.handleDiceRoll();
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
            console.warn('råkade tidigare skicka med fördefinierade värden');
            //! this.threeScene.updateDiceValues(dice);
            this.threeScene.updateDiceValues([]); // Physics sätter värden
        }
        console.groupEnd();
    }

    private renderDice(dice: number[]): void {
        console.debug('🪳 renderDice(dice) -->', dice); // X

        /* const diceContainer = this.container.querySelector('#dice-container') as HTMLElement;
        if (!diceContainer) console.error('diceContainer hittas inte');
        diceContainer.innerHTML = `
            <div>${this.keptDice}</div>
            <div>${dice}</div>
            <div>⚀</div>
        `; */
    }
}
