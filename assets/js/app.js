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
     المصحّح الآلي — مقارنة الكلمات المفتاحية
     يقارن إجابة الطالب بالإجابة النموذجية بعد توحيد الحروف
     وحذف أدوات الربط، ثم يقترح الحكم (والطالب يملك التعديل).
     ========================================================= */
  var STOP = ("في من على الى إلى عن مع ان أن إن او أو ثم قد هو هي هم التي الذي الذين ما ماذا كل له لها لهم ذلك تلك هذه هذا بين " +
    "كان كانت يكون تكون وفقا طبقا عبر حسب لا الا إلا بعد قبل عند حيث كما اي أي اذا إذا منه منها فيه فيها به بها التى").split(" ");
  var STOP_SET = {};
  STOP.forEach(function (w) { STOP_SET[normalize(w)] = true; });

  function stem(w) {
    if (w.length > 4 && /^(وال|بال|كال|فال)/.test(w)) w = w.slice(3);
    else if (w.length > 3 && /^(ال|لل)/.test(w)) w = w.slice(2);
    else if (w.length > 3 && /^[وفب]/.test(w)) w = w.slice(1);
    if (w.length > 3 && /^(ال)/.test(w)) w = w.slice(2);
    if (w.length > 4 && /(ات|ون|ين|ها|ه)$/.test(w)) w = w.replace(/(ات|ون|ين|ها|ه)$/, "");
    return w;
  }

  function keywords(text) {
    var seen = {}, out = [];
    String(text)
      .replace(/[\u064B-\u0652\u0640]/g, "")
      .replace(/[^\u0621-\u064A0-9\u0660-\u0669\s]/g, " ")
      .split(/\s+/)
      .forEach(function (orig) {
        var raw = normalize(orig);
        if (!raw || STOP_SET[raw] || raw.length < 2) return;
        var w = stem(raw);
        if (w.length < 2 || STOP_SET[w] || seen[w]) return;
        seen[w] = true;
        out.push({ key: w, word: orig }); // تُعرض الكلمة بإملائها الأصلي
      });
    return out;
  }

  function wordMatch(a, b) {
    if (a === b) return true;
    var min = Math.min(a.length, b.length);
    return min >= 3 && (a.indexOf(b) === 0 || b.indexOf(a) === 0);
  }

  function gradeAnswer(student, model) {
    var mk = keywords(model), sk = keywords(student);
    if (!mk.length) return { pct: 0, hit: [], miss: [] };
    var hit = [], miss = [];
    mk.forEach(function (m) {
      var found = sk.some(function (s) { return wordMatch(s.key, m.key); });
      (found ? hit : miss).push(m.word);
    });
    return { pct: Math.round((hit.length / mk.length) * 100), hit: hit, miss: miss };
  }

  var PASS = 50; // نسبة التطابق التي يُقترح عندها الحكم بالصحة

  /* =========================================================
     بنك الأسئلة
     ========================================================= */
  var TOTAL = D.questions.length;
  var bank = {
    mode: store.get("mode", "exam"),
    toggled: {},                       // أسئلة عُكس وضع حلّها يدوياً
    assess: store.get("assess", {}),   // { index: "ok" | "no" }
    drafts: store.get("drafts", {}),   // مسودات الإجابات
    graded: store.get("graded", {}),   // { index: { text, pct, hit, miss } }
    group: "all",
    query: "",
  };

  function save() {
    store.set("assess", bank.assess);
    store.set("drafts", bank.drafts);
    store.set("graded", bank.graded);
  }

  function counts() {
    var ok = 0, no = 0;
    for (var k in bank.assess) { if (bank.assess[k] === "ok") ok++; else if (bank.assess[k] === "no") no++; }
    return { ok: ok, no: no, left: TOTAL - ok - no };
  }

  function normalize(s) {
    return String(s)
      .replace(/[\u064B-\u0652\u0640]/g, "")  // التشكيل والتطويل
      .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
      .toLowerCase();
  }

  function highlight(text) {
    var safe = esc(text);
    var q = bank.query.trim();
    if (!q) return safe;
    var re = new RegExp("(" + esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "g");
    return safe.replace(re, "<mark>$1</mark>");
  }

  function isOpen(i) {
    if (bank.mode === "exam" && bank.graded[i]) return true;
    return (bank.mode === "review") !== !!bank.toggled[i];
  }

  function renderTabs() {
    var mistakes = counts().no;
    var tabs = [{ id: "all", name: "الكل", icon: "📚" }].concat(D.groups, [{ id: "mistakes", name: "أخطائي", icon: "🔁" }]);
    $("#groupTabs").innerHTML = tabs.map(function (g) {
      var count = g.id === "all" ? TOTAL
        : g.id === "mistakes" ? mistakes
        : D.questions.filter(function (q) { return q.g === g.id; }).length;
      return '<button type="button" role="tab" class="chip' + (g.id === "mistakes" ? " chip-alt" : "") + '" data-group="' + g.id + '" aria-selected="' + (bank.group === g.id) + '">' +
        g.icon + " " + g.name + " (" + count + ")</button>";
    }).join("");
  }

  function matches(q, i) {
    if (bank.group === "mistakes") { if (bank.assess[i] !== "no") return false; }
    else if (bank.group !== "all" && bank.group !== q.g) return false;
    var nq = normalize(bank.query.trim());
    return !nq || normalize(q.q + " " + q.a).indexOf(nq) !== -1;
  }

  function renderQuestions() {
    var html = "", shown = 0;
    D.groups.forEach(function (g) {
      var items = [];
      D.questions.forEach(function (q, i) {
        if (q.g === g.id && matches(q, i)) items.push(questionCard(q, i));
      });
      if (!items.length) return;
      shown += items.length;
      html += '<section><h2 class="group-title">' + g.icon + " " + g.name + ' <span class="cnt">' + items.length + " أسئلة</span></h2>" + items.join("") + "</section>";
    });
    $("#questionList").innerHTML = html;
    $("#emptyState").textContent = bank.group === "mistakes" ? "🎉 لا توجد أسئلة خاطئة حالياً — أحسنت!" : "لا توجد أسئلة مطابقة لبحثك.";
    $("#emptyState").classList.toggle("hidden", shown > 0);
  }

  function feedbackHtml(g) {
    var good = g.pct >= PASS;
    var level = g.pct >= 75 ? "إجابة مطابقة إلى حد كبير" : good ? "إجابة قريبة — راجع النقاط الناقصة" : g.pct >= 25 ? "إجابة جزئية — تنقصها عناصر أساسية" : "إجابة بعيدة عن المطلوب";
    return '<div class="feedback ' + (good ? "fb-good" : "fb-bad") + '">' +
      '<div class="fb-top"><span class="fb-title">🤖 التقييم الآلي: ' + level + '</span><span class="fb-pct">' + g.pct + "%</span></div>" +
      '<div class="meter"><div style="width:' + g.pct + '%"></div></div>' +
      (g.hit.length ? '<p class="fb-line"><b>✔ عناصر ذكرتها:</b> ' + g.hit.map(function (w) { return '<span class="kw kw-hit">' + esc(w) + "</span>"; }).join("") + "</p>" : "") +
      (g.miss.length ? '<p class="fb-line"><b>✘ عناصر ناقصة:</b> ' + g.miss.map(function (w) { return '<span class="kw kw-miss">' + esc(w) + "</span>"; }).join("") + "</p>" : "") +
      '<p class="fb-note">اقترح المصحّح الحكم «' + (good ? "✅ صحيحة" : "❌ خاطئة") + '» — قارن بالإجابة النموذجية وعدّل الحكم إن لزم.</p>' +
      "</div>";
  }

  function questionCard(q, i) {
    var open = isOpen(i);
    var a = bank.assess[i];
    var g = bank.graded[i];
    var exam = bank.mode === "exam";
    var cls = a === "ok" ? " known" : a === "no" ? " needs" : "";
    var zone = "";

    if (exam && g) {
      zone += '<div class="student-ans"><span class="lbl">إجابتك:</span> ' + (g.text ? esc(g.text) : "<em>(لم تكتب إجابة)</em>") + "</div>";
      zone += feedbackHtml(g);
    } else if (exam) {
      zone += '<label class="sr-only" for="draft-' + i + '">اكتب إجابتك</label>' +
        '<textarea id="draft-' + i + '" class="draft" data-draft="' + i + '" placeholder="✍️ اكتب إجابتك هنا ثم اضغط «إرسال / تحقق»…">' + esc(bank.drafts[i] || "") + "</textarea>";
    }
    zone += '<div class="answer' + (open ? "" : " hidden-ans") + (exam ? " mt-3" : "") + '" id="ans-' + i + '"><span class="lbl">الإجابة النموذجية:</span> ' + highlight(q.a) + "</div>";

    var actions = "";
    if (exam && !g) {
      actions += '<button type="button" class="q-btn submit" data-act="submit">📤 إرسال / تحقق</button>';
      actions += '<button type="button" class="q-btn reveal" data-act="toggle" aria-expanded="' + open + '" aria-controls="ans-' + i + '">' + (open ? "🔒 إخفاء الحل" : "👁️ إظهار الحل") + "</button>";
    } else if (exam) {
      actions += '<button type="button" class="q-btn" data-act="retry">↺ إعادة المحاولة</button>';
    } else {
      actions += '<button type="button" class="q-btn reveal" data-act="toggle" aria-expanded="' + open + '" aria-controls="ans-' + i + '">' + (open ? "🔒 إخفاء الحل" : "👁️ إظهار الحل") + "</button>";
    }

    return '<article class="q-card' + cls + '" id="q-' + i + '" data-i="' + i + '">' +
      '<div class="q-head"><span class="q-num">' + (i + 1) + '</span><p class="q-text">' + highlight(q.q) + "</p></div>" +
      '<div class="answer-zone">' + zone + "</div>" +
      '<div class="q-actions no-print">' + actions +
        '<span class="spacer"></span>' +
        '<span class="verdict-lbl">حكمك:</span>' +
        '<button type="button" class="q-btn ok" data-act="ok" aria-pressed="' + (a === "ok") + '">✅ صحيحة</button>' +
        '<button type="button" class="q-btn no" data-act="no" aria-pressed="' + (a === "no") + '">❌ خاطئة</button>' +
      "</div></article>";
  }

  function refreshCard(i) {
    var old = $("#q-" + i);
    if (!old) return;
    var tmp = document.createElement("div");
    tmp.innerHTML = questionCard(D.questions[i], i);
    old.replaceWith(tmp.firstChild);
  }

  function renderMode() {
    $$(".mode-opt").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.mode === bank.mode)); });
    $("#modeHint").textContent = bank.mode === "exam"
      ? "🔒 وضع الامتحان الذاتي: اكتب إجابتك ثم اضغط «إرسال / تحقق» لتظهر الإجابة النموذجية ويقترح المصحّح الآلي حكمه."
      : "👁️ وضع المراجعة: الحلول النموذجية ظاهرة لجميع الأسئلة. يمكنك إخفاء أي حل بمفرده.";
  }

  function renderScore() {
    var c = counts();
    var pct = Math.round((c.ok / TOTAL) * 100);
    $("#scoreKnown").textContent = c.ok;
    $("#scoreReview").textContent = c.no;
    $("#scoreLeft").textContent = c.left;
    $("#scoreFrac").textContent = c.ok + " / " + TOTAL;
    $("#scorePct").textContent = pct + "%";
    $("#progressBar").style.width = pct + "%";
    $("#homeProgress").textContent = c.ok + " / " + TOTAL;
  }

  function renderBank() { renderMode(); renderTabs(); renderQuestions(); renderScore(); }

  function setVerdict(i, v) {
    var before = counts().left;
    if (v) bank.assess[i] = v; else delete bank.assess[i];
    save();
    renderScore(); renderTabs();
    if (bank.group === "mistakes" && v !== "no") renderQuestions(); else refreshCard(i);
    if (before > 0 && counts().left === 0) setTimeout(openReport, 400);
  }

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
      if (!confirm("بدء اختبار جديد؟ سيتم مسح إجاباتك ونتائجك الحالية.")) return;
      bank.assess = {}; bank.drafts = {}; bank.graded = {}; bank.toggled = {};
      if (bank.group === "mistakes") bank.group = "all";
      save();
      renderBank();
      window.scrollTo({ top: $("[data-view=bank]").offsetTop, behavior: "smooth" });
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
        refreshCard(i);
        return;
      }
      if (act === "submit") {
        var text = (bank.drafts[i] || "").trim();
        if (!text && !confirm("لم تكتب إجابة بعد. هل تريد كشف الحل واحتساب السؤال خاطئاً؟")) {
          var ta = $("#draft-" + i); if (ta) ta.focus();
          return;
        }
        var g = gradeAnswer(text, D.questions[i].a);
        g.text = text;
        bank.graded[i] = g;
        setVerdict(i, g.pct >= PASS ? "ok" : "no");
        return;
      }
      if (act === "retry") {
        delete bank.graded[i];
        bank.toggled[i] = false;
        setVerdict(i, null);
        var d = $("#draft-" + i); if (d) d.focus();
        return;
      }
      // ok / no — النقر على الحكم نفسه يلغيه
      setVerdict(i, bank.assess[i] === act ? null : act);
    });

    list.addEventListener("input", function (e) {
      if (!e.target.dataset.draft) return;
      bank.drafts[e.target.dataset.draft] = e.target.value;
      store.set("drafts", bank.drafts);
    });

    // Ctrl/⌘ + Enter لإرسال الإجابة
    list.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target.dataset.draft) {
        e.preventDefault();
        var btn = $('[data-act="submit"]', e.target.closest(".q-card"));
        if (btn) btn.click();
      }
    });

    $("#finishBtn").addEventListener("click", openReport);
    $$("[data-open-report]").forEach(function (b) { b.addEventListener("click", openReport); });
  }

  /* =========================================================
     تقرير النتيجة النهائي
     ========================================================= */
  function gradeLabel(pct) {
    if (pct >= 90) return { t: "ممتاز 🏆", m: "أداء رائع! أنت جاهز للاختبار." };
    if (pct >= 75) return { t: "جيد جداً 🌟", m: "مستوى قوي، راجع الأسئلة القليلة المتبقية." };
    if (pct >= 60) return { t: "جيد 👍", m: "بداية جيدة، ركّز على أخطائك وأعد التدريب." };
    return { t: "يحتاج إلى مراجعة 📚", m: "اقرأ المذكرة الشاملة ثم أعد المحاولة — ستتحسن بالتكرار." };
  }

  function qLink(i, cls) {
    return '<li><button type="button" class="rep-q ' + cls + '" data-goto="' + i + '"><span class="rep-n">' + (i + 1) + "</span>" + esc(D.questions[i].q) + "</button></li>";
  }

  function openReport() {
    var c = counts();
    var pct = Math.round((c.ok / TOTAL) * 100);
    var L = gradeLabel(pct);
    var wrong = [], left = [];
    D.questions.forEach(function (q, i) {
      if (bank.assess[i] === "no") wrong.push(i);
      else if (!bank.assess[i]) left.push(i);
    });
    var deg = Math.round(pct * 3.6);

    var html =
      '<div class="rep-hero">' +
        '<div class="ring" style="--deg:' + deg + 'deg"><div><b>' + c.ok + "</b><span>/ " + TOTAL + "</span></div></div>" +
        '<div><p class="rep-grade">' + L.t + '</p><p class="rep-msg">' + L.m + "</p>" +
        '<p class="rep-pct">النسبة: <b>' + pct + "%</b></p></div>" +
      "</div>" +
      '<div class="rep-stats">' +
        '<div class="rs ok"><b>' + c.ok + "</b><span>✅ صحيحة</span></div>" +
        '<div class="rs no"><b>' + c.no + "</b><span>❌ خاطئة</span></div>" +
        '<div class="rs left"><b>' + c.left + "</b><span>⏳ لم تُجب</span></div>" +
      "</div>";

    if (wrong.length) {
      html += '<h3 class="rep-h">🔁 أسئلة تحتاج إلى مراجعة (' + wrong.length + ")</h3><ul class=\"rep-list\">" + wrong.map(function (i) { return qLink(i, "w"); }).join("") + "</ul>";
    }
    if (left.length) {
      html += '<h3 class="rep-h">⏳ أسئلة لم تُجب عنها بعد (' + left.length + ")</h3><ul class=\"rep-list\">" + left.map(function (i) { return qLink(i, "l"); }).join("") + "</ul>";
    }
    if (!wrong.length && !left.length) {
      html += '<p class="rep-perfect">🎉 أجبت عن جميع الأسئلة إجابة صحيحة. أحسنت!</p>';
    }

    html += '<div class="modal-actions">' +
      (wrong.length ? '<button type="button" class="btn-primary" data-rep="mistakes">🔁 تدرّب على أخطائي فقط</button>' : "") +
      '<button type="button" class="btn-outline" data-rep="print">🖨️ طباعة التقرير</button>' +
      '<button type="button" class="btn-outline" data-close>إغلاق</button>' +
      "</div>";

    $("#reportContent").innerHTML = html;
    store.set("lastReport", { ok: c.ok, no: c.no, total: TOTAL, at: Date.now() });
    showModal($("#reportModal"));
  }

  function goToQuestion(i) {
    closeModal($("#reportModal"));
    bank.group = "all"; bank.query = ""; $("#search").value = "";
    if (location.hash !== "#/bank") location.hash = "#/bank";
    renderTabs(); renderQuestions();
    setTimeout(function () {
      var el = $("#q-" + i);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("flash");
      var ta = $("textarea", el);
      if (ta) ta.focus({ preventScroll: true });
      setTimeout(function () { el.classList.remove("flash"); }, 1600);
    }, 80);
  }

  function bindReport() {
    $("#reportModal").addEventListener("click", function (e) {
      if (e.target === e.currentTarget || e.target.closest("[data-close]")) return closeModal(e.currentTarget);
      var g = e.target.closest("[data-goto]");
      if (g) return goToQuestion(Number(g.dataset.goto));
      var r = e.target.closest("[data-rep]");
      if (!r) return;
      if (r.dataset.rep === "mistakes") {
        closeModal($("#reportModal"));
        bank.group = "mistakes"; bank.query = ""; $("#search").value = "";
        renderTabs(); renderQuestions();
        $("#questionList").scrollIntoView({ behavior: "smooth" });
      } else if (r.dataset.rep === "print") {
        closeModal($("#reportModal"));
        printCustom("report");
      }
    });
  }

  /* =========================================================
     النوافذ المنبثقة
     ========================================================= */
  function showModal(d) {
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
    document.body.classList.add("modal-open");
  }
  function closeModal(d) {
    if (typeof d.close === "function" && d.open) d.close(); else d.removeAttribute("open");
    document.body.classList.remove("modal-open");
  }

  /* =========================================================
     الطباعة والتصدير المخصص (PDF)
     ========================================================= */
  var SCOPE_TITLES = {
    teacher: "مذكرة الأستاذ الرسمية",
    summary: "المذكرة العامة الشاملة",
    bank: "بنك الأسئلة التدريبي — 30 سؤالاً",
    report: "تقرير نتيجة الاختبار الذاتي",
  };

  function today() {
    try { return new Date().toLocaleDateString("ar-BH", { year: "numeric", month: "long", day: "numeric" }); }
    catch (e) { return new Date().toLocaleDateString(); }
  }

  function printHeader(title, sub) {
    return '<header class="p-head">' +
      '<div class="p-brand"><img src="assets/img/favicon.svg" alt="" /><div><b>منصة التربية للمواطنة</b><span>الصف الثاني الإعدادي — مملكة البحرين</span></div></div>' +
      '<div class="p-meta">' + today() + "</div>" +
      "</header>" +
      '<h1 class="p-title">' + title + "</h1>" + (sub ? '<p class="p-sub">' + sub + "</p>" : "");
  }

  function printBank(withAnswers) {
    var n = 0;
    var html = withAnswers ? "" :
      '<div class="p-student"><span>اسم الطالب: <i></i></span><span>الصف/الشعبة: <i></i></span><span>الدرجة: <i class="short"></i> / 30</span></div>' +
      '<p class="p-instr">أجب عن الأسئلة الآتية إجابة مقالية واضحة ومختصرة.</p>';
    D.groups.forEach(function (g, gi) {
      html += '<section class="p-group"><h2>' + "المجموعة " + "الأولى الثانية الثالثة الرابعة الخامسة".split(" ")[gi] + ": " + g.name + "</h2>";
      D.questions.forEach(function (q, i) {
        if (q.g !== g.id) return;
        n++;
        html += '<div class="p-q"><p class="p-qt"><span class="p-n">' + (i + 1) + "</span>" + esc(q.q) + "</p>" +
          (withAnswers
            ? '<p class="p-a"><b>الإجابة:</b> ' + esc(q.a) + "</p>"
            : '<div class="p-lines"><i></i><i></i><i></i></div>') +
          "</div>";
      });
      html += "</section>";
    });
    return html;
  }

  function printReport() {
    var c = counts();
    var pct = Math.round((c.ok / TOTAL) * 100);
    var rows = D.questions.map(function (q, i) {
      var a = bank.assess[i];
      var st = a === "ok" ? "✅ صحيحة" : a === "no" ? "❌ خاطئة" : "⏳ لم يُجب";
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(q.q) + "</td><td>" + st + "</td></tr>";
    }).join("");
    return '<div class="p-score"><b>' + c.ok + " / " + TOTAL + "</b><span>النسبة " + pct + "% — " + gradeLabel(pct).t + "</span></div>" +
      '<div class="table-wrap"><table><thead><tr><th>م</th><th>السؤال</th><th>النتيجة</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  }

  var restoreDark = false;
  function beforePrint() {
    restoreDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
  }
  function afterPrint() {
    if (restoreDark) document.documentElement.classList.add("dark");
    restoreDark = false;
    document.body.classList.remove("print-custom");
    $("#printArea").innerHTML = "";
  }

  function printCustom(scope, withAnswers) {
    var area = $("#printArea");
    var body = "";
    if (scope === "teacher") body = $("#teacherContent").innerHTML;
    else if (scope === "summary") body = '<div class="prose-ar">' + $("[data-view=summary] article").innerHTML + "</div>";
    else if (scope === "bank") body = printBank(withAnswers);
    else if (scope === "report") body = printReport();

    var sub = scope === "bank" ? (withAnswers ? "نسخة المراجعة — مع الإجابات النموذجية" : "ورقة اختبار — بدون إجابات") : "";
    area.innerHTML = printHeader(SCOPE_TITLES[scope], sub) + '<div class="p-body p-' + scope + '">' + body + "</div>" +
      '<footer class="p-foot">منصة التربية للمواطنة — مرجع مساعد للمراجعة؛ الكتاب المدرسي ومذكرة المعلم هما المرجع الأساسي.</footer>';
    // إزالة معرّفات مكررة من المحتوى المنسوخ
    $$("[id]", area).forEach(function (el) { el.removeAttribute("id"); });

    document.body.classList.add("print-custom");
    var prevTitle = document.title;
    document.title = "التربية للمواطنة - " + SCOPE_TITLES[scope] + (scope === "bank" && !withAnswers ? " (ورقة اختبار)" : "");
    setTimeout(function () {
      window.print();
      document.title = prevTitle;
      // بعض المتصفحات لا تطلق afterprint بشكل موثوق
      setTimeout(afterPrint, 500);
    }, 60);
  }

  function bindPrint() {
    var modal = $("#printModal"), form = $("#printForm");
    function syncAnswers() {
      var isBank = form.scope.value === "bank";
      $("#answersGroup").disabled = !isBank;
      $("#answersGroup").classList.toggle("is-disabled", !isBank);
    }
    $("#printBtn").addEventListener("click", function () {
      var cur = currentView();
      form.scope.value = cur === "home" ? "bank" : cur;
      syncAnswers();
      showModal(modal);
    });
    form.addEventListener("change", syncAnswers);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(modal); });
    modal.addEventListener("close", function () {
      document.body.classList.remove("modal-open");
      if (modal.returnValue === "print") printCustom(form.scope.value, form.answers.value === "with");
      modal.returnValue = "";
    });
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
  }

  /* =========================================================
     التوجيه والتنقل
     ========================================================= */
  var VIEWS = ["home", "teacher", "summary", "bank"];

  function currentView() {
    var name = (location.hash.replace(/^#\/?/, "") || "home").split(/[/?]/)[0];
    return VIEWS.indexOf(name) === -1 ? "home" : name;
  }

  function route() {
    var raw = (location.hash.replace(/^#\/?/, "") || "home").split(/[/?]/)[0];
    // روابط داخلية (#t-terms) لا تغيّر القسم الحالي
    if (VIEWS.indexOf(raw) === -1 && document.getElementById(raw)) return;
    var name = currentView();
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

    var top = $("#toTop");
    window.addEventListener("scroll", function () { top.classList.toggle("show", window.scrollY > 600); }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

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
  bindReport();
  bindPrint();
  bindGlobal();
  window.addEventListener("hashchange", route);
  route();
})();
