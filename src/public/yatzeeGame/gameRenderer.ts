import type { KeptDice } from './yatzeeGame.ts';
import { YatzeeGame } from './yatzeeGame.js';

// Rendera yatzee spelet i DOM
export class GameRender {
    private yatzeeGame: YatzeeGame;
    private container: HTMLElement;
    private keptDice: KeptDice = [false, false, false, false, false];

    constructor(container: HTMLElement, player: string) {
        console.debug('🪳 GameRender constructor()...');
        this.yatzeeGame = new YatzeeGame(player);
        this.container = container;
        this.render();
    }

    private render(): void {
        console.debug('🪳 render()');
        this.container.innerHTML = `
        <div class="h-screen bg-purple-400">
            <div id="dice-container" class="flex flex-grow bg-red-500">dice-container</div>
            <div id="roll-dice-btn" class="flex justify-center p-4 bg-blue-500 shadow-blue-900">
                <button>Kasta tärningar</button>
            </div>
            <div id="score-container" class="bg-green-500">score container</div>
        </div>
        `;

        this.container.querySelector('#roll-dice-btn')?.addEventListener('click', () => {
            console.debug('🪳 handling dice roll');
            this.handleDiceRoll();
        });
    }

    private handleDiceRoll(): void {
        const dice = this.yatzeeGame.rollDice(this.keptDice);
        this.renderDice(dice);
    }

    private renderDice(dice: number[]): void {
        console.debug('🪳 renderDice(dice) -->', dice);
        const diceContainer = this.container.querySelector('#dice-container') as HTMLElement;
        if (!diceContainer) console.error('diceContainer hittas inte');
        diceContainer.innerHTML = `
            <div>${this.keptDice}</div>
            <div>${dice}</div>
            <div>⚀</div>
        `;
    }
}
