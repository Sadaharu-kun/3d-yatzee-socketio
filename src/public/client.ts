import type { UserMessage, PlayerState, GameState } from '../types.js';

import { io } from 'socket.io-client'; // Vite rpoxy
import { initSidebarChat } from './utils/sidebarChat.ts';
import { GameRender } from './yatzeeGame/gameRenderer.ts';
import { ThreeScene } from './utils/threejsDice.ts';
import { YatzeeGame } from './yatzeeGame/yatzeeGame.ts';
// import type { Socket } from 'socket.io'; sen utan vite?

// Best practice är att samla DOM element överst
let socket: ReturnType<typeof io>;
let messageForm: HTMLFormElement;
let userInput: HTMLInputElement;
let messageInput: HTMLInputElement;
let welcomeMessage: HTMLElement;
let messageContainer: HTMLElement;

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
    const gameContainer = document.querySelector('#yatzee-game-container') as HTMLElement;
    const sidebarChatContainer = document.querySelector('#sidebar-chat-container') as HTMLElement;
    const threeContainer = document.querySelector('#three-container') as HTMLElement;

    // 2. Chat
    messageForm = document.querySelector('#message-form') as HTMLFormElement;
    userInput = document.querySelector('#user-input') as HTMLInputElement;
    messageInput = document.querySelector('#message-input') as HTMLInputElement;
    welcomeMessage = document.querySelector('#welcome-message') as HTMLInputElement;
    messageContainer = document.querySelector('#message-container') as HTMLElement;

    // Container validation
    if (!gameContainer || !sidebarChatContainer || !threeContainer) {
        console.error('game, sidebar eller three container saknas');
        return; // När ha return och inte? --> return stoppar koden om error
    }

    // Chat validation
    if (!messageForm || !userInput || !messageInput || !welcomeMessage || !messageContainer) {
        console.error('messageForm, userInput, messageInput, welcomeMessage, messageContainer saknas');
        return;
    }

    initSidebarChat();
    // Scene först, sen skicka till GameRender
    const threeScene = new ThreeScene(threeContainer);

    const gameRender = new GameRender(gameContainer, 'Spelare 1', threeScene);
    gameRender.setOnFinalDice((gameState: GameState) => {
        console.debug('🪳 setOnFinalFide callback triggered');

        const playerState: GameState = {
            currentPlayer: gameState.currentPlayer,
            dice: gameState.dice,
            scores: gameState.scores,
            rollsLeft: gameState.rollsLeft,
        };
        console.debug('🪳 playerState:', playerState);
        console.warn('SOCKET EMIT --> playerState');
        socket.emit('finalKeptDice', playerState);
    });

    initChat();
    // initFinalDiceSocket();

    console.log('initialised sidebar, chat, game and three');
    console.log('threeScene:', threeScene);
    console.log('gameRender:', gameRender);
});

/* function initFinalDiceSocket(): void {
    console.log('initFinalDiceSocket()');

    socket = io();

    finalDiceBtn = document.querySelector('#final-kept-dice-btn') as HTMLButtonElement;
    if (!finalDiceBtn) console.error('finalDiceBtn finns inte');
    console.log('finalDiceBtn:', finalDiceBtn);

    // finalDiceBtn.addEventListener('click', (e: MouseEvent) => handleFinalDice);
    finalDiceBtn.addEventListener('click', handleFinalDice);
} */

/* function handleFinalDice(e: MouseEvent): void {
    console.debug('🪳 CLICKED handleFinalDiceBtn'); */

/* const messageData: UserMessage = { username, message };
    socket.emit('chatMessage', messageData) */

// const gameState = GameRender.getGameState()
// const gameState: GameState = gameState.getGameState();
/*  const playerState: PlayerState = {
            player: gameState.currentPlayer,
            dice: gameState.dice,
            scores: gameState.scores,
            rollsLeft: gameState.rollsLeft
        } */
/* const playerState: PlayerState = {
        playerName: gameState.currentPlayer,
        scores: gameState.scores,
    };
    console.debug('🪳 gameState:', gameState);
    console.debug('🪳 playerState:', playerState); */
// }

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

    socket.on('updatePlayers', (players: string[]) => {
        console.debug('🪳 Uppkopplade spelare:', players);
        showPlayers(players);
    });

    messageForm.addEventListener('submit', handleSubmit);
    userInput.addEventListener('keypress', handleEnterKey);
    messageInput.addEventListener('keypress', handleEnterKey);

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

function handleSubmit(e: Event) {
    e.preventDefault();

    const username = userInput.value.trim() || 'Namn saknas';
    const message = messageInput.value.trim() || 'Meddelande saknas';
    // username = userInput.value.trim().length > 0 ? userInput.value.trim() : 'Namn saknas';
    // message = messageInput.value.trim().length > 0 ? messageInput.value.trim() : 'Meddelande saknas';

    if (username && message) {
        welcomeMessage.innerHTML = `<h3>Välkommen ${username}</h3>`;
        userInput.disabled = true; // lås efter angivet namn

        const messageData: UserMessage = { username, message };
        socket.emit('chatMessage', messageData);

        console.debug('🪳 Tömmer meddelanderuta');
        messageInput.value = '';
    }
}

function handleEnterKey(e: KeyboardEvent) {
    console.debug('🪳 handleEnterKey()...');
    if (e.key === 'Enter') {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit', { bubbles: true }));
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

// (window as any).toggleSidebar = toggleSidebar;

function showPlayers(players: string[]) {
    console.debug('🪳 showPlayers(players)');
    const playerList = document.querySelector('#player-list') as HTMLElement;
    const playerCount = document.querySelector('#player-count') as HTMLElement;

    if (!playerList) console.error('playerList hittades inte');

    console.log('Uppdaterar player list');
    playerList.innerHTML = players.map((player) => `<li class="list-disc">${player}</li>`).join('');

    console.log('Uppdaterar playerCount');
    if (playerCount) playerCount.textContent = String(players.length);
}
