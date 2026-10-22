/* =====================================================
   INVITATION SQUID GAME — Script principal
   ===================================================== */

/* ---------- CONFIGURATION ---------- */

/*
 * MODE 1 (recommandé) — GOOGLE FORM INTÉGRÉ :
 * L'invité reste sur l'invitation Squid Game ; le mini-formulaire
 * envoie les réponses directement dans votre Google Form, qui les
 * range dans Google Sheets (export Excel en un clic).
 *
 * 1) Créez le Google Form (questions : nom, adultes, ados, âges ados,
 *    enfants, âges enfants — voir README).
 * 2) « Obtenir un lien prérempli » -> l'URL contient &entry.123456=...
 *    Recopiez chaque identifiant ci-dessous.
 * 3) GOOGLE_FORM_ACTION = même URL avec /formResponse au lieu de /viewform.
 */
const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSfArb0CY6DdpXBs_o7eNSgxyYQ02YGg0kMA19NgpczB2_sedg/formResponse";
const GOOGLE_FORM_ENTRIES = {
  name: "entry.1759205426",    // « Votre nom »
  present: "entry.2047217881", // « Serez-vous présent(e) ? » (Oui/Non)
  adults: "entry.683937936",   // « Adultes » (18 ans et +)
  teens: "entry.564571259",    // « Ados (12 à 17 ans) »
  teensAges: "entry.686050080",// « ÂGE(S) DES ADOS »
  kids: "entry.130676979",     // « Enfants (moins de 12 ans) »
  kidsAges: "entry.1729234962",// « ÂGE(S) DES ENFANTS »
};
// Libellés exacts des options Oui/Non du Google Form (ne pas modifier).
const GOOGLE_FORM_YES = "Oui, je serai présent(e)";
const GOOGLE_FORM_NO = "Non, je ne pourrai pas venir";

/*
 * MODE 1bis — GOOGLE FORM SIMPLE (secours) :
 * Si vous préférez ne pas configurer les entry.xxxx, collez le lien
 * de partage du formulaire (ex. : "https://forms.gle/AbCdEfGh123") :
 * le bouton ouvrira alors le formulaire Google dans un nouvel onglet
 * (thème Google standard, pas le thème Squid Game).
 */
const GOOGLE_FORM_URL = "";

/*
 * MODE 2 — WHATSAPP (si les deux options Google sont vides) :
 * Numéro WhatsApp du destinataire (organisateur).
 * Format attendu : indicatif international SANS "+", espace ni tiret.
 * Exemple pour un mobile français : "33612345678"
 * (un numéro français saisi "06XXXXXXXX" est converti automatiquement en "33XXXXXXXX")
 *
 * Laisser vide ("") tant qu'aucun numéro n'est défini :
 * le bouton ouvrira alors WhatsApp avec le message prérempli
 * et le visiteur choisira lui-même le destinataire.
 */
const WHATSAPP_NUMBER = "33652168826";

/*
 * CODE D'INVITATION :
 * Seuls les invités qui connaissent ce code peuvent ouvrir l'enveloppe.
 * Insensible à la casse et aux espaces autour.
 * Laisser vide ("") pour désactiver la demande de code.
 * Note : protection légère — sur un site statique, le code reste lisible
 * dans le code source de la page.
 */
const INVITATION_CODE = "wrede5018";

/* Premières lignes du message WhatsApp (mode 2 uniquement ; le détail des
   participants est ajouté automatiquement d'après le formulaire). */
const RSVP_INTRO_YES =
  "Bonjour ! Je confirme ma présence à l'anniversaire de Franck (50 ans) et Andy (18 ans), le samedi 20 février 2027.";
const RSVP_INTRO_NO =
  "Bonjour ! Malheureusement, je ne pourrai pas venir à l'anniversaire de Franck (50 ans) et Andy (18 ans), le samedi 20 février 2027.";

/* ---------- FIN DE LA CONFIGURATION ---------- */

(function () {
  "use strict";

  const envelopeScene = document.getElementById("envelope-scene");
  const cardScene = document.getElementById("card-scene");
  const envelope = document.getElementById("envelope");
  const codeGate = document.getElementById("code-gate");
  const codeInput = document.getElementById("invite-code");
  const codeError = document.getElementById("code-error");
  const rsvpBtn = document.getElementById("rsvp-btn");
  const rsvpNote = document.getElementById("rsvp-note");
  const rsvpError = document.getElementById("rsvp-error");
  const rsvpSuccess = document.getElementById("rsvp-success");
  const rsvpModal = document.getElementById("rsvp-modal");
  const rsvpClose = document.getElementById("rsvp-close");
  const copyBtn = document.getElementById("copy-btn");
  const rsvpForm = document.querySelector(".rsvp-form");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Mini-formulaire (compteurs + champs d'âges) ---------- */

  const counts = { adults: 1, teens: 0, kids: 0 };
  const outputs = {
    adults: document.getElementById("count-adults"),
    teens: document.getElementById("count-teens"),
    kids: document.getElementById("count-kids"),
  };
  const nameInput = document.getElementById("guest-name");
  const teensAgesField = document.getElementById("teens-ages-field");
  const kidsAgesField = document.getElementById("kids-ages-field");
  const teensAgesInput = document.getElementById("teens-ages");
  const kidsAgesInput = document.getElementById("kids-ages");

  function totalGuests() {
    return counts.adults + counts.teens + counts.kids;
  }

  /* Présence Oui/Non (question « Serez-vous présent(e) ? » du Google Form) */
  const rsvpDetails = document.getElementById("rsvp-details");
  let present = true;
  let onPresenceChange = null;
  document.querySelectorAll(".presence-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      present = btn.getAttribute("data-presence") === "yes";
      document.querySelectorAll(".presence-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      if (rsvpDetails) rsvpDetails.hidden = !present;
      rsvpError.hidden = true;
      if (onPresenceChange) onPresenceChange();
    });
  });

  document.querySelectorAll(".stepper button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const key = btn.getAttribute("data-count");
      const step = parseInt(btn.getAttribute("data-step"), 10);
      counts[key] = Math.max(0, counts[key] + step);
      outputs[key].textContent = counts[key];
      teensAgesField.hidden = counts.teens === 0;
      kidsAgesField.hidden = counts.kids === 0;
      rsvpError.hidden = true;
    });
  });

  /* Valeurs du formulaire prêtes à envoyer */
  function formValues() {
    return {
      name: nameInput.value.trim(),
      adults: String(counts.adults),
      teens: String(counts.teens),
      teensAges: teensAgesInput.value.trim(),
      kids: String(counts.kids),
      kidsAges: kidsAgesInput.value.trim(),
    };
  }

  /* ---------- Choix du mode RSVP ---------- */

  const formAction = GOOGLE_FORM_ACTION.trim();
  const formUrl = GOOGLE_FORM_URL.trim();

  /* Envoie les réponses au Google Form.
     1) fetch POST "no-cors" : la requête part, la réponse est opaque
        (illisible) — c'est normal, l'envoi est bien enregistré.
     2) Secours : soumission dans une iframe cachée. */
  function googleParams(payload) {
    const p = new URLSearchParams();
    Object.keys(GOOGLE_FORM_ENTRIES).forEach(function (key) {
      const entryId = GOOGLE_FORM_ENTRIES[key].trim();
      if (entryId) p.append(entryId, payload[key] || "");
    });
    const presentEntry = GOOGLE_FORM_ENTRIES.present.trim();
    if (presentEntry) p.append(presentEntry + "_sentinel", "");
    p.append("fvv", "1");
    p.append("pageHistory", "0,1");
    return p;
  }

  function submitToGoogle(payload) {
    const params = googleParams(payload);
    if (window.fetch && window.URLSearchParams) {
      fetch(formAction, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }).catch(function () {
        iframeFallback(params);
      });
    } else {
      iframeFallback(params);
    }
  }

  function iframeFallback(params) {
    const iframe = document.createElement("iframe");
    iframe.name = "gform-target";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = formAction;
    form.target = "gform-target";
    form.style.display = "none";
    params.forEach(function (value, name) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  if (formAction) {
    /* ===== MODE 1 : Google Form intégré =====
       Envoi silencieux vers Google (iframe cachée) : l'invité
       reste sur l'invitation, thème Squid Game conservé. */
    copyBtn.hidden = true;

    rsvpBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const v = formValues();
      if (!v.name) {
        rsvpError.textContent = "Merci d'indiquer votre nom.";
        rsvpError.hidden = false;
        return;
      }
      if (present && totalGuests() === 0) {
        rsvpError.textContent = "Merci d'indiquer au moins une personne.";
        rsvpError.hidden = false;
        return;
      }
      const payload = {
        name: v.name,
        present: present ? GOOGLE_FORM_YES : GOOGLE_FORM_NO,
        adults: present ? v.adults : "0",
        teens: present ? String(counts.teens) : "0",
        kids: present ? String(counts.kids) : "0",
        teensAges: present ? v.teensAges : "",
        kidsAges: present ? v.kidsAges : "",
      };
      submitToGoogle(payload);

      // Popup de confirmation au centre de l'écran
      rsvpModal.hidden = false;
      rsvpClose.focus();
    });

    function closeModal() {
      rsvpModal.hidden = true;
      // État final : formulaire masqué, confirmation affichée sur la carte
      rsvpForm.hidden = true;
      (rsvpBtn.closest(".shooter-row") || rsvpBtn).hidden = true;
      rsvpNote.hidden = true;
      rsvpSuccess.hidden = false;
      rsvpSuccess.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    }
    rsvpClose.addEventListener("click", closeModal);
    rsvpModal.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !rsvpModal.hidden) closeModal();
    });
  } else if (formUrl) {
    /* ===== MODE 1bis : lien Google Form simple ===== */
    rsvpForm.hidden = true;
    rsvpError.hidden = true;
    copyBtn.hidden = true;
    rsvpNote.textContent =
      "Le bouton ouvrira un court formulaire Google pour confirmer vos présences.";
    rsvpNote.hidden = false;
    rsvpBtn.href = formUrl;
  } else {
    /* ===== MODE 2 : WhatsApp ===== */

    /* Normalisation du numéro */
    let number = WHATSAPP_NUMBER.replace(/\D/g, "");
    if (number.indexOf("00") === 0) number = number.slice(2);
    // Numéro français saisi "0XXXXXXXXX" -> "33XXXXXXXXX"
    if (number.charAt(0) === "0" && number.length === 10) {
      number = "33" + number.slice(1);
    }

    /* Message WhatsApp structuré (lisible ET facile à ressaisir
       dans la page de statistiques reponses.html). */
    function buildMessage() {
      const v = formValues();
      const name = v.name || "—";
      if (!present) {
        return [RSVP_INTRO_NO, "Nom : " + name].join("\n");
      }
      return [
        RSVP_INTRO_YES,
        "Nom : " + name,
        "Adultes : " + v.adults,
        "Ados : " + v.teens + (counts.teens > 0 && v.teensAges ? " (âges : " + v.teensAges + ")" : ""),
        "Enfants : " + v.kids + (counts.kids > 0 && v.kidsAges ? " (âges : " + v.kidsAges + ")" : ""),
      ].join("\n");
    }

    function updateRsvpLink() {
      const encoded = encodeURIComponent(buildMessage());
      rsvpBtn.href =
        number.length > 0
          ? "https://wa.me/" + number + "?text=" + encoded
          : "https://api.whatsapp.com/send?text=" + encoded;
    }

    document.querySelectorAll(".stepper button").forEach(function (btn) {
      btn.addEventListener("click", updateRsvpLink);
    });
    [nameInput, teensAgesInput, kidsAgesInput].forEach(function (input) {
      input.addEventListener("input", updateRsvpLink);
    });
    onPresenceChange = updateRsvpLink;

    if (number.length === 0) {
      rsvpNote.hidden = false;
    }

    rsvpBtn.addEventListener("click", function (e) {
      if (present && totalGuests() === 0) {
        e.preventDefault();
        rsvpError.textContent = "Merci d'indiquer au moins une personne.";
        rsvpError.hidden = false;
        return;
      }
      updateRsvpLink();
    });

    updateRsvpLink();

    /* Bouton "Copier le message" (secours) */
    copyBtn.addEventListener("click", function () {
      const text = buildMessage();
      const done = function () {
        copyBtn.textContent = "Message copié !";
        copyBtn.classList.add("copied");
        setTimeout(function () {
          copyBtn.textContent = "Copier le message de confirmation";
          copyBtn.classList.remove("copied");
        }, 2500);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          fallbackCopy(text, done);
        });
      } else {
        fallbackCopy(text, done);
      }
    });

    function fallbackCopy(text, done) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        copyBtn.textContent = text;
      }
      document.body.removeChild(area);
    }
  }

  /* ---------- Garde tireur : coup de feu au clic ---------- */

  const guardShooter = document.querySelector(".guard-shooter");
  const gateGuard = document.querySelector(".gate-guard");
  let audioCtx = null;

  /* Contexte audio : créé/réveillé pendant un geste utilisateur
     (exigé par les navigateurs mobiles). */
  function ensureAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }
  document.addEventListener("pointerdown", function () { ensureAudio(); });

  /* Son de tir synthétisé (bruit blanc filtré, décroissance rapide) —
     aucun fichier audio nécessaire. */
  function gunshot() {
    const audioCtxLocal = ensureAudio();
    if (!audioCtxLocal) return;
    const audioCtx = audioCtxLocal;
    try {
      const dur = 0.3;
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4);
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const lp = audioCtx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      const g = audioCtx.createGain();
      g.gain.value = 0.85;
      src.connect(lp);
      lp.connect(g);
      g.connect(audioCtx.destination);
      src.start();
    } catch (e) { /* audio indisponible : on ignore */ }
  }

  /* Rafale de 5 coups (code d'invitation incorrect) */
  function gunburst() {
    for (let i = 0; i < 5; i++) {
      setTimeout(gunshot, i * 95);
    }
  }

  if (guardShooter && rsvpBtn) {
    rsvpBtn.addEventListener("click", function () {
      guardShooter.classList.remove("fire");
      void guardShooter.offsetWidth; // relance l'animation
      guardShooter.classList.add("fire");
      gunshot();
    });
  }

  /* ---------- Musique de fond (fichier musique.mp3 facultatif) ---------- */

  const bgm = document.getElementById("bgm");
  const musicToggle = document.getElementById("music-toggle");

  function musicPlay() {
    if (!bgm) return;
    bgm.play().then(function () {
      musicToggle.hidden = false;
      musicToggle.classList.add("on");
    }).catch(function () { /* fichier absent ou lecture refusée */ });
  }

  if (bgm && musicToggle) {
    bgm.addEventListener("error", function () { musicToggle.hidden = true; });
    bgm.addEventListener("canplay", function () { musicToggle.hidden = false; });
    musicToggle.addEventListener("click", function () {
      if (bgm.paused) {
        musicPlay();
      } else {
        bgm.pause();
        musicToggle.classList.remove("on");
      }
    });
  }

  /* ---------- Code d'invitation ---------- */

  const expectedCode = INVITATION_CODE.trim().toLowerCase();
  const hint = document.getElementById("hint");

  if (!expectedCode || sessionStorage.getItem("invite-ok") === "1") {
    // Code désactivé ou déjà validé dans cet onglet : champ masqué.
    codeGate.hidden = true;
    hint.textContent = "Cliquez pour ouvrir";
  }

  function checkCode() {
    if (!expectedCode) return true;
    if (sessionStorage.getItem("invite-ok") === "1") return true;
    const ok = codeInput.value.trim().toLowerCase() === expectedCode;
    if (ok) {
      sessionStorage.setItem("invite-ok", "1");
      codeError.hidden = true;
    } else {
      codeError.hidden = false;
      envelope.classList.add("shake");
      if (gateGuard) gateGuard.classList.add("firing");
      gunburst();
      codeInput.focus();
      setTimeout(function () {
        envelope.classList.remove("shake");
        if (gateGuard) gateGuard.classList.remove("firing");
      }, 650);
    }
    return ok;
  }

  codeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      openEnvelope();
    }
  });
  codeInput.addEventListener("input", function () {
    codeError.hidden = true;
    // Un coup de feu à chaque caractère tapé (ou effacé)
    gunshot();
  });

  /* ---------- Ouverture de l'enveloppe ---------- */

  let opened = false;

  function showCard() {
    envelopeScene.hidden = true;
    cardScene.hidden = false;
    // Laisse le navigateur appliquer le "display" avant la transition d'entrée.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        cardScene.classList.add("is-visible");
      });
    });
    const heading = cardScene.querySelector("h1");
    if (heading) heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function openEnvelope() {
    if (opened) return;
    if (!checkCode()) return;
    opened = true;
    envelope.disabled = true;
    musicPlay();

    if (reducedMotion) {
      showCard();
      return;
    }

    envelope.classList.add("is-opening");

    // Fin de l'animation du rabat + sortie de la carte (~1,5 s),
    // puis fondu de la scène avant d'afficher la carte.
    setTimeout(function () {
      envelopeScene.classList.add("is-gone");
    }, 1450);
    setTimeout(showCard, 1800);
  }

  envelope.addEventListener("click", openEnvelope);
})();
