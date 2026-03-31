import type { UserMessage, PlayerState, GameState, FinalGameState, FinalGameResults } from '../types.js';

import { io } from 'socket.io-client'; // Vite rpoxy
import { initSidebarChat } from './utils/sidebarChat.ts';
import { GameRender } from './yatzeeGame/gameRenderer.ts';
import { ThreeScene } from './utils/threejsDice.ts';
import { ScoreTable } from './utils/scoreTable.ts';
import { lightingContext } from 'three/src/nodes/lighting/LightingContextNode.js';
// import type { Socket } from 'socket.io'; sen utan vite?

let gameRender: GameRender | null = null;
let threeScene: ThreeScene | null = null; //! hanteras i klassen
let scoreTable: ScoreTable | null = null; // Hanteras i ScoreTable
let pendingPlayers: string[] | null = null;
let pendingCurrentPlayer: string | null = null;

// Best practice är att samla DOM element överst
let socket: ReturnType<typeof io>;
let messageForm: HTMLFormElement;
let userInput: HTMLInputElement;
let messageInput: HTMLInputElement;
let welcomeMessage: HTMLElement;
let messageContainer: HTMLElement;

let gameContainer: HTMLElement;
//! let threeContainer: HTMLElement; finns i klassen
let sidebarChatContainer: HTMLElement;

// Final dice
let finalDiceBtn: HTMLButtonElement;

// Har den redan egen typ?
let username: string;
let message: string;

// [ ] 1. Game Container
// [ ] 2. Chat
// [ ] 3. ThreeJS WebGL rendering
addEventListener('DOMContentLoaded', () => {
    //? När letar ska vara i eventlistener?
    // 1. Containers
    gameContainer = document.querySelector('#yatzee-game-container') as HTMLElement;
    sidebarChatContainer = document.querySelector('#sidebar-chat-container') as HTMLElement;

    // 2. Chat
    messageForm = document.querySelector('#message-form') as HTMLFormElement;
    userInput = document.querySelector('#user-input') as HTMLInputElement;
    messageInput = document.querySelector('#message-input') as HTMLInputElement;
    welcomeMessage = document.querySelector('#welcome-message') as HTMLInputElement;
    messageContainer = document.querySelector('#message-container') as HTMLElement;

    // Container validation
    if (!gameContainer || !sidebarChatContainer) {
        console.error('gameContainer eller sidebarChatContainer saknas');
        return; // När ha return och inte? --> return stoppar koden om error
    }

    // Chat validation
    if (!messageForm || !userInput || !messageInput || !welcomeMessage || !messageContainer) {
        console.error('messageForm, userInput, messageInput, welcomeMessage, messageContainer saknas');
        return;
    }

    try {
        scoreTable = new ScoreTable();
        console.info('ScoreTable är initierat');
    } catch (error) {
        console.error('Lyckades inte initiera ScoreTable.', error);
    }

    initSidebarChat();

    // Scene först, sen skicka till GameRender
    //! threeScene = new ThreeScene(threeContainer);
    // Sker i klassen

    // Skapa inte spel innan användarnamnet angetts
    initChat();

    console.log('initialised sidebar, chat');
});

function initChat(): void {
    console.debug('🪳 initChat()');
    // socket: Socket = io();
    socket = io(); // Har redan typ från toppen

    // socket.on('newChatMessage', function (msg: UserMessage) {
    socket.on('newChatMessage', (msg: UserMessage) => {
        // namngivelse: do what, to where
        console.debug('🪳 socket.on newChatMessage');
        console.info('msg:', msg); // Object
        addMessageToChat(msg);
    });

    /* socket.on('updatePlayers', (players: string[]) => {
        console.debug('🪳 Uppkopplade spelare:', players);
        showPlayers(players);

        // Om finns, updatera spelare
        if (gameRender) {
            gameRender.updatePlayerList(players);
        }
    }); */

    socket.on('updatePlayers', (players: string[]) => {
        console.debug('🪳 Uppkopplade spelare:', players);

        // Store current player if we have one
        const currentPlayer = userInput.value.trim();

        // Show players - this will handle both cases
        showPlayers(players, currentPlayer);
    });

    //! NY
    socket.on('updateScore', (data: { player: string; category: string; score: number }) => {
        console.debug('🪳 Fick nya poäng från en annan spelare -->', data);

        // Uppdatera poändtabellen för ALLA spelare
        if (!scoreTable) console.error('Hittar inte scoreTable');
        // scoreTable?.updateScore(data.player, data.category, data.score)
        // Destrukturera innan utan att ange data?
        scoreTable?.updateScore(data.player, data.category, data.score);

        //? skicka meddelande om poäng i chatten?
    });

    // Lyssna bara efter submit
    messageForm.addEventListener('submit', handleSubmit);

    // Enter submittar inte
    messageInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line
            e.stopPropagation(); // Stop event from bubbling
            messageForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
    });

    //userInput.addEventListener('keypress', handleEnterKey);
    //messageInput.addEventListener('keypress', handleEnterKey);

    /* messageForm.addEventListener('submit', function (e) {
        console.log('In messageform');
        e.preventDefault(); // Stoppa refresh

        userInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const submitEvent = new Event('submit', { bubbles: true });
                messageForm?.dispatchEvent(submitEvent);
            }
        });
    }); */
}
// client.ts
function handleSubmit(e: Event) {
    e.preventDefault();

    const username = userInput.value.trim();
    const message = messageInput.value.trim();

    if (!username) return;

    if (username && message) {
        if (!welcomeMessage.innerHTML) {
            welcomeMessage.innerHTML = `<h3>Välkommen ${username}</h3>`;
            userInput.disabled = true;
        }

        // Skapa spel när har användarnamn
        if (!gameRender && gameContainer) {
            console.debug('🪳 Skapar GameRender för spelare:', username);

            // Don't create ThreeScene here - GameRender will create it internally
            gameRender = new GameRender(gameContainer, username); // Remove threeScene parameter
            console.debug('GameRender skapad');

            // 1. Updatera poängtabell (varje runda)
            gameRender.setOnScoreUpdate((player: string, category: string, score: number) => {
                console.info('GameRender setOnScoreUpdate(player, category, score)');
                console.debug('🪳 Uppdatera lokal poängtabell');
                updatePlayerScore(player, category, score);

                console.debug('🪳 EMIT individuell runda till server för de andra spelarna');
                const roundScoreEvent: {
                    player: string;
                    category: string;
                    score: number;
                    round: number;
                } = {
                    player: player,
                    category: category,
                    score: score,
                    round: gameRender?.getGameState().round || 1,
                };

                console.info('EMIT --"updateScore"--> roundScoreEvent:', roundScoreEvent);
                socket.emit('updateScore', roundScoreEvent);
            });

            // 2. Final Dice --> (varje runda)
            gameRender.setOnFinalDice((gameState: GameState) => {
                console.debug('🪳 setOnFinalDice callback triggered');

                // Är vanlig runda, inte game over
                const turnResult: GameState = {
                    currentPlayer: gameState.currentPlayer,
                    dice: gameState.dice,
                    scores: gameState.scores,
                    rollsLeft: gameState.rollsLeft,
                    round: gameState.round,
                };

                console.debug('🪳 Sending turn result to server:', turnResult);
                socket.emit('turnResult', turnResult);
            });

            // 3. Final dice callback (VID SPELETS SLUT)
            gameRender.setOnGameComplete((finalResults: FinalGameResults) => {
                console.debug('🪳 CALLBACK spel är färdigt');
                console.debug('🪳 Skickar spelets slutresultat till servern:', finalResults);
                socket.emit('finalGameResults', finalResults);
            });

            // Lägg till pending players
            if (pendingPlayers) {
                console.debug('🪳 Lägg till pending players:', pendingPlayers);
                gameRender.updatePlayerList(pendingPlayers, pendingCurrentPlayer || username);
                pendingPlayers = null;
                pendingCurrentPlayer = null;
            } else {
                gameRender.updatePlayerList([username], username);
            }
        }

        const messageData: UserMessage = { username, message };
        socket.emit('chatMessage', messageData);
        messageInput.value = '';
    }
}

function addMessageToChat(msg: UserMessage) {
    console.log('trying to  add message to chat...');
    if (!messageContainer) return console.error('messageContainer missing');

    const newMessageEl = document.createElement('li');
    newMessageEl.innerHTML = `
            <div class="grid-grid-cols-2">
                <div id="username">${msg.username}</div>
                <div class="flex flex-shrink-0 border px-2 border-black rounded-md bg-blue-500" id="user-message">${msg.message}</div>
            </div>
        `;

    messageContainer.appendChild(newMessageEl);
}

// Varför behövdes inte denna längre?
// (window as any).toggleSidebar = toggleSidebar;

function showPlayers(players: string[], currentPlayer?: string) {
    console.debug('🪳 showPlayers(players)', players);

    //====== GameRender ======
    // Uppdatera spellistan i GameRender klassen om den finns
    if (gameRender) {
        console.info('Updatera spellistan i GameRender klassen om den finns');
        gameRender.updatePlayerList(players, currentPlayer);
    } else {
        console.debug('GameRender är inte initierad än, sparar spelarlistan för senare');
        pendingPlayers = players;
        pendingCurrentPlayer = currentPlayer || null;
    }

    //====== ScoreTable ======
    // Uppdatera poängtabellen
    if (!scoreTable) {
        console.error('Hittar inte scoreTable');
    }
    scoreTable?.updatePlayers(players);
}

function updatePlayerScore(player: string, category: string, score: number) {
    console.info('updatePlayerScore(player, category, score)');
    if (scoreTable) {
        scoreTable.updateScore(player, category, score);
    }
}
