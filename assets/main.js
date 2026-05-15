// JMG IMMOB · site institutionnel — comportements
// Nav scroll state · smooth scroll · soumission formulaire vers Google Apps Script

(function () {
  'use strict';

  // ----- Nav scroll state ----------------------------------------
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ----- Smooth scroll avec offset pour nav fixe -----------------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ----- Soumission formulaire vers Google Apps Script ------------
  const form = document.getElementById('contact-form');
  if (form) {
    const status = document.getElementById('form-status');
    const submitBtn = document.getElementById('form-submit');
    const submitLabel = submitBtn ? submitBtn.querySelector('.btn-label') : null;

    const setStatus = (kind, html) => {
      if (!status) return;
      status.className = 'form-status form-status-' + kind;
      status.innerHTML = html;
      status.hidden = false;
    };
    const setBusy = (busy) => {
      if (!submitBtn) return;
      submitBtn.disabled = busy;
      if (submitLabel) submitLabel.textContent = busy ? 'Envoi en cours…' : 'Envoyer la demande';
    };

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Honeypot anti-spam
      const honey = form.querySelector('[name="_gotcha"]');
      if (honey && honey.value) return;

      const endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) return;

      setBusy(true);
      setStatus('info', 'Transmission de votre demande…');

      // Construire la payload depuis le formulaire
      const data = {};
      new FormData(form).forEach((v, k) => { data[k] = v; });
      data._timestamp = new Date().toISOString();

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });
        const json = await res.json().catch(() => ({}));
        if (json.success === 'true' || json.success === true || res.ok) {
          setStatus('success',
            "<strong>Demande transmise avec succès.</strong><br>" +
            "Vous recevrez sous 24 heures ouvrées un message du mandataire avec le lien sécurisé " +
            "d'accès à la DataRoom complète.");
          form.reset();
        } else {
          throw new Error(json.message || 'Réponse invalide');
        }
      } catch (err) {
        setStatus('error',
          "<strong>Erreur de transmission.</strong><br>" +
          "Le réseau a refusé l'envoi. Merci de réessayer dans quelques instants.");
      } finally {
        setBusy(false);
      }
    });
  }
})();
