export function initSidebarChat() {
    console.log('INIT Sidebar Chat');

    /*     const sidebarChatContainer = document.querySelector('#sidebar-chat-container') as HTMLElement; */
    const outsideChatBtn = document.querySelector('#outside-chat-btn') as HTMLButtonElement;
    const sidebarBtn = document.querySelector('#chat-toggle') as HTMLButtonElement;

    /* if (!sidebarChatContainer) console.error('sidebarCharContainer finns inte'); */
    if (!sidebarBtn || !outsideChatBtn) console.error('sidebarBtn eller outsideChatBtn finns inte');

    /* const handleMouseEnter = () => expandSidebar(sidebarChatContainer);
    const handleMouseLeave = () => collapseSidebar(sidebarChatContainer); */

    sidebarBtn.addEventListener('click', (e) => toggleChat(e));
    outsideChatBtn?.addEventListener('click', (e) => toggleChat(e));
}

// Visa chatten och sen försvinn tills gömd igen
/* export function showChat(e: MouseEvent) {
    console.debug('🪳 showChat() and hide button');
    const btn = e.currentTarget as HTMLButtonElement;
    btn.addEventListener('click', toggle)
} */

export function toggleChat(e: MouseEvent) {
    console.debug('🪳 toggleChat()...');
    const btn = e.currentTarget as HTMLButtonElement;
    const sidebarContainer = document.querySelector('#sidebar-chat-container');

    if (!btn || !sidebarContainer) console.error('btn eller sidebarContainer saknas');

    console.debug('🪳 toggling hidden...');
    sidebarContainer?.classList.toggle('w-0');
    sidebarContainer?.classList.toggle('p-4');
    sidebarContainer?.classList.toggle('overflow-hidden');
    // sidebarContainer?.classList.toggle('w-full');
    // sidebarContainer?.classList.toggle('#hidden');
    /*  const isCollapsed = sidebarContainer?.classList.contains('w-0');
    if (isCollapsed) {
        sidebarContainer?.classList.remove('w-0', 'overflow-hidden');
        sidebarContainer?.classList.add('w-80');
    } else {
        sidebarContainer?.classList.remove('w-80');
        sidebarContainer?.classList.add('w-0', 'overflow-hidden');
    } */

    // ← trigger resize so canvas fills new space
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 300); // match your transition duration
}
/*
export function expandSidebar(sidebarChatContainer: HTMLElement): void {
    console.debug('🪳 expandSidebar()');

    sidebarChatContainer.classList.remove('w-24');
    sidebarChatContainer.classList.add('w-1/3');
    sidebarChatContainer.classList.add('h-screen');
    sidebarChatContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    `;
}
export function collapseSidebar(sidebarChatContainer: HTMLElement): void {
    console.debug('🪳 collapseSidebar()');

    sidebarChatContainer.classList.add('w-24');
    sidebarChatContainer.classList.remove('w-1/3');
    sidebarChatContainer.classList.remove('h-screen');
    sidebarChatContainer.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
        </svg>
    `;
} */

// export function toggleSidebar(sidebarChatContainer: HTMLElement): void {
// console.debug('🪳 toggleSidebar()');

/*
    1. Small chat (w-24)
    2. HOVER --> w-24 h-screen
*/

// w-14 is start-size
/*   if (sidebarChatContainer.classList.contains('w-24')) {
        console.debug('🪳 IS w-24');
        // Expand
        sidebarChatContainer.classList.add('w-1/2');

        sidebarChatContainer.classList.remove('w-24');
        sidebarChatContainer.classList.remove('h-screen');
    } else {
        // Collapse
        sidebarChatContainer.classList.remove('w-1/2');

        sidebarChatContainer.classList.add('w-24');
        sidebarChatContainer.classList.add('h-screen');
    }
}
 */
