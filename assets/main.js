/* ==========================================================================
   Nouvelles Galeries — Villeneuve-sur-Lot
   Comportements JS : nav, carrousel, formulaire mailto obfusqué, dataroom
   ========================================================================== */
(function () {
  'use strict';

  /* ----------------------- 1. NAV : scroll + burger ----------------------- */
  const nav = document.querySelector('.site-nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 50) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const burger = nav.querySelector('.site-nav__burger');
    if (burger) {
      burger.addEventListener('click', () => nav.classList.toggle('is-open'));
      nav.querySelectorAll('.site-nav__menu a').forEach((a) => {
        a.addEventListener('click', () => nav.classList.remove('is-open'));
      });
    }
  }

  /* ----------------------- 2. CARROUSEL HERO ------------------------------ */
  const hero = document.querySelector('[data-carousel]');
  if (hero) {
    const slides = Array.from(hero.querySelectorAll('.hero__slide'));
    const dotsWrap = hero.querySelector('.hero__dots');
    const captionEl = hero.querySelector('.hero__caption');
    let idx = 0;
    let timer = null;
    const INTERVAL = 6000;

    // Build dots
    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.className = 'hero__dot' + (i === 0 ? ' is-active' : '');
      b.setAttribute('aria-label', `Aller au slide ${i + 1}`);
      b.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(b);
      return b;
    });

    function setCaption(i) {
      if (!captionEl) return;
      const c = slides[i].getAttribute('data-caption') || '';
      if (c) {
        captionEl.textContent = c;
        captionEl.classList.add('is-visible');
      } else {
        captionEl.classList.remove('is-visible');
      }
    }

    function go(n, fromUser) {
      slides[idx].classList.remove('is-active');
      dots[idx].classList.remove('is-active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      dots[idx].classList.add('is-active');
      setCaption(idx);
      if (fromUser) restart();
    }

    function next() { go(idx + 1); }
    function prev() { go(idx - 1, true); }
    function start() { timer = setInterval(next, INTERVAL); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    const btnPrev = hero.querySelector('.hero__nav--prev');
    const btnNext = hero.querySelector('.hero__nav--next');
    if (btnPrev) btnPrev.addEventListener('click', prev);
    if (btnNext) btnNext.addEventListener('click', () => go(idx + 1, true));

    // Pause on hover
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);

    // Touch swipe
    let touchX = null;
    hero.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
      touchX = null;
    });

    setCaption(0);
    start();
  }

  /* ----------------------- 3. REVEAL ON SCROLL ---------------------------- */
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ----------------------- 4. LIGHTBOX GALERIE --------------------------- */
  const galleryImgs = document.querySelectorAll('.gallery__item img');
  if (galleryImgs.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox__close" aria-label="Fermer">×</button><img alt="">';
    document.body.appendChild(lb);
    const lbImg = lb.querySelector('img');
    const close = () => lb.classList.remove('is-open');
    lb.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    galleryImgs.forEach((img) => {
      img.parentElement.addEventListener('click', (e) => {
        e.preventDefault();
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt || '';
        lb.classList.add('is-open');
      });
    });
  }

  /* ----------------------- 5. FORMULAIRE CONTACT (mailto obfusqué) -------- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.getElementById('contact-status');

      // Validation simple
      const required = contactForm.querySelectorAll('[required]');
      let ok = true;
      required.forEach((f) => {
        const empty = f.type === 'checkbox' ? !f.checked : !String(f.value || '').trim();
        if (empty) { f.classList.add('is-error'); ok = false; }
        else { f.classList.remove('is-error'); }
      });
      if (!ok) {
        if (status) status.textContent = 'Merci de compléter les champs obligatoires.';
        return;
      }

      const get = (n) => {
        const el = contactForm.querySelector(`[name="${n}"]`);
        return el ? String(el.value || '').trim() : '';
      };

      const prenom = get('prenom');
      const nom = get('nom');
      const societe = get('societe');
      const fonction = get('fonction');
      const email = get('email');
      const tel = get('tel');
      const profil = get('profil');
      const message = get('message');

      // Reconstruction de l'adresse au runtime (jamais présente dans le DOM)
      const u = 'benoit' + '.' + 'galy';
      const d = 'green' + '-' + 'acres' + '.' + 'com';
      const to = u + '@' + d;

      const subject = `[Vente Anciennes Nouvelles Galeries] Demande de ${prenom} ${nom} — ${societe}`;
      const lines = [
        `Bonjour,`,
        ``,
        `Je vous contacte au sujet de la vente de l'ensemble immobilier Cours Victor Hugo / Rue Bernard Palissy à Villeneuve-sur-Lot.`,
        ``,
        `— Identité —`,
        `Prénom : ${prenom}`,
        `Nom : ${nom}`,
        `Société / Structure : ${societe}`,
        fonction ? `Fonction : ${fonction}` : null,
        `Email professionnel : ${email}`,
        `Téléphone : ${tel}`,
        `Profil d'acquéreur : ${profil}`,
        ``,
        `— Message —`,
        message,
        ``,
        `— Engagement —`,
        `Je m'engage à traiter les informations échangées dans un cadre strictement confidentiel.`,
        ``,
        `Cordialement,`,
        `${prenom} ${nom}`,
      ].filter(Boolean);

      const body = lines.join('\r\n');

      const mailto = 'mailto:' + to
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      if (status) status.textContent = 'Ouverture de votre client mail…';
      // Petit délai pour laisser le navigateur peindre le message
      setTimeout(() => { window.location.href = mailto; }, 100);
    });

    // Clean error on input
    contactForm.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('input', () => el.classList.remove('is-error'));
      el.addEventListener('change', () => el.classList.remove('is-error'));
    });
  }

  /* ----------------------- 6. DATAROOM (mot de passe JS) ------------------ */
  const drForm = document.getElementById('dataroom-gate-form');
  if (drForm) {
    const PASS = 'nouvelles-galeries-2026';
    const STORAGE_KEY = 'ng_dr_unlocked_v1';
    const gate = document.querySelector('.dataroom-gate');
    const content = document.querySelector('.dataroom-content');
    const errEl = document.querySelector('.gate-error');

    const unlock = () => {
      if (gate) gate.classList.add('is-hidden');
      if (content) content.classList.add('is-open');
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    };

    // Auto-unlock si déjà passé dans la session
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') unlock();
    } catch (e) {}

    drForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = drForm.querySelector('input[name="pass"]');
      const val = (input && input.value || '').trim().toLowerCase();
      if (val === PASS) {
        if (errEl) errEl.textContent = '';
        unlock();
      } else {
        if (errEl) errEl.textContent = 'Mot de passe incorrect. Réessayez ou contactez le mandataire.';
        if (input) { input.classList.add('is-error'); input.focus(); }
      }
    });
  }

  /* ----------------------- 7. ANNÉE COURANTE DANS LE FOOTER --------------- */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
