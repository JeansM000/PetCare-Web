(() => {
    const renderIcons = () => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    const start = () => {
        const observer = new MutationObserver(() => {
            window.requestAnimationFrame(renderIcons);
        });

        observer.observe(document.body, { childList: true, subtree: true });
        renderIcons();
    };

    if (document.body) {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    }
})();
