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
        this.state = {
            dice: [0, 0, 0, 0, 0],
            rollsLeft: 3,
            scores: {},
            currentPlayer: player,
        };
    }

    newTurn(): void {
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

        // Välj hur ska kasta tärningarna
        // Slumpa tärningskasten
        this.state.dice = this.state.dice.map((die, i) => {
            // Behåll nuvarande värde
            if (keptDice[i]) return die;
            return this.randomiseDie();
            /* keptDice[i] ? die : this.randomiseDie() # annat sätt att skriva samma sak */
        });

        console.log('Minskar tärningskast till', --this.state.rollsLeft);
        return this.state.dice;
    }

    randomiseDie(): number {
        // Random från 1-6
        return Math.floor(Math.random() * 6) + 1;
    }

    rollAll(): void {
        console.log('Vill rulla alla tärningar');
        this.state.dice = this.state.dice.map(() => Math.floor(Math.random() * 6) + 1);
    }

    getDiceCombo(newDiceArray: number[]): DiceCombo {
        // Switch funkar bra för poäng, men när letar efter vilken typ är åtgärden olika
        console.debug('🪳 getDiceCombo() räkna ut vilken typ av kombinationstyp tärnngsarrayen är...');
        console.log('newDiceArray:', newDiceArray);

        // const frequencyArr: number[] & { length: 6 } = [0, 0, 0, 0, 0, 0]; // Frekvens per tärningssid. Värden (1-6)
        const frequencyArr: number[] = [0, 0, 0, 0, 0, 0]; // Frekvens per tärningssid. Värden (1-6)

        // Tärningsvärde - 1 pga nollindexering
        // newDiceArray.forEach((dieVal: number) => frequencyArr[dieVal - 1]!++); // frequencyArr[dieVal - 1] = frequencyArr[dieval - 1] + 1
        // Samma sak utan assertion. Är det bättre?
        newDiceArray.forEach((dieVal: number) => frequencyArr[dieVal - 1] ?? 0); // frequencyArr[dieVal - 1] = frequencyArr[dieval - 1] + 1

        // noUncheckedIndexedAccess: true --> Måste använda assertion.
        // Ska skydda om ett arrayindex är undefined vid runtime
        // Här är rätt att använda assertion ! för vet exakt input
        // Otydligare input är inte rekommenderat att använda assertion

        console.error('return fake');
        return 'ones';
    }

    // Privat pga?
    private calculateScore(diceCombo: DiceCombo): number {
        console.debug('🪳 calculateScore(diceCombo) -->', diceCombo);
        const dice = this.state.dice;
        const getSum = (a: number, b: number): number => a + b;

        switch (diceCombo) {
            case 'largeStraight':
                console.log('CASE largeStraight');
                break;
            case 'smallStraight':
            case 'fullHouse':
            case 'fourOfAKind':
            case 'threeOfAKind':
            case 'sixes':
            case 'fives':
            case 'fours':
            case 'threes':
            case 'twos':
            case 'ones':
            default:
                console.error('Inget switch case för diceCombo');
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
