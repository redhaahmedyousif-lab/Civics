/* =========================================================
   منصة التربية للمواطنة — منطق التطبيق
   ========================================================= */
(function () {
  "use strict";

  var D = window.CIVICS_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- تخزين آمن ---------- */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem("civics-" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem("civics-" + k, JSON.stringify(v)); } catch (e) {}
    },
  };

  /* =========================================================
     مذكرة الأستاذ
     ========================================================= */
  function section(id, badge, title, body) {
    return '<section id="' + id + '"><h2 class="sec-title"><span class="badge">' + badge + "</span>" + title + "</h2>" + body + "</section>";
  }

  function renderTeacher() {
    var T = D.teacher;
    var html = "";

    // المصطلحات
    html += section("t-terms", "١", "المصطلحات المهمة",
      '<div class="grid gap-5 md:grid-cols-2">' +
      T.terms.map(function (t) {
        return '<div class="card term-card"><h3 class="term-name">' + esc(t.term) + "</h3>" +
          '<p class="mt-2">' + esc(t.def) + "</p>" +
          (t.features ? '<p class="mt-3 font-bold text-sm">مميزاته:</p><ul class="check-list">' +
            t.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
          "</div>";
      }).join("") + "</div>");

    // الدستور
    var c1 = T.constitution[0], c32 = T.constitution[1];
    html += section("t-const", "٢", "مواد الدستور",
      '<div class="grid gap-5 lg:grid-cols-2">' +
        '<div class="card"><span class="article-tag">' + c1.article + '</span><h3 class="mt-3">' + esc(c1.title) + "</h3>" +
          '<ul class="check-list mt-2">' + c1.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>" +
        '<div class="card"><span class="article-tag">' + c32.article + '</span><h3 class="mt-3">' + esc(c32.title) + "</h3>" +
          '<p class="mt-2">' + esc(c32.points[0]) + "</p>" +
          '<div class="grid gap-3 sm:grid-cols-3 mt-4">' +
            c32.powers.map(function (p) {
              return '<div class="power"><div class="ic">' + p.icon + "</div><b>" + esc(p.name) + "</b><p>" + esc(p.who) + "</p></div>";
            }).join("") +
          '</div><p class="coop">🤝 فصلٌ مع تعاون — وفقاً لأحكام الدستور</p></div>' +
      "</div>");

    // المحطات التاريخية
    html += section("t-time", "٣", "المحطات التاريخية",
      '<div class="timeline">' +
      T.timeline.map(function (t) {
        return '<div class="tl-item card"><span class="tl-year">' + esc(t.year) + '</span><h3 class="mt-1">' + esc(t.title) + '</h3><p class="mt-1 text-stone-600 dark:text-stone-400">' + esc(t.text) + "</p></div>";
      }).join("") + "</div>");

    // المبادئ
    html += section("t-princ", "٤", "مبادئ وقيم نظام الحكم",
      '<div class="grid gap-4 grid-cols-2 md:grid-cols-5">' +
      T.principles.map(function (p, i) {
        return '<div class="card principle relative"><span class="n">' + AR_DIGITS[i + 1] + '</span><div class="ic">' + p.icon + "</div><b>" + esc(p.name) + "</b><span>" + esc(p.note) + "</span></div>";
      }).join("") + "</div>");

    // القضاء والوصايا
    html += section("t-jud", "٥", "ضمانات القضاء وأهداف وصايا حكام آل خليفة",
      '<div class="grid gap-5 lg:grid-cols-2">' +
        '<div class="card"><h3>⚖️ ضمانات القضاء</h3><p class="mt-1 text-stone-600 dark:text-stone-400">القضاء أساس الحكم وضامن الحقوق والحريات، ودعائمه:</p>' +
          '<div class="pill-row mt-4">' + T.judiciary.map(function (j) { return '<span class="pill">' + esc(j) + "</span>"; }).join("") + "</div></div>" +
        '<div class="card"><h3>📜 أهداف وغايات الوصية لحكام آل خليفة</h3><ol class="num-list mt-2">' +
          T.willGoals.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ol></div>" +
      "</div>");

    // المجالس البلدية
    html += section("t-muni", "٦", "اختصاصات المجالس البلدية (٨ نقاط)",
      '<div class="table-wrap"><table><thead><tr><th style="width:4rem">م</th><th>الاختصاص</th></tr></thead><tbody>' +
      T.municipal.map(function (m, i) { return "<tr><td>" + (i + 1) + "</td><td>" + esc(m) + "</td></tr>"; }).join("") +
      "</tbody></table></div>");

    $("#teacherContent").innerHTML = html;
  }

  /* =========================================================
     بنك الأسئلة
     ========================================================= */
  var bank = {
    mode: store.get("mode", "exam"),
    toggled: {},                      // أسئلة عُكس وضعها يدوياً
    assess: store.get("assess", {}),  // { index: "ok" | "no" }
    drafts: store.get("drafts", {}),
    group: "all",
    query: "",
  };

  function normalize(s) {
    return String(s)
      .replace(/[ً-ْـ]/g, "")  // التشكيل والتطويل
      .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
      .toLowerCase();
  }

  function highlight(text) {
    var safe = esc(text);
    var q = bank.query.trim();
    if (!q) return safe;
    // تمييز الكلمة كما كُتبت فقط (البحث نفسه يتجاهل الهمزات والتشكيل)
    var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "g");
    return safe.replace(re, "<mark>$1</mark>");
  }

  function isOpen(i) { return (bank.mode === "review") !== !!bank.toggled[i]; }

  function renderTabs() {
    var tabs = [{ id: "all", name: "الكل", icon: "📚" }].concat(D.groups);
    $("#groupTabs").innerHTML = tabs.map(function (g) {
      var count = g.id === "all" ? D.questions.length : D.questions.filter(function (q) { return q.g === g.id; }).length;
      return '<button type="button" role="tab" class="chip" data-group="' + g.id + '" aria-selected="' + (bank.group === g.id) + '">' +
        g.icon + " " + g.name + " (" + count + ")</button>";
    }).join("");
  }

  function renderQuestions() {
    var nq = normalize(bank.query.trim());
    var html = "";
    var shown = 0;

    D.groups.forEach(function (g) {
      if (bank.group !== "all" && bank.group !== g.id) return;
      var items = [];
      D.questions.forEach(function (q, i) {
        if (q.g !== g.id) return;
        if (nq && normalize(q.q + " " + q.a).indexOf(nq) === -1) return;
        items.push(questionCard(q, i));
      });
      if (!items.length) return;
      shown += items.length;
      html += '<section><h2 class="group-title">' + g.icon + " " + g.name + ' <span class="cnt">' + items.length + " أسئلة</span></h2>" + items.join("") + "</section>";
    });

    $("#questionList").innerHTML = html;
    $("#emptyState").classList.toggle("hidden", shown > 0);
  }

  function questionCard(q, i) {
    var open = isOpen(i);
    var a = bank.assess[i];
    var cls = a === "ok" ? " known" : a === "no" ? " needs" : "";
    var draft = bank.drafts[i] || "";
    return '<article class="q-card' + cls + '" data-i="' + i + '">' +
      '<div class="q-head"><span class="q-num">' + (i + 1) + '</span><p class="q-text">' + highlight(q.q) + "</p></div>" +
      '<div class="answer-zone">' +
        (bank.mode === "exam" ? '<label class="sr-only" for="draft-' + i + '">اكتب إجابتك</label><textarea id="draft-' + i + '" class="draft no-print" data-draft="' + i + '" placeholder="✍️ اكتب إجابتك هنا قبل كشف الحل…">' + esc(draft) + "</textarea>" : "") +
        '<div class="answer' + (open ? "" : " hidden-ans") + (bank.mode === "exam" ? " mt-3" : "") + '" id="ans-' + i + '">' + highlight(q.a) + "</div>" +
      "</div>" +
      '<div class="q-actions no-print">' +
        '<button type="button" class="q-btn reveal" data-act="toggle" aria-expanded="' + open + '" aria-controls="ans-' + i + '">' +
          (open ? "🔒 إخفاء الحل" : "👁️ إظهار الحل") + "</button>" +
        '<span class="spacer"></span>' +
        '<button type="button" class="q-btn ok" data-act="ok" aria-pressed="' + (a === "ok") + '">✅ أتقنته</button>' +
        '<button type="button" class="q-btn no" data-act="no" aria-pressed="' + (a === "no") + '">🔁 أحتاج مراجعة</button>' +
      "</div></article>";
  }

  function renderMode() {
    $$(".mode-opt").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.mode === bank.mode)); });
    $("#modeHint").textContent = bank.mode === "exam"
      ? "🔒 وضع الامتحان الذاتي: الحلول مخفية. اكتب إجابتك ثم اكشف الحل لتقارن، وقيّم نفسك."
      : "👁️ وضع المراجعة: الحلول النموذجية ظاهرة لجميع الأسئلة. يمكنك إخفاء أي حل بمفرده.";
  }

  function renderScore() {
    var total = D.questions.length, ok = 0, no = 0;
    Object.keys(bank.assess).forEach(function (k) {
      if (bank.assess[k] === "ok") ok++; else if (bank.assess[k] === "no") no++;
    });
    var pct = Math.round((ok / total) * 100);
    $("#scoreKnown").textContent = ok;
    $("#scoreReview").textContent = no;
    $("#scorePct").textContent = pct + "%";
    $("#progressBar").style.width = pct + "%";
    $("#homeProgress").textContent = pct + "%";
  }

  function renderBank() { renderMode(); renderTabs(); renderQuestions(); renderScore(); }

  function bindBank() {
    $(".mode-switch").addEventListener("click", function (e) {
      var b = e.target.closest(".mode-opt");
      if (!b || b.dataset.mode === bank.mode) return;
      bank.mode = b.dataset.mode;
      bank.toggled = {};
      store.set("mode", bank.mode);
      renderMode(); renderQuestions();
    });

    $("#groupTabs").addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      bank.group = b.dataset.group;
      renderTabs(); renderQuestions();
    });

    var t;
    $("#search").addEventListener("input", function (e) {
      clearTimeout(t);
      t = setTimeout(function () { bank.query = e.target.value; renderQuestions(); }, 150);
    });

    $("#resetBtn").addEventListener("click", function () {
      if (!confirm("هل تريد مسح تقييمك الذاتي وإجاباتك المكتوبة؟")) return;
      bank.assess = {}; bank.drafts = {}; bank.toggled = {};
      store.set("assess", {}); store.set("drafts", {});
      renderQuestions(); renderScore();
    });

    var list = $("#questionList");
    list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var card = b.closest(".q-card");
      var i = Number(card.dataset.i);
      var act = b.dataset.act;

      if (act === "toggle") {
        bank.toggled[i] = !bank.toggled[i];
        var open = isOpen(i);
        $("#ans-" + i).classList.toggle("hidden-ans", !open);
        b.setAttribute("aria-expanded", String(open));
        b.textContent = open ? "🔒 إخفاء الحل" : "👁️ إظهار الحل";
        return;
      }
      bank.assess[i] = bank.assess[i] === act ? undefined : act;
      if (!bank.assess[i]) delete bank.assess[i];
      store.set("assess", bank.assess);
      card.classList.toggle("known", bank.assess[i] === "ok");
      card.classList.toggle("needs", bank.assess[i] === "no");
      $$(".q-btn.ok, .q-btn.no", card).forEach(function (x) {
        x.setAttribute("aria-pressed", String(bank.assess[i] === x.dataset.act));
      });
      renderScore();
    });

    list.addEventListener("input", function (e) {
      if (!e.target.dataset.draft) return;
      bank.drafts[e.target.dataset.draft] = e.target.value;
      store.set("drafts", bank.drafts);
    });
  }

  /* =========================================================
     التوجيه والتنقل
     ========================================================= */
  var VIEWS = ["home", "teacher", "summary", "bank"];

  function route() {
    var name = (location.hash.replace(/^#\/?/, "") || "home").split(/[/?]/)[0];
    if (VIEWS.indexOf(name) === -1) {
      // روابط داخلية (#t-terms) لا تغيّر القسم الحالي
      if (document.getElementById(name)) return;
      name = "home";
    }
    $$(".view").forEach(function (v) { v.classList.toggle("hidden", v.dataset.view !== name); });
    $$("[data-nav]").forEach(function (a) {
      var on = a.dataset.nav === name;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }

  /* ---------- أدوات عامة ---------- */
  function bindGlobal() {
    $("#themeBtn").addEventListener("click", function () {
      var dark = document.documentElement.classList.toggle("dark");
      try { localStorage.setItem("civics-theme", dark ? "dark" : "light"); } catch (e) {}
    });
    $("#printBtn").addEventListener("click", function () { window.print(); });

    var top = $("#toTop");
    window.addEventListener("scroll", function () { top.classList.toggle("show", window.scrollY > 600); }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    // روابط فهرس المذكرة: تمرير سلس دون تغيير المسار
    $$(".toc a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var el = document.getElementById(a.getAttribute("href").slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  renderTeacher();
  renderBank();
  bindBank();
  bindGlobal();
  window.addEventListener("hashchange", route);
  route();
})();
