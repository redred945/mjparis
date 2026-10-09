(function () {
  "use strict";
  var doc = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cfg = window.MJ_CONFIG || {};

  /* ----- Header : état au scroll ----- */
  var header = doc.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 80); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* ----- Splash couronne -> logo (une fois par session ; la classe is-splash est posée dans le <head>) ----- */
  var splash = doc.querySelector('.splash'), root = doc.documentElement;
  if (splash && root.classList.contains('is-splash')) {
    var done = false, endSplash = function () { if (done) return; done = true; root.classList.remove('is-splash'); try { sessionStorage.setItem('mj-splash', '1'); } catch (e) {} };
    var skip = function () { if (done) return; splash.classList.add('is-skipping'); setTimeout(endSplash, 260); };
    splash.addEventListener('click', skip);
    doc.addEventListener('keydown', skip, { once: true });
    setTimeout(endSplash, 2500);
  } else { try { sessionStorage.setItem('mj-splash', '1'); } catch (e) {} }

  /* ----- Menu mobile ----- */
  var burger = doc.querySelector(".burger"), drawer = doc.getElementById("drawer");
  if (burger && drawer) {
    drawer.setAttribute("inert", "");
    var lastFocus = null;
    var setMenu = function (open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.querySelector(".burger__txt").textContent = open ? "Fermer" : "Menu";
      drawer.classList.toggle("is-open", open);
      header.classList.toggle("menu-open", open);
      doc.body.classList.toggle("no-scroll", open);
      /* le contenu derrière le menu plein écran n'est ni focusable ni lu par les lecteurs d'écran */
      doc.querySelectorAll("main, footer, .mbar, .skip-link").forEach(function (el) { if (open) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
      if (open) { drawer.removeAttribute("inert"); lastFocus = doc.activeElement; var a = drawer.querySelector("a"); if (a) a.focus(); }
      else { drawer.setAttribute("inert", ""); if (lastFocus) burger.focus(); }
    };
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setMenu(false); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (m) { if (m.matches && drawer.classList.contains("is-open")) setMenu(false); });
  }

  /* ----- Reveals ----- */
  var revealEls = doc.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add("is-in"); }); }

  /* ----- Parallax léger (transform uniquement) ----- */
  var par = [].slice.call(doc.querySelectorAll("[data-parallax]"));
  if (par.length && !reduce) {
    var ticking = false;
    var update = function () {
      ticking = false;
      if (window.innerWidth < 640) { par.forEach(function (el) { el.style.transform = ""; }); return; }
      var vh = window.innerHeight;
      par.forEach(function (el) {
        var r = (el.closest(".ph") || el.parentElement).getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
        p = Math.max(-1, Math.min(1, p));
        el.style.transform = "translate3d(0," + (p * -5).toFixed(2) + "%,0) scale(1.12)";
      });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update); update();
  }

  /* ----- Progression : couronne sur un filet (desktop, transform uniquement) ----- */
  if (!reduce && window.matchMedia('(min-width: 1100px)').matches) {
    var pc = doc.createElement('div'); pc.className = 'progress-crown'; pc.setAttribute('aria-hidden', 'true');
    var pcr = doc.createElement('span'); pcr.className = 'crown'; pc.appendChild(pcr); doc.body.appendChild(pc);
    var pt = false;
    var pu = function () {
      pt = false;
      var max = doc.documentElement.scrollHeight - window.innerHeight, p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      pcr.style.transform = 'translate3d(0,' + (p * (pc.offsetHeight - 8)).toFixed(1) + 'px,0)';
    };
    window.addEventListener('scroll', function () { if (!pt) { pt = true; requestAnimationFrame(pu); } }, { passive: true });
    window.addEventListener('resize', pu); pu();
  }

  /* ----- Carousel flotte ----- */
  doc.querySelectorAll("[data-fleet]").forEach(function (box) {
    var track = box.querySelector(".fleet__track");
    box.querySelectorAll("[data-dir]").forEach(function (b) {
      b.addEventListener("click", function () {
        var card = track.querySelector(".card");
        track.scrollBy({ left: Number(b.dataset.dir) * (card.offsetWidth + 20), behavior: reduce ? "auto" : "smooth" });
      });
    });
    var dots = box.querySelector('.fleet__dots'), cards = [].slice.call(track.querySelectorAll('.card'));
    if (dots && cards.length) {
      cards.forEach(function () { dots.appendChild(doc.createElement('i')); });
      var marks = [].slice.call(dots.children);
      var sync = function () {
        var best = 0, bd = 1e9, base = track.getBoundingClientRect().left;
        cards.forEach(function (c, i) { var d = Math.abs(c.getBoundingClientRect().left - base - parseFloat(getComputedStyle(track).paddingLeft)); if (d < bd) { bd = d; best = i; } });
        marks.forEach(function (m, i) { m.classList.toggle('is-on', i === best); });
      };
      track.addEventListener('scroll', function () { requestAnimationFrame(sync); }, { passive: true });
      window.addEventListener('resize', sync); sync();
    }
  });

  /* ----- Lightbox accessible (dialog natif : focus piégé, Échap) ----- */
  var items = [].slice.call(doc.querySelectorAll("[data-lightbox]"));
  var lb = doc.getElementById("lightbox");
  if (items.length && lb && typeof lb.showModal === "function") {
    var img = lb.querySelector("img"), cap = lb.querySelector(".lightbox__cap"), idx = 0, opener = null;
    var show = function (i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      img.src = it.dataset.full; img.alt = it.dataset.alt || "";
      if (it.dataset.ratio) { img.style.cssText = "aspect-ratio:" + it.dataset.ratio + ";width:auto;height:100%;object-fit:cover;object-position:" + (it.dataset.pos || "50% 50%"); } else { img.style.cssText = ""; }
      cap.textContent = '';
      var cr = doc.createElement('span'); cr.className = 'crown'; cr.setAttribute('aria-hidden', 'true'); cap.appendChild(cr);
      cap.appendChild(doc.createTextNode((idx + 1) + ' / ' + items.length + ' · ' + (it.dataset.caption || '')));
    };
    items.forEach(function (it, i) { it.addEventListener("click", function () { opener = it; show(i); lb.showModal(); lb.querySelector(".lightbox__close").focus(); }); });
    lb.querySelector("[data-prev]").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector("[data-next]").addEventListener("click", function () { show(idx + 1); });
    lb.querySelector(".lightbox__close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox__stage")) lb.close(); });
    lb.addEventListener("close", function () { if (opener) opener.focus(); });
  }

  /* ----- Formulaire de devis ----- */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  doc.querySelectorAll("form[data-mj-form]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var dateInput = form.querySelector('input[type="date"]'); if (dateInput) dateInput.min = iso;
    var qs = new URLSearchParams(location.search);
    ["vehicule", "type"].forEach(function (name) {
      var val = qs.get(name), sel = form.querySelector('select[name="' + name + '"]');
      if (val && sel) { var o = [].slice.call(sel.options).filter(function (x) { return x.value.toLowerCase() === val.toLowerCase(); })[0]; if (o) sel.value = o.value; }
    });

    var msgs = { required: "Ce champ est obligatoire.", email: "Indiquez une adresse e-mail valide.", tel: "Indiquez un numéro de téléphone valide.", past: "La date doit être aujourd'hui ou ultérieure.", consent: "Merci de cocher la case pour que nous puissions vous répondre." };
    function setErr(f, text) {
      var wrap = f.closest(".field") || f.closest(".check"), err = wrap.querySelector(".err");
      if (text) {
        if (!err) { err = doc.createElement("p"); err.className = "err"; err.id = f.id + "-err"; wrap.appendChild(err); }
        err.textContent = text; f.setAttribute("aria-invalid", "true"); f.setAttribute("aria-describedby", err.id);
      } else { if (err) err.remove(); f.removeAttribute("aria-invalid"); f.removeAttribute("aria-describedby"); }
    }
    function check(f) {
      var val = (f.type === "checkbox" ? f.checked : f.value.trim()), m = "";
      if (f.required && !val) m = f.type === "checkbox" ? msgs.consent : msgs.required;
      else if (val && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) m = msgs.email;
      else if (val && f.type === "tel" && (val.replace(/\D/g, "").length < 9 || !/^[+\d\s().-]+$/.test(val))) m = msgs.tel;
      else if (val && f.type === "date" && val < iso) m = msgs.past;
      setErr(f, m); return !m;
    }
    var fields = [].slice.call(form.querySelectorAll("input, select, textarea")).filter(function (f) { return f.name && f.name !== "website"; });
    fields.forEach(function (f) {
      f.addEventListener("blur", function () { if (f.value || f.getAttribute("aria-invalid")) check(f); });
      f.addEventListener("input", function () { if (f.getAttribute("aria-invalid")) check(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status"; status.textContent = "";
      var failMsg = "Votre demande n'a pas pu être envoyée. Vérifiez les champs signalés ou appelez-nous au " + cfg.phone + ".";
      var bad = fields.filter(function (f) { return !check(f); });
      if (bad.length) { status.className = "form-status is-error"; status.textContent = failMsg; bad[0].focus(); return; }
      if (form.querySelector('[name="website"]').value) return; /* honeypot */
      var data = {}; fields.forEach(function (f) { data[f.name] = f.type === "checkbox" ? (f.checked ? "oui" : "non") : f.value.trim(); });
      var btn = form.querySelector('button[type="submit"]');
      if (cfg.formEndpoint) {
        btn.disabled = true; status.textContent = "Envoi en cours…";
        fetch(cfg.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); window.location.href = cfg.thanksUrl || "/merci/"; })
          .catch(function () { btn.disabled = false; status.className = "form-status is-error"; status.textContent = failMsg; });
      } else {
        var labels = [["Nom", "nom"], ["E-mail", "email"], ["Téléphone", "telephone"], ["Date de l'événement", "date"], ["Heure de prise en charge", "heure"], ["Lieu de prise en charge", "lieu"], ["Lieu d'arrivée", "arrivee"], ["Type d'événement", "type"], ["Véhicule souhaité", "vehicule"], ["Message", "message"]];
        var lines = labels.filter(function (p) { return data[p[1]]; }).map(function (p) { return p[0] + " : " + data[p[1]]; });
        var url = "mailto:" + cfg.mailTo + "?subject=" + encodeURIComponent("Demande de devis - " + data.type + " - " + data.date) + "&body=" + encodeURIComponent(lines.join("\n"));
        status.className = "form-status is-ok";
        status.innerHTML = "Votre messagerie s'ouvre avec votre demande pré-remplie : il ne reste qu'à l'envoyer. Si rien ne s'ouvre, écrivez-nous à <a class=\"text-link\" href=\"mailto:" + cfg.mailTo + "\">" + cfg.mailTo + "</a> ou appelez le " + cfg.phone + ".";
        window.location.href = url;
      }
    });
  });
})();
