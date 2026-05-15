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

  /* ----------------------- 5. FORMULAIRE CONTACT -------------------------- *
   * Supabase d'abord (INSERT dataroom_contact_requests), fallback mailto:.
   * Le module Supabase est chargé sur la page via <script type="module">
   * et expose window.__ngSupabase = { supabase, logAction, ... }.
   * Si le module n'a pas pu se charger (offline), on retombe sur le mailto.
   * ----------------------------------------------------------------------- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('contact-status');
      if (status) { status.classList.remove('is-error', 'is-ok'); status.textContent = ''; }

      // Validation simple
      const required = contactForm.querySelectorAll('[required]');
      let ok = true;
      required.forEach((f) => {
        const empty = f.type === 'checkbox' ? !f.checked : !String(f.value || '').trim();
        if (empty) { f.classList.add('is-error'); ok = false; }
        else { f.classList.remove('is-error'); }
      });
      if (!ok) {
        if (status) {
          status.textContent = 'Merci de compléter les champs obligatoires.';
          status.classList.add('is-error');
        }
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
      const nda = !!contactForm.querySelector('[name="nda"]:checked');

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (status) {
        status.classList.add('is-ok');
        status.textContent = 'Envoi en cours…';
      }

      // ---- 1) Tentative INSERT Supabase ------------------------------
      let savedToDb = false;
      try {
        if (window.__ngSupabase && window.__ngSupabase.submitContactRequest) {
          savedToDb = await window.__ngSupabase.submitContactRequest({
            first_name: prenom,
            last_name: nom,
            company: societe,
            job_title: fonction || null,
            email,
            phone: tel,
            acquirer_profile: profil,
            message,
            confidentiality_accepted: nda,
            user_agent: navigator.userAgent || null,
            referrer: document.referrer || null,
          });
        }
      } catch (_e) {
        savedToDb = false;
      }

      if (savedToDb) {
        // Succès : message in-page, on cache le formulaire
        showContactConfirm();
        return;
      }

      // ---- 2) Fallback mailto: obfusqué -----------------------------
      if (status) {
        status.classList.remove('is-ok');
        status.textContent = 'Envoi par mail en cours (votre client mail va s\'ouvrir)…';
      }
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
      setTimeout(() => { window.location.href = mailto; }, 120);

      if (submitBtn) submitBtn.disabled = false;
    });

    function showContactConfirm() {
      const wrapper = contactForm.parentElement;
      if (!wrapper) return;
      contactForm.style.display = 'none';
      const div = document.createElement('div');
      div.className = 'contact-confirm';
      div.innerHTML = `
        <span class="eyebrow">Demande transmise</span>
        <h3>Votre demande a bien été transmise.</h3>
        <p>Le mandataire reviendra vers vous sous 24h ouvrées avec le lien d'accès à la DataRoom. Vous recevrez un email contenant un lien sécurisé qui vous permettra de consulter l'intégralité des pièces du dossier.</p>
      `;
      wrapper.appendChild(div);
      div.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Clean error on input
    contactForm.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('input', () => el.classList.remove('is-error'));
      el.addEventListener('change', () => el.classList.remove('is-error'));
    });
  }

  /* ----------------------- 6. DATAROOM ------------------------------------ */
  /* L'auth DataRoom est désormais gérée par assets/dataroom-auth.js
     (Supabase magic link). Aucune logique mot-de-passe ici. */

  /* ----------------------- 7. ANNÉE COURANTE DANS LE FOOTER --------------- */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
