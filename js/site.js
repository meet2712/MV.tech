(() => {
  window.lucide?.createIcons();

  // ---- Navigation state -------------------------------------------------------------------
  const normalizePath = (value) => new URL(value, window.location.origin).pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll('.site-nav-link[href]').forEach((link) => {
    const path = normalizePath(link.getAttribute('href'));
    const section = path !== '/' && currentPath.startsWith(path + '/');
    if (path === currentPath || section) link.setAttribute('aria-current', path === currentPath ? 'page' : 'location');
  });

  const button = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (button && menu) {
    const setMenu = (open) => {
      menu.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      const icon = document.createElement('i');
      icon.setAttribute('data-lucide', open ? 'x' : 'menu');
      icon.setAttribute('aria-hidden', 'true');
      button.replaceChildren(icon);
      window.lucide?.createIcons();
    };
    button.addEventListener('click', () => setMenu(menu.hidden));
    menu.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) { setMenu(false); button.focus(); }
    });
  }

  // ---- Sticky mobile call-to-action (appears after the first screen) -------------------------
  const sticky = document.getElementById('sticky-cta');
  if (sticky && !document.querySelector('main.is-contact')) {
    const toggle = () => {
      const active = window.scrollY > window.innerHeight * 0.9 && window.innerWidth <= 640;
      sticky.hidden = !active;
      sticky.classList.toggle('is-active', active);
      document.body.classList.toggle('has-sticky-cta', active);
    };
    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('resize', toggle);
    toggle();
  }

  // ---- Measurement: intent clicks, not confirmed enquiries -----------------------------------
  const track = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, { ...params, page_path: window.location.pathname, service: document.body.dataset.service || 'general', transport_type: 'beacon' }); };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.getAttribute('href'), window.location.origin);
    let method;
    if (url.protocol === 'mailto:') method = 'email';
    if (url.hostname === 'calendly.com') method = 'calendar';
    if (method) track('contact_intent', { method });
  });

  // ---- Contact page: lazy Calendly embed + booking event + email brief composer --------------
  const calendly = document.getElementById('calendly-embed');
  if (calendly) {
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        calendly.querySelector('.calendly-fallback')?.remove();
        const widget = document.createElement('div');
        widget.className = 'calendly-inline-widget';
        // Calendly renders on white, so the brand colour here is Teal Ink (the only teal that
        // passes AA on white) and the text colour is Navy. Signal Teal would be unreadable.
        widget.dataset.url = calendly.dataset.url + '?hide_gdpr_banner=1&background_color=ffffff&text_color=071118&primary_color=007e7b';
        widget.style.minWidth = '320px';
        widget.style.height = '660px';
        calendly.appendChild(widget);
        window.Calendly?.initInlineWidget({ url: widget.dataset.url, parentElement: widget });
      };
      script.onerror = () => { loaded = false; };
      document.head.appendChild(script);
    };
    calendly.querySelector('[data-load-calendly]')?.addEventListener('click', load);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { load(); observer.disconnect(); } }, { rootMargin: '200px' });
      observer.observe(calendly);
    } else load();
    window.addEventListener('message', (event) => {
      if (event.origin === 'https://calendly.com' && event.data?.event === 'calendly.event_scheduled') track('book_call', { method: 'calendar' });
    });
  }

  const brief = document.getElementById('brief-form');
  if (brief) {
    const preview = document.getElementById('brief-preview');
    const email = brief.dataset.email;
    const compose = () => {
      const data = new FormData(brief);
      const lines = [];
      for (const [key, value] of data.entries()) {
        const label = brief.querySelector(`[name="${key}"]`)?.closest('label')?.querySelector('span')?.textContent || key;
        lines.push(`${label}: ${String(value).trim() || '-'}`);
      }
      const need = (data.get('need') || 'Project').toString();
      const subject = `${need} enquiry for MV.tech`;
      const body = lines.join('\n\n') + '\n';
      return { subject, body, href: `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
    };
    brief.addEventListener('submit', (event) => {
      event.preventDefault();
      const { href } = compose();
      track('brief_compose', { method: 'email' });
      window.location.href = href;
    });
    brief.querySelector('[data-copy-brief]')?.addEventListener('click', async (btn) => {
      const { subject, body } = compose();
      const text = `To: ${email}\nSubject: ${subject}\n\n${body}`;
      try { await navigator.clipboard.writeText(text); btn.currentTarget.textContent = 'Copied — paste it into your email'; }
      catch { if (preview) { preview.textContent = text; preview.classList.add('is-visible'); } }
      track('brief_compose', { method: 'copy' });
    });
  }
})();
