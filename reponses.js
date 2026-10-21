/* =====================================================
   RÉCAPITULATIF DES RÉPONSES — Page organisateurs
   Colle les messages WhatsApp -> tableau -> export Excel (.csv)
   Données conservées dans le navigateur (localStorage).
   ===================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "rsvp-reponses";
  const tbody = document.getElementById("tbody");
  const pasteArea = document.getElementById("paste");
  const parseBtn = document.getElementById("parse-btn");
  const parseHint = document.getElementById("parse-hint");
  const addRowBtn = document.getElementById("add-row");
  const exportBtn = document.getElementById("export-btn");
  const clearBtn = document.getElementById("clear-btn");

  const tAdults = document.getElementById("t-adults");
  const tTeens = document.getElementById("t-teens");
  const tKids = document.getElementById("t-kids");
  const tAll = document.getElementById("t-all");

  /* ---------- Modèle ---------- */

  let rows = load();

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }

  function emptyRow() {
    return { name: "", adults: 0, teens: 0, teensAges: "", kids: 0, kidsAges: "" };
  }

  /* ---------- Analyse d'un message WhatsApp ---------- */

  function parseMessage(text) {
    const row = emptyRow();
    const mName = text.match(/nom\s*:\s*(.+)/i);
    const mAdults = text.match(/adultes\s*:\s*(\d+)/i);
    const mTeens = text.match(/ados\s*:\s*(\d+)\s*(?:\(\s*â?ges?\s*:\s*([^)]*)\))?/i);
    const mKids = text.match(/enfants\s*:\s*(\d+)\s*(?:\(\s*â?ges?\s*:\s*([^)]*)\))?/i);

    if (mName) row.name = mName[1].trim();
    if (mAdults) row.adults = parseInt(mAdults[1], 10);
    if (mTeens) {
      row.teens = parseInt(mTeens[1], 10);
      if (mTeens[2]) row.teensAges = mTeens[2].trim();
    }
    if (mKids) {
      row.kids = parseInt(mKids[1], 10);
      if (mKids[2]) row.kidsAges = mKids[2].trim();
    }
    return row;
  }

  /* ---------- Rendu du tableau ---------- */

  const FIELDS = ["name", "adults", "teens", "teensAges", "kids", "kidsAges"];
  const NUMERIC = { adults: true, teens: true, kids: true };

  function render() {
    tbody.innerHTML = "";
    rows.forEach(function (row, i) {
      const tr = document.createElement("tr");
      FIELDS.forEach(function (field) {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.value = row[field];
        input.setAttribute("aria-label", field + " ligne " + (i + 1));
        if (NUMERIC[field]) {
          input.type = "number";
          input.min = "0";
          input.inputMode = "numeric";
        } else {
          input.type = "text";
        }
        input.addEventListener("input", function () {
          row[field] = NUMERIC[field]
            ? Math.max(0, parseInt(input.value, 10) || 0)
            : input.value;
          save();
          updateTotals();
        });
        td.appendChild(input);
        tr.appendChild(td);
      });
      const tdDel = document.createElement("td");
      const del = document.createElement("button");
      del.className = "row-del";
      del.type = "button";
      del.textContent = "×";
      del.setAttribute("aria-label", "Supprimer la ligne " + (i + 1));
      del.addEventListener("click", function () {
        rows.splice(i, 1);
        save();
        render();
      });
      tdDel.appendChild(del);
      tr.appendChild(tdDel);
      tbody.appendChild(tr);
    });
    updateTotals();
  }

  function updateTotals() {
    const sum = function (key) {
      return rows.reduce(function (acc, r) {
        return acc + (parseInt(r[key], 10) || 0);
      }, 0);
    };
    const a = sum("adults"), t = sum("teens"), k = sum("kids");
    tAdults.textContent = a;
    tTeens.textContent = t;
    tKids.textContent = k;
    tAll.textContent = a + t + k;
  }

  /* ---------- Actions ---------- */

  parseBtn.addEventListener("click", function () {
    const text = pasteArea.value.trim();
    if (!text) return;
    rows.push(parseMessage(text));
    pasteArea.value = "";
    save();
    render();
    parseHint.hidden = false;
  });

  addRowBtn.addEventListener("click", function () {
    rows.push(emptyRow());
    save();
    render();
  });

  clearBtn.addEventListener("click", function () {
    if (rows.length === 0) return;
    if (confirm("Effacer toutes les réponses enregistrées ?")) {
      rows = [];
      save();
      render();
    }
  });

  exportBtn.addEventListener("click", function () {
    const sep = ";";
    const esc = function (v) {
      const s = String(v == null ? "" : v);
      return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [
      ["Nom", "Adultes", "Ados", "Âges ados", "Enfants", "Âges enfants"].join(sep),
    ];
    rows.forEach(function (r) {
      lines.push(
        [r.name, r.adults, r.teens, r.teensAges, r.kids, r.kidsAges]
          .map(esc)
          .join(sep)
      );
    });
    const sum = function (key) {
      return rows.reduce(function (acc, r) {
        return acc + (parseInt(r[key], 10) || 0);
      }, 0);
    };
    lines.push(["TOTAL", sum("adults"), sum("teens"), "", sum("kids"), ""].join(sep));
    lines.push(["TOTAL INVITÉS", sum("adults") + sum("teens") + sum("kids"), "", "", "", ""].join(sep));

    // BOM UTF-8 + ";" : s'ouvre correctement dans Excel (accents OK)
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reponses-anniversaire.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  render();
})();
