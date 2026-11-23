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
      document.body.classList.toggle('menu-open', open);
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
    document.addEventListener('click', (event) => {
      if (!menu.hidden && !event.composedPath().includes(document.getElementById('main-header'))) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && !menu.hidden) setMenu(false);
    });
  }

  // ---- Sticky mobile call-to-action (appears after the first screen) -------------------------
  const sticky = document.getElementById('sticky-cta');
  if (sticky && !document.querySelector('main.is-contact')) {
    const toggle = () => {
      const footer = document.querySelector('.site-footer');
      const footerVisible = footer && footer.getBoundingClientRect().top < window.innerHeight;
      const active = window.scrollY > window.innerHeight * 0.9 && window.innerWidth <= 640 && !footerVisible;
      sticky.hidden = !active;
      sticky.classList.toggle('is-active', active);
      document.body.classList.toggle('has-sticky-cta', active);
    };
    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('resize', toggle);
    toggle();
  }

  // ---- Measurement: intent clicks, not confirmed inquiries -----------------------------------
  const track = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, { ...params, page_path: window.location.pathname, service: document.body.dataset.service || 'general', transport_type: 'beacon' }); };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.getAttribute('href'), window.location.href);
    let method;
    if (url.protocol === 'mailto:') method = 'email';
    if (url.protocol === 'tel:') method = 'phone';
    if (url.hostname === 'calendly.com') method = 'calendar';
    if (link.dataset?.contactMethod === 'form') method = 'form';
    if (url.origin === window.location.origin && url.pathname === '/contact/') {
      if (url.hash === '#book-call') method = 'calendar';
      if (url.hash === '#brief-form' || url.hash.endsWith('-brief')) method = 'brief';
    }
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
        if (typeof window.Calendly?.initInlineWidget !== 'function') { loaded = false; script.remove(); return; }
        calendly.querySelector('.calendly-fallback')?.remove();
        const widget = document.createElement('div');
        widget.className = 'calendly-inline-widget';
        // Calendly renders on white, so the brand color here is Teal Ink (the only teal that
        // passes AA on white) and the text color is Navy. Signal Teal would be unreadable.
        // The panel above already names the call, so Calendly's own header (logo, account name,
        // event title and duration) is hidden; that also keeps the calendar compact in a narrow column.
        widget.dataset.url = calendly.dataset.url + '?hide_gdpr_banner=1&hide_event_type_details=1&hide_landing_page_details=1&background_color=ffffff&text_color=071118&primary_color=007e7b';
        widget.style.minWidth = '0';
        widget.style.width = '100%';
        widget.style.height = '700px';
        calendly.appendChild(widget);
        window.Calendly?.initInlineWidget({ url: widget.dataset.url, parentElement: widget });
      };
      script.onerror = () => { loaded = false; script.remove(); };
      document.head.appendChild(script);
    };
    calendly.querySelector('[data-load-calendly]')?.addEventListener('click', load);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { load(); observer.disconnect(); } }, { rootMargin: '200px' });
      observer.observe(calendly);
    } else load();
    window.addEventListener('message', (event) => {
      const frame = calendly.querySelector('iframe');
      if (!frame || event.source !== frame.contentWindow || event.origin !== 'https://calendly.com') return;
      if (event.data?.event === 'calendly.event_scheduled') track('book_call', { method: 'calendar' });
      // Calendly reports the height its content needs (its layout changes with width and with each
      // booking step). Grow or shrink the frame to match so nothing is cut off inside the box.
      if (event.data?.event === 'calendly.page_height') {
        const height = parseInt(event.data.payload?.height, 10);
        if (height > 300 && height < 3000) {
          frame.parentElement.style.height = `${height}px`;
          frame.style.height = `${height}px`;
        }
      }
    });
  }

  const brief = document.getElementById('brief-form');
  if (brief) {
    const preview = document.getElementById('brief-preview');
    const status = document.getElementById('brief-status');
    const email = brief.dataset.email;
    const need = brief.elements.namedItem('need');
    const guides = document.getElementById('brief-guides');
    const groups = brief.querySelectorAll('fieldset[data-brief-fields]');
    const copyButton = brief.querySelector('[data-copy-brief]');
    copyButton.hidden = false;

    const updateFields = () => {
      const selected = need.selectedOptions[0];
      for (const group of groups) {
        const active = group.dataset.briefFields === selected.dataset.fields;
        group.hidden = !active;
        group.disabled = !active;
      }
      for (const guide of guides?.children ?? []) guide.classList.toggle('is-current', guide.id === selected.dataset.brief);
      if (status) status.textContent = '';
      if (preview) preview.classList.remove('is-visible');
    };
    const selectLinkedBrief = () => {
      const anchor = window.location.hash.slice(1);
      const option = Array.from(need.options).find((item) => item.dataset.brief === anchor);
      if (option) need.value = option.value;
      updateFields();
    };
    guides?.classList.add('is-enhanced');
    selectLinkedBrief();
    need.addEventListener('change', updateFields);
    window.addEventListener('hashchange', selectLinkedBrief);

    const compose = () => {
      const data = new FormData(brief);
      const lines = [];
      for (const [key, value] of data.entries()) {
        const label = brief.querySelector(`[name="${key}"]`)?.closest('label')?.querySelector('span')?.textContent || key;
        const answer = String(value).trim();
        if (answer) lines.push(`${label}: ${answer}`);
      }
      const need = (data.get('need') || 'Project').toString();
      const subject = `${need} inquiry for MV.tech Solutions`;
      const body = lines.join('\n\n') + '\n';
      return { subject, body, href: `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
    };
    const trackCompose = (method) => track('brief_compose', {
      method,
      brief_topic: need.selectedOptions[0].dataset.topic || need.selectedOptions[0].dataset.fields || 'general',
    });
    brief.addEventListener('submit', (event) => {
      event.preventDefault();
      const { href } = compose();
      trackCompose('email');
      window.location.href = href;
    });
    copyButton.addEventListener('click', async () => {
      const { subject, body } = compose();
      const text = `To: ${email}\nSubject: ${subject}\n\n${body}`;
      try {
        await navigator.clipboard.writeText(text);
        if (status) status.textContent = 'Brief copied. Paste it into an email to ' + email + '.';
        if (preview) preview.classList.remove('is-visible');
      }
      catch {
        if (preview) { preview.textContent = text; preview.classList.add('is-visible'); }
        if (status) status.textContent = 'Copy the draft below and paste it into your email.';
      }
      trackCompose('copy');
    });
    brief.addEventListener('input', () => {
      if (status) status.textContent = '';
      if (preview) preview.classList.remove('is-visible');
    });
  }
})();
