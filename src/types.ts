//======( CHAT )======
export interface UserMessage {
    username: string;
    message: string;
}

//======( YATZEE SPEL )======
// 1. Player
export interface PlayerState {
    playerName: string;
    scores: GameState['scores']
}

export type RoundResult = {
    player: string;
    category: string;
    score: number;
    round: number;
};


// Tuple
//! tidigare KeptDice # unwanted bättre då man väljer vilka man vill kasta och inte behålla
// [ ] Invertera logiken
export type UnwantedDice = [boolean, boolean, boolean, boolean, boolean];

// Individuella Spelare
export interface GameState {
    dice: number[];
    rollsLeft: 3 | 2 | 1 | 0;
    scores: Partial<Record<DiceCombo, number>>;
    currentPlayer: string;
    round: number;
}

// Slutlig struktur med alla spelare som sparas till MongoDB
export interface FinalGameState {
    players: PlayerState[];
    currentPlayer: string;
    round: number;
    isGameOver: boolean;
    finalScores: Record<string, Record<string, number>>;
}

export interface FinalGameResults {
    players: PlayerState[]
    finalScores: Record<string, Record<string, number>>
    winner?: string
}

// 2. Game Rules
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


export const CategoryMap: Record<string, DiceCombo> = {
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
} as const;
