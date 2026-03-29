/*
    1. class YatzeeGame
*/

interface DiceResult {
    dice: number[];
    score: number;
    category: string;
}

interface GameState {
    dice: number[];
    rollsLeft: 3 | 2 | 1 | 0;
    scores: Partial<Record<DiceCombo, number>>;
    currentPlayer: string;
}
export type DiceCombo =
    | 'ones'
    | 'twos'
    | 'threes'
    | 'fours'
    | 'fives'
    | 'sixes'
    | 'threeOfAKind'
    | 'fourOfAKind'
    | 'fullHouse'
    | 'smallStraight'
    | 'largeStraight'
    | 'yatzee'
    | 'chance';

// Tuple
export type KeptDice = [boolean, boolean, boolean, boolean, boolean];

export class YatzeeGame {
    private state: GameState;

    constructor(player: string) {
        console.log('YatzeeGame constructor()...');
        this.state = {
            dice: [0, 0, 0, 0, 0],
            rollsLeft: 3,
            scores: {},
            currentPlayer: player,
        };
    }

    newTurn(): void {
        console.debug('🪳 newTurn()');
        this.state.rollsLeft = 3; // Återställ kast
        this.state.dice = [0, 0, 0, 0, 0]; // Behövs tärningar ställas om?
    }

    rollDice(keptDice: KeptDice = [false, false, false, false, false]): number[] {
        console.log('rollDice(keptDice) -->', keptDice);
        // console.debug('🪳 Inte implementerad än, returnerar statens dice av instansen');

        console.log('this.state.rolls:', this.state.rollsLeft);
        console.log('this.state.rolls:', keptDice);

        // [ ] max 3 throws
        if (this.state.rollsLeft === 0) throw new Error('Slut på tärningskast!');
        // [ ] Increment rolls
        // minska tärningskast

        // Räknas efter kastas i 3D modellen
        // Välj hur ska kasta tärningarna
        // Slumpa tärningskasten
        /* this.state.dice = this.state.dice.map((die, i) => {
            // Behåll nuvarande värde
            if (keptDice[i]) return die;
            // return this.randomiseDie();

            // keptDice[i] ? die : this.randomiseDie() # annat sätt att skriva samma sak
        }); */

        console.log('Minskar tärningskast till', --this.state.rollsLeft);
        return this.state.dice;
    }

    // Tärningsarray skapas från kastade 3d tärningar
    /* randomiseDie(): number {
        console.debug('🪳 randomDice()');
        // Random från 1-6
        return Math.floor(Math.random() * 6) + 1;
    } */

    rollAll(): void {
        console.debug('🪳 rollAll()');
        console.log('Vill rulla alla tärningar');
        this.state.dice = this.state.dice.map(() => Math.floor(Math.random() * 6) + 1);
    }

    // [x] 1. Kolla frekvens av tärningsvärde
    // [x] 2. Åtgärd beroende på fall
    getDiceCombo(newDiceArray: number[]): DiceCombo {
        console.debug('🪳 getDiceCombo() räkna ut vilken typ av kombinationstyp tärnngsarrayen är...');
        console.log('newDiceArray:', newDiceArray);

        // const frequencyArr: number[] & { length: 6 } = [0, 0, 0, 0, 0, 0]; // Frekvens per tärningssid. Värden (1-6)
        const frequencyArr: number[] = [0, 0, 0, 0, 0, 0]; // Frekvens per tärningssid. Värden (1-6)

        // Tärningsvärde - 1 pga nollindexering
        // newDiceArray.forEach((dieVal: number) => frequencyArr[dieVal - 1]!++); // frequencyArr[dieVal - 1] = frequencyArr[dieval - 1] + 1
        // Samma sak utan assertion. Är det bättre?
        newDiceArray.forEach((dieVal: number) => frequencyArr[dieVal - 1] ?? 0); // frequencyArr[dieVal - 1] = frequencyArr[dieval - 1] + 1

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
    }

    // Privat pga?
    private calculateScore(diceCombo: DiceCombo): number {
        console.debug('🪳 calculateScore(diceCombo) -->', diceCombo);
        const dice = this.state.dice;
        const getSum = (a: number, b: number): number => a + b;

        switch (diceCombo) {
            /* case 'largeStraight':
                console.log('CASE largeStraight');
                break;
            case 'smallStraight':
            case 'fullHouse':
            case 'fourOfAKind':
            case 'threeOfAKind':  */
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
                return 0;
        }
    }
}

/* class Player {
    name: string;
    scores: Record<string, number | null> = {};
}

class YatzeeGame {
    players: Player[] = [];
    currentPlayerIndex: number = 0;
    dice: number[] = [0, 0, 0, 0, 0]; // 5 tärningar
    keepDice: boolean[] = [false, false, false, false, false];
    rollsLeft: number = 3; // 3 maximala kast
}
 */
