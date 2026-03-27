addEventListener('DOMContentLoaded', async () => {
    console.log('INIT Sidebar Chat');

    const sidebarChatContainer = document.querySelector('#sidebar-chat-container') as HTMLElement;

    if (!sidebarChatContainer) console.error('sidebarCharContainer finns inte');

    const handleMouseEnter = () => expandSidebar(sidebarChatContainer);
    const handleMouseLeave = () => collapseSidebar(sidebarChatContainer);

    sidebarChatContainer.addEventListener('mouseenter', handleMouseEnter);
    sidebarChatContainer.addEventListener('mouseleave', handleMouseLeave);
});

function expandSidebar(sidebarChatContainer: HTMLElement): void {
    console.debug('🪳 expandSidebar()');

    sidebarChatContainer.classList.remove('w-24');
    sidebarChatContainer.classList.add('w-1/3');
    sidebarChatContainer.classList.add('h-screen');
}
function collapseSidebar(sidebarChatContainer: HTMLElement): void {
    console.debug('🪳 collapseSidebar()');

    sidebarChatContainer.classList.add('w-24');
    sidebarChatContainer.classList.remove('w-1/3');
    sidebarChatContainer.classList.remove('h-screen');
}

function toggleSidebar(sidebarChatContainer: HTMLElement): void {
    console.debug('🪳 toggleSidebar()');

    /*
    1. Small chat (w-24)
    2. HOVER --> w-24 h-screen
*/

    // w-14 is start-size
    if (sidebarChatContainer.classList.contains('w-24')) {
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

(window as any).toggleSidebar = toggleSidebar;
