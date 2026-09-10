(() => {
    window.lucide?.createIcons();

    const normalizePath = (value) => new URL(value, window.location.origin).pathname
        .replace(/index\.html$/, '').replace(/\.html$/, '/').replace(/\/+$/, '') || '/';
    const currentPath = normalizePath(window.location.pathname);
    document.querySelectorAll('.site-nav-link[href]').forEach((link) => {
        const path = normalizePath(link.getAttribute('href'));
        if (path === currentPath || (path === '/services' && currentPath.startsWith('/services/'))) {
            link.setAttribute('aria-current', path === currentPath ? 'page' : 'location');
            link.classList.add('bg-white/10', 'text-white', 'font-semibold');
            link.classList.remove('text-slate-200', 'text-slate-300');
        }
    });

    const header = document.getElementById('main-header');
    const button = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const updateHeader = () => {
        const solid = window.scrollY > 20 || (menu && !menu.classList.contains('hidden'));
        ['bg-slate-950/85', 'backdrop-blur-xl', 'border-b', 'border-slate-800/80'].forEach((name) => {
            header?.classList.toggle(name, Boolean(solid));
        });
        header?.classList.toggle('bg-transparent', !solid);
    };
    window.addEventListener('scroll', updateHeader, { passive: true });

    if (button && menu) {
        const setMenu = (open) => {
            menu.classList.toggle('hidden', !open);
            button.setAttribute('aria-expanded', String(open));
            button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            // Lucide replaces its placeholder, so create a fresh one on each toggle.
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', open ? 'x' : 'menu');
            icon.setAttribute('class', 'w-5 h-5');
            button.replaceChildren(icon);
            window.lucide?.createIcons();
            updateHeader();
        };
        button.addEventListener('click', () => setMenu(menu.classList.contains('hidden')));
        menu.addEventListener('click', (event) => {
            if (event.target.closest('a')) setMenu(false);
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !menu.classList.contains('hidden')) {
                setMenu(false);
                button.focus();
            }
        });
    }
    updateHeader();

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || typeof window.gtag !== 'function') return;
        const url = new URL(link.getAttribute('href'), window.location.origin);
        let method;
        if (url.protocol === 'mailto:') method = 'email';
        if (url.hostname === 'calendly.com' && url.pathname.startsWith('/contact-mvtech/')) method = 'calendar';
        if (method) {
            // A contact click is intent; it does not confirm an email or booking.
            window.gtag('event', 'contact_intent', {
                method,
                service: document.body.dataset.service || 'general',
                page_path: window.location.pathname,
                transport_type: 'beacon',
            });
        }
    });
})();
