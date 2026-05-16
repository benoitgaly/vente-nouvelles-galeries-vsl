/* ==========================================================================
   JMG IMMOB — Anciennes Nouvelles Galeries
   main.js : carrousel, lightbox, formulaire contact (Supabase)
   ========================================================================== */

(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------------------- 1. NAV mobile ----------------------------- */
  const burger = $('.nav__burger');
  const menu   = $('.nav__menu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        menu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------- 2. LIGHTBOX (init avant carrousel) -------- */
  const lightbox = $('#lightbox');
  let openLightbox = () => {}; // no-op par défaut
  let openLightboxWith = () => {}; // ouvre avec une liste de sources spécifique (galeries par bâtiment)
  let lbSources = [];

  if (lightbox) {
    const lbImg     = $('.lightbox__img', lightbox);
    const lbCounter = $('.lightbox__counter', lightbox);
    const lbCaption = $('.lightbox__caption', lightbox);
    const lbPrev    = $('.lightbox__btn--prev', lightbox);
    const lbNext    = $('.lightbox__btn--next', lightbox);
    const lbClose   = $('.lightbox__close', lightbox);
    let lbIdx = 0;
    let lbCurrent = null; // liste de sources en cours (carrousel principal ou galerie spécifique)

    function showLb(i) {
      const list = lbCurrent || lbSources;
      if (!list.length) return;
      lbIdx = ((i % list.length) + list.length) % list.length;
      const item = list[lbIdx];
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      if (lbCounter) lbCounter.textContent = (lbIdx + 1) + ' / ' + list.length;
      if (lbCaption) lbCaption.textContent = item.alt;
    }

    openLightbox = function (i) {
      lbCurrent = lbSources;
      showLb(i || 0);
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    openLightboxWith = function (sources, i) {
      if (!sources || !sources.length) return;
      lbCurrent = sources;
      showLb(i || 0);
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    if (lbPrev)  lbPrev.addEventListener('click', () => showLb(lbIdx - 1));
    if (lbNext)  lbNext.addEventListener('click', () => showLb(lbIdx + 1));
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape')      closeLightbox();
      else if (e.key === 'ArrowRight') showLb(lbIdx + 1);
      else if (e.key === 'ArrowLeft')  showLb(lbIdx - 1);
    });

    // swipe tactile
    let lbTouch = null;
    lightbox.addEventListener('touchstart', (e) => { lbTouch = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend',   (e) => {
      if (lbTouch == null) return;
      const dx = e.changedTouches[0].clientX - lbTouch;
      if (Math.abs(dx) > 40) showLb(lbIdx + (dx < 0 ? 1 : -1));
      lbTouch = null;
    });
  }

  /* ---------------------- 3. CARROUSEL ------------------------------ */
  const carousel = $('.carousel');
  if (carousel) {
    const track     = $('.carousel__track', carousel);
    const slides    = $$('.carousel__slide', carousel);
    const prevBtn   = $('.carousel__btn--prev', carousel);
    const nextBtn   = $('.carousel__btn--next', carousel);
    const dotsWrap  = $('.carousel__dots', carousel);
    const counter   = $('.carousel__counter', carousel);
    const expandBtn = $('.carousel__expand', carousel);
    const total = slides.length;
    let idx = 0;

    // collecte des sources pour la lightbox
    lbSources = slides.map((s) => {
      const img = s.querySelector('img');
      return {
        src: img ? (img.getAttribute('data-full') || img.getAttribute('src')) : '',
        alt: img ? (img.getAttribute('alt') || '') : '',
      };
    });

    // dots
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
        b.setAttribute('aria-label', 'Photo ' + (i + 1));
        b.addEventListener('click', () => go(i));
        dotsWrap.appendChild(b);
      });
    }
    const dots = $$('.carousel__dot', carousel);

    function update() {
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      if (counter) counter.textContent = (idx + 1) + ' / ' + total;
    }
    function go(i) {
      idx = ((i % total) + total) % total;
      update();
    }
    function nextSlide() { go(idx + 1); }
    function prevSlide() { go(idx - 1); }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // clavier (ignoré quand lightbox ouverte)
    document.addEventListener('keydown', (e) => {
      if (lightbox && lightbox.classList.contains('is-open')) return;
      // évite de capter les flèches dans les champs de formulaire
      const tag = (e.target && e.target.tagName) || '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      if (e.key === 'ArrowRight')      nextSlide();
      else if (e.key === 'ArrowLeft')  prevSlide();
    });

    // swipe
    let touchStart = null;
    track.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   (e) => {
      if (touchStart == null) return;
      const dx = e.changedTouches[0].clientX - touchStart;
      if (Math.abs(dx) > 40) (dx < 0 ? nextSlide : prevSlide)();
      touchStart = null;
    });

    // clic image -> lightbox
    slides.forEach((slide, i) => {
      const img = slide.querySelector('img');
      if (!img) return;
      img.addEventListener('click', () => openLightbox(i));
    });
    if (expandBtn) expandBtn.addEventListener('click', () => openLightbox(idx));

    update();
  }

  /* ---------------------- 3bis. GALERIES PAR BÂTIMENT --------------- */
  // Chaque .gallery-building contient ses propres .gallery-building__item
  // qui exposent data-src + data-alt. La lightbox est réutilisée, mais
  // navigue uniquement à l'intérieur de la galerie cliquée.
  $$('.gallery-building').forEach((gallery) => {
    const items = $$('.gallery-building__item', gallery);
    if (!items.length) return;
    const sources = items.map((it) => ({
      src: it.getAttribute('data-src') || (it.querySelector('img') && it.querySelector('img').getAttribute('src')) || '',
      alt: it.getAttribute('data-alt') || (it.querySelector('img') && it.querySelector('img').getAttribute('alt')) || '',
    }));
    items.forEach((it, i) => {
      it.addEventListener('click', () => openLightboxWith(sources, i));
    });
  });

  /* ---------------------- 4. FORMULAIRE CONTACT --------------------- */
  const form = $('#contact-form');
  if (form) {
    const msgEl     = $('#contact-msg');
    const submitBtn = form.querySelector('button[type="submit"]');

    function showMsg(text, type) {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.hidden = false;
      msgEl.classList.toggle('is-error', type === 'error');
    }
    function clearMsg() {
      if (!msgEl) return;
      msgEl.hidden = true;
      msgEl.textContent = '';
      msgEl.classList.remove('is-error');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMsg();

      const fd = new FormData(form);
      const payload = {
        first_name:        fd.get('first_name'),
        last_name:         fd.get('last_name'),
        company:           fd.get('company'),
        job_title:         fd.get('job_title'),
        email:             fd.get('email'),
        phone:             fd.get('phone'),
        acquirer_profile:  fd.get('acquirer_profile'),
        message:           fd.get('message'),
        confidentiality_accepted: !!fd.get('confidentiality_accepted'),
      };

      // validation basique
      if (!payload.first_name || !payload.last_name) {
        showMsg('Merci de renseigner votre nom et votre prénom.', 'error'); return;
      }
      if (!payload.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(payload.email))) {
        showMsg('Merci de renseigner un email valide.', 'error'); return;
      }
      if (!payload.confidentiality_accepted) {
        showMsg('Merci de cocher l\'engagement de confidentialité.', 'error'); return;
      }

      submitBtn.disabled = true;
      const originalLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner"></span> Envoi en cours…';

      try {
        // patiente jusqu'à 3 s que le module Supabase soit chargé
        const t0 = Date.now();
        while ((!window.__ngSupabase || !window.__ngSupabase.submitContactRequest) && Date.now() - t0 < 3000) {
          await new Promise((r) => setTimeout(r, 100));
        }
        if (!window.__ngSupabase || !window.__ngSupabase.submitContactRequest) {
          showMsg('Service indisponible. Merci de réessayer dans quelques minutes.', 'error');
          return;
        }
        const ok = await window.__ngSupabase.submitContactRequest(payload);
        if (ok) {
          form.reset();
          showMsg('Votre demande a bien été enregistrée. Un accusé de réception vient de vous être envoyé — pensez à vérifier votre dossier indésirables (spam) s\'il n\'apparaît pas dans la boîte de réception. Le mandataire reviendra vers vous sous 24 h ouvrées avec les accès à la DataRoom.', 'ok');
          if (msgEl) msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          showMsg('Votre demande n\'a pas pu être enregistrée. Merci de réessayer dans quelques minutes.', 'error');
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[contact]', err);
        showMsg('Une erreur est survenue. Merci de réessayer dans quelques minutes.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      }
    });
  }

  /* ---------------------- 5. année footer --------------------------- */
  const year = $('#footer-year');
  if (year) year.textContent = new Date().getFullYear();
})();
