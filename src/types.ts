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

// Tuple
export type KeptDice = [boolean, boolean, boolean, boolean, boolean];

export interface GameState {
    dice: number[];
    rollsLeft: 3 | 2 | 1 | 0;
    scores: Partial<Record<DiceCombo, number>>;
    currentPlayer: string;
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
