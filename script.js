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
const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSeAKTleAISM6AoA3-V0OfsWCSBYkVY8pRR-HLBtI-TJBx7AMQ/formResponse";
const GOOGLE_FORM_ENTRIES = {
  name: "entry.886880296",    // « Votre nom »
  present: "entry.789516920", // « Serez-vous présent(e) ? » (Oui/Non)
  adults: "entry.845308764",  // « Adultes » (18 ans et +)
  teens: "entry.799495062",   // « Ados » (12–17 ans)
  kids: "entry.503537446",    // « Enfants » (0–11 ans)
  // Optionnel : si vous ajoutez deux questions « Âge(s) des ados » et
  // « Âge(s) des enfants » (réponse courte, NON obligatoires) dans le
  // Google Form, collez leurs entry.xxx ci-dessous.
  teensAges: "",
  kidsAges: "",
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
  const skipBtn = document.getElementById("skip-intro");
  const rsvpBtn = document.getElementById("rsvp-btn");
  const rsvpNote = document.getElementById("rsvp-note");
  const rsvpError = document.getElementById("rsvp-error");
  const rsvpSuccess = document.getElementById("rsvp-success");
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

      // Confirmation visuelle pour l'invité
      rsvpForm.hidden = true;
      rsvpBtn.hidden = true;
      rsvpNote.hidden = true;
      rsvpSuccess.hidden = false;
      rsvpSuccess.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    });
  } else if (formUrl) {
    /* ===== MODE 1bis : lien Google Form simple ===== */
    rsvpForm.hidden = true;
    rsvpError.hidden = true;
    copyBtn.hidden = true;
    rsvpNote.textContent =
      "Le bouton ouvrira un court formulaire Google pour confirmer votre présence.";
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
    opened = true;
    envelope.disabled = true;

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
  skipBtn.addEventListener("click", function () {
    if (opened) return;
    opened = true;
    showCard();
  });
})();
