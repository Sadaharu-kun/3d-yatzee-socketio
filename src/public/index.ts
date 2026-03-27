import { GameRender } from './yatzeeGame/gameRenderer.ts';

addEventListener('DOMContentLoaded', async () => {
    const sidebarChatContainer = document.querySelector('#sidebar-chat-container') as HTMLElement;
    const yatzeeGameContainer = document.querySelector('#yatzee-game-container') as HTMLElement;

    if (!sidebarChatContainer || !yatzeeGameContainer) {
        console.error('Container för spel eller chatt saknas!');
        return;
    }

    console.debug('🪳 new RenderGame instance');
    const game = new GameRender(yatzeeGameContainer, 'Spelare 1');
    console.info('instance success');
});
