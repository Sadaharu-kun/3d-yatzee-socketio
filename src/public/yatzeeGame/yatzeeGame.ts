// yatzeeGame.ts
/*
    1. class YatzeeGame
*/
import type { PlayerState, DiceCombo, UnwantedDice, GameState } from '../../types.ts';

export class YatzeeGame {
    private state: GameState; // #final-kept-dice-btn --> skickar slutliga resultatet/kombon med EMIT som sparas i MongoDB för att visas i slutet av spelet
    private players: PlayerState[] = []; // name + score
    private currentPlayerIndex: number = 0; // index för att iterera spelare
    private round: number = 1; // från rond 1
    private maxRounds: number = 13; // till rond 13

    constructor(player: string) {
        console.log('YatzeeGame constructor()...');
        this.state = {
            dice: [],
            rollsLeft: 3,
            scores: {},
            currentPlayer: player,
            round: 1,
        };

        console.debug('🪳 addPlayer till yatzee game state');
        this.addPlayer(player);
    }

    public decrementRollsLeft(): void {
        console.info('decrementRollsLeft()');
        if (this.state.rollsLeft > 0) {
            this.state.rollsLeft--;
            console.debug('🪳 rollsLeft DECREASED to -->', this.state.rollsLeft);
        } else {
            console.warn('Kan inte minska rollsLeft, är redan 0!');
        }
    }

    //? players: PlayerState[]
    addPlayer(playerName: string): void {
        console.log('addPlayer(playerName)', playerName);
        this.players.push({ playerName, scores: {} });
    }

    getCurrentPlayer(): PlayerState {
        console.warn('getCurrentPlayer()');
        console.warn('Kanske inte ska använda PlayerState här?');
        return this.players[this.currentPlayerIndex]!;
    }

    public getAllPlayers(): PlayerState[] {
        console.info('getAllPlayers()');
        return [...this.players];
    }

    public getAllScores(): Record<string, Record<string, number>> {
        console.info('getAllScores()');
        const allScores: Record<string, Record<string, number>> = {};
        this.players.forEach((player) => {
            allScores[player.playerName] = { ...player.scores };
        });
        return allScores;
    }

    nextTurn(): void {
        console.info(`nextTurn() BEFORE - Current player index:', ${this.currentPlayerIndex}`);
        console.debug('🪳 nextTurn() BEFORE - Round:', this.round);
        // alert(`currentPlayerIndex: ${this.currentPlayerIndex}`);

        // alert(`BEFORE round: ${this.round}`);
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

        console.debug('🪳 nextTurn() AFTER - New player index:', this.currentPlayerIndex);

        if (this.currentPlayerIndex === 0) {
            this.round++;
            // alert(`RUNDA ökad till --> ${this.round}`);
            console.debug('🪳 nextTurn() - Round incremented to:', this.round);
        }

        // Synca rollningar, runda, och spelare
        this.state.rollsLeft = 3;
        this.state.round = this.round;
        this.state.currentPlayer = this.players[this.currentPlayerIndex]?.playerName || '';
    }
    /* nextTurn(): void {
        alert('🪳 nextTurn()');

        const wasLastPlayer = this.currentPlayerIndex === this.players.length - 1;

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        if (wasLastPlayer) this.round++; // Öka bara efter sista spelaren, för att lösa om bara en spelare

        //? Körs när 1 spelare, vilket alltid blir sannt
        if (this.currentPlayerIndex === 0) this.round++; // new round after all players go

        alert('🪳 återställer kast inför nästa runda');
        this.state.rollsLeft = 3; // Återställ kast

        alert('Syncar currentPlayer i state');
        this.state.currentPlayer = this.players[this.currentPlayerIndex]?.playerName ?? ''; // hittar inte namn som sträng, stör det något?
    } */

    scoreCategory(combo: DiceCombo): number {
        console.warn('scoreCategory(combo) -->', combo);

        const player = this.getCurrentPlayer();
        console.info('GOT player:', player);

        if (player.scores[combo] !== undefined) {
            console.warn('Already scored this category!');
            return 0;
        }

        // Räkna poäng och spara
        const score = this.calculateScore(combo);
        // player.scores[combo] = this.calculateScore(combo);
        player.scores[combo] = score;

        console.debug('🪳 nästa tur/spelare...');
        //! this.nextTurn(); Inte öka än, sker med egen metod i gameRender
        return score;
    }

    public getScoreForCombo(combo: DiceCombo): number {
        console.info('getScoreForCombo(combo) -->', combo);
        return this.calculateScore(combo);
    }

    public isCategoryScored(combo: DiceCombo): boolean {
        console.info('isCategoryScored(combo) -->', combo);
        const player = this.getCurrentPlayer();
        return player.scores[combo] !== undefined;
    }

    getScores(): GameState['scores'] {
        console.debug('🪳 getScores()...');
        return { ...this.state.scores };
    }
    /* getScores(): PlayerState[] {
        return this.players;
    } */

    getGameState(): GameState {
        console.debug('🪳 getGameState()');
        return { ...this.state };
    }

    getDice(): GameState['dice'] {
        console.debug('🪳 getDice()...');
        return [...this.state.dice];
    }
    getRound(): number {
        return this.round;
    }

    getRollsLeft(): GameState['rollsLeft'] {
        console.log('getRollsLeft()');
        return this.state.rollsLeft;
    }

    isGameOver(): boolean {
        console.info('isGameOver()');
        return this.round > this.maxRounds;
    }

    // rollDice(unwantedDice: UnwantedDice = [false, false, false, false, false]): number[] {
    public rollDice(unwantedDice: UnwantedDice): number[] {
        console.group(`rollDice(unwantedDice)`, unwantedDice);

        try {
            // Finns det kvar kast?
            if (this.state.rollsLeft === 0) {
                console.warn('Inga kast kvar! Kan inte kasta igen!');
                return this.state.dice;
            }
            console.debug(`Du har ${this.state.rollsLeft} kvar`);

            // Kolla att dice array finns
            if (!this.state.dice || this.state.dice.length === 0) {
                this.state.dice = [0, 0, 0, 0, 0];
            }

            // Kopia av nuvarande tärning
            const newDice = [...this.state.dice];
            console.debug('🪳 newDice:', newDice);

            // Kasta tärningar som inte ville behålla
            for (let i = 0; i < newDice.length; i++) {
                // true == re-roll
                // if (!unwantedDice[i])  tidigare omvänt
                if (unwantedDice[i]) {
                    // Rulla om tärningen (value between 1-6)
                    console.warn('Borde jag använda Math.random om sätts med Fysiken?');
                    newDice[i] = Math.floor(Math.random() * 6) + 1;
                }
            }

            // Update state
            this.state.dice = newDice;
            console.warn('DESCREASING rollsLeft FROM', this.state.rollsLeft);
            this.state.rollsLeft--;
            console.warn('DESCREASING rollsLeft TO', this.state.rollsLeft);

            console.debug('🪳 Nya tärningsvärden:', this.state.dice);
            console.debug('🪳 Kvarstående kast:', this.state.rollsLeft);

            return this.state.dice;
        } catch (error) {
            console.error('Error in rollDice:', error);
            return this.state.dice;
        } finally {
            console.groupEnd();
        }
    }

    setDiceFromPhysics(values: number[]): void {
        console.info('setDiceFromPhysics(values) -->', values);
        this.state.dice = [...values];
        console.info('Dice set from physics:', this.state.dice);
    }

    // [x] 1. Kolla frekvens av tärningsvärde
    // [x] 2. Åtgärd beroende på fall
    getDiceCombo(newDiceArray: number[]): DiceCombo {
        console.group(`getDiceCombo(newDiceArray)`, newDiceArray);
        try {
            console.debug('🪳 getDiceCombo() räkna ut vilken typ av kombinationstyp tärnngsarrayen är...');
            console.log('newDiceArray:', newDiceArray);

            // const frequencyArr: number[] & { length: 6 } = [0, 0, 0, 0, 0, 0]; // Frekvens per tärningssid. Värden (1-6)
            const frequencyArr: number[] = [0, 0, 0, 0, 0, 0]; // Frekvens per tärningssid. Värden (1-6)

            // Tärningsvärde - 1 pga nollindexering
            // newDiceArray.forEach((dieVal: number) => frequencyArr[dieVal - 1]!++); // frequencyArr[dieVal - 1] = frequencyArr[dieval - 1] + 1
            // Samma sak utan assertion. Är det bättre?
            //! newDiceArray.forEach((dieVal: number) => frequencyArr[dieVal - 1] ?? 0); // frequencyArr[dieVal - 1] = frequencyArr[dieval - 1] + 1
            //? bug: ökar aldrig
            newDiceArray.forEach((dieVal: number) => frequencyArr[dieVal - 1]!++);

            console.info('frequencyArr:', frequencyArr);

            //? Hur hade map funkar här?

            // noUncheckedIndexedAccess: true --> Måste använda assertion.
            // Ska skydda om ett arrayindex är undefined vid runtime
            // Här är rätt att använda assertion ! för vet exakt input
            // Otydligare input är inte rekommenderat att använda assertion

            // if fallthrough är konvention, och switch(true) är okonventionellt
            // Ska egentligen jämföra explicita värden, men pga bool funkar exakt samma.
            switch (true) {
                case frequencyArr.includes(5):
                    return 'yatzee';
                case frequencyArr.includes(4):
                    return 'fourOfAKind';
                case frequencyArr.includes(3) && frequencyArr.includes(2):
                    return 'fullHouse';
                case frequencyArr.includes(3):
                    return 'threeOfAKind';
                case (() => {
                    console.debug('🪳 checking if is largeStraight');
                    // IIFE kan inte ha type annotations inne i case, pga måste returnera boolean genom switch(true)
                    const unique = [...new Set(newDiceArray)].sort((a, b) => a - b);
                    return [1, 2, 3, 4, 5].every(
                        (n) => unique.includes(n) || [2, 3, 4, 5, 6].every((n) => unique.includes(n)),
                    );
                })():
                    return 'largeStraight';
                case (() => {
                    console.debug('🪳 checking if is smallStraight');
                    const unique = [...new Set(newDiceArray)].sort((a, b) => a - b);
                    const straights = [
                        [1, 2, 3, 4],
                        [2, 3, 4, 5],
                        [3, 4, 5, 6],
                    ];
                    return straights.some((s) => s.every((n) => unique.includes(n)));
                })():
                    return 'smallStraight';
                default:
                    console.warn('CASE inget fall hittat, defaulting till "chance"...');
                    return 'chance';
            }
        } finally {
            console.groupEnd();
        }
    }

    // Privat pga?
    private calculateScore(diceCombo: DiceCombo): number {
        console.group(`calculateScore(diceCombo)`, diceCombo);

        try {
            console.debug('🪳 calculateScore(diceCombo) -->', diceCombo);
            const dice = this.state.dice;
            const getSum = (a: number, b: number): number => a + b;

            switch (diceCombo) {
                case 'yatzee':
                    return 50;
                case 'largeStraight':
                    return 40;
                case 'smallStraight':
                    return 30;
                case 'fullHouse':
                    return 25;
                case 'fourOfAKind':
                    return dice.reduce((a, b) => a + b, 0);
                case 'threeOfAKind':
                    return dice.reduce((a, b) => a + b, 0);
                case 'sixes':
                    return dice.filter((dieValue) => dieValue === 6).reduce((a, b) => a + b, 0);
                case 'fives':
                    return dice.filter((dieValue) => dieValue === 5).reduce((a, b) => a + b, 0);
                case 'fours':
                    return dice.filter((dieValue) => dieValue === 4).reduce((a, b) => a + b, 0);
                case 'threes':
                    return dice.filter((dieValue) => dieValue === 3).reduce((a, b) => a + b, 0);
                case 'twos':
                    return dice.filter((dieValue) => dieValue === 2).reduce((a, b) => a + b, 0);
                case 'ones':
                    return dice.filter((dieValue) => dieValue === 1).reduce((a, b) => a + b, 0);
                case 'chance':
                    return dice.reduce((a, b) => a + b, 0);
                default:
                    console.error('Inget switch case för diceCombo. Returnerar 0 som falskt värde');
                    alert(`Inget switch case för ${diceCombo}`);
                    return 0;
            }
        } finally {
            console.groupEnd();
        }
    }

    public forceScoreCategory(combo: DiceCombo, score: number): void {
        console.info('forceScoreCategory(combo, score) -->', combo, score);
        alert('Ge 0 som poäng då ingen mer cell till scoretabellen');
        const player = this.getCurrentPlayer();

        if (player.scores[combo] !== undefined) {
            console.warn('Already scored this category!');
            return;
        }

        player.scores[combo] = score;
        this.nextTurn();
    }

    public nextRound(): void {
        console.debug('🪳 Nu går till nästa runda');
        this.nextTurn();
    }
}
