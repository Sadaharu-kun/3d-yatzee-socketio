import { io } from 'socket.io-client'; // Vite rpoxy
import type { UserMessage } from '../types.js';
import { GameRender } from './yatzeeGame/gameRenderer.ts';
import { initSidebarChat, toggleSidebar } from './utils/sidebarChat.ts';

// [ ] 1. Game Container
// [ ] 2. Chat
addEventListener('DOMContentLoaded', () => {
    initSidebarChat();

    // 1. Game Container
    const gameContainer = document.querySelector('#yatzee-game-container') as HTMLElement;
    if (!gameContainer) {
        console.error('game container saknas');
        return; // När ha return och inte?
    }

    new GameRender(gameContainer, 'Spelare 1');

    // 2. Chat
    const socket = io();

    const messageForm = document.querySelector('#message-form') as HTMLFormElement;
    const userInput = document.querySelector('#user-input') as HTMLInputElement;
    const messageInput = document.querySelector('#message-input') as HTMLInputElement;
    const welcomeMessage = document.querySelector('#welcome-message') as HTMLInputElement;
    const messageContainer = document.querySelector('#message-container') as HTMLElement;

    let username: string;
    let message: string;

    const sidebarChatContainer = document.querySelector('#sidebar-chat-container') as HTMLElement;
    if (!sidebarChatContainer) {
        console.error('Chat container saknas!');
        return;
    }

    if (!messageForm || !userInput || !messageInput || !welcomeMessage)
        console.error('messageForm, userInput, messageInput eller welcomeMessage finns inte');

    messageForm.addEventListener('submit', function (e) {
        console.log('In messageform');
        e.preventDefault(); // Stoppa refresh

        username = userInput.value.trim().length > 0 ? userInput.value.trim() : 'Namn saknas';
        message = messageInput.value.trim().length > 0 ? messageInput.value.trim() : 'Meddelande saknas';

        /* const greetUser = (username: string): void => {
        console.log('greetUser()');
        welcomeMessage.innerHTML = `<h3>Välkommen ${username}!</h3>`;
        }(); */

        if (username && message) {
            welcomeMessage.innerHTML = `<h3>Välkommen ${username}!</h3>`;

            const messageData: UserMessage = { username, message };
            console.log('Emitting:', messageData);
            socket.emit('chatMessage', messageData);
            messageInput.value = '';
        } else {
            console.error('Användarnamn eller meddelande saknas');
        }

        /* document.getElementById('user').style.display = 'none'; */
        /* document.getElementById('message').style.display = 'block'; */
        /* console.debug('user set to none');
    console.debug('message set to block'); */

        userInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const submitEvent = new Event('submit', { bubbles: true });
                messageForm?.dispatchEvent(submitEvent);
            }
        });

        socket.on('newChatMessage', function (msg: UserMessage) {
            console.debug('🪳 socket.on newChatMessage');
            console.info('msg:', msg); // Object

            let newMessageEl = document.createElement('li');

            let newMessageInnerHTML = `
        <div id="username">${msg.username}</div>
        <div id="user-message">${msg.message}</div>
    `;
            newMessageEl.innerHTML = newMessageInnerHTML;

            if (!messageContainer) console.error('messageContainer hittas inte för att appendChild(item)');
            messageContainer?.appendChild(newMessageEl);
        });
    });
});

(window as any).toggleSidebar = toggleSidebar;
