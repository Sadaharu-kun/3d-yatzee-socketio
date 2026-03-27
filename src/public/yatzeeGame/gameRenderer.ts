import { YatzeeGame } from './yatzeeGame.js';

// Rendera yatzee spelet i DOM
export class GameRender {
    private yatzeeGame: YatzeeGame;
    private container: HTMLElement;

    constructor(container: HTMLElement, player: string) {
        console.debug('🪳 GameRender constructor()...');
        this.yatzeeGame = new YatzeeGame(player);
        this.container = container;
        this.render();
    }

    private render(): void {
        this.container.innerHTML = `
            <div id="dice-container" class="bg-red-500"></div>
            <div id="roll-dice-btn" class="bg-blue-500"></div>
            <div id="score-container" class="bg-green-500"></div>
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
        const diceContainer = this.container.querySelector('#dice-container');
        /* diceContainer?.innerHTML = `
            <div>${this.kept[i]}</div>
        `; */
    }
}
