let sidebar;

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

    if (!btn || !sidebarContainer) return console.error('btn eller sidebarContainer saknas');

    console.debug('🪳 toggling hidden...');
    const isOpen = sidebarContainer.classList.contains('w-64');
    if (isOpen) {
        sidebarContainer.classList.remove('w-64');
        sidebarContainer.classList.add('w-0', 'overflow-hidden');
    } else {
        sidebarContainer.classList.remove('w-0', 'overflow-hidden');
        sidebarContainer.classList.add('w-64');
    }

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
