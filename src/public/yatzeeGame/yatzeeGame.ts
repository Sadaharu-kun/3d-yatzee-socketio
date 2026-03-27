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
    rolls: number;
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
type KeptDice = [boolean, boolean, boolean, boolean, boolean];

export class YatzeeGame {
    private state: GameState;

    constructor(player: string) {
        this.state = {
            dice: [0, 0, 0, 0, 0],
            rolls: 0,
            scores: {},
            currentPlayer: player,
        };
    }

    rollDice(keptDice: KeptDice = [false, false, false, false, false]): number[] {
        console.log('rollDice(keptDice) -->', keptDice);
        console.debug('🪳 Inte implementerad än, returnerar statens dice av instansen');
        // [ ] max 3 throws

        // [ ] Increment rolls
        return []
    }

    // Privat pga?
    private calculateScore(diceCombo: DiceCombo): number {
        console.debug('🪳 calculateScore(diceCombo) -->', diceCombo);
        const dice = this.state.dice;
        const getSum = (a: number, b: number): number => a + b;

        switch (diceCombo) {
            case 'largeStraight':
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
