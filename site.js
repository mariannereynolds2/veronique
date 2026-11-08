(function () {
  var EMAIL = "veroniqueelyotrisky2900@gmail.com";

  // menu mobile
  var burger = document.querySelector(".burger"), menu = document.querySelector(".menu");
  if (burger && menu) burger.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // année
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  // copier l'adresse
  document.querySelectorAll(".copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-copy");
      function done() { b.textContent = "Copié"; setTimeout(function () { b.textContent = "Copier"; }, 1800); }
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () {});
    });
  });

  // boutique : sélection des livres
  var cart = {}, list = document.getElementById("cart-list"), field = document.getElementById("cart-field");
  function key() { return "ve-cart"; }
  function save() { try { localStorage.setItem(key(), JSON.stringify(cart)); } catch (e) {} }
  function load() { try { cart = JSON.parse(localStorage.getItem(key()) || "{}") || {}; } catch (e) { cart = {}; } }
  function render() {
    document.querySelectorAll("[data-product]").forEach(function (p) {
      var id = p.getAttribute("data-product");
      p.querySelector("output").textContent = cart[id] || 0;
    });
    if (!list) return;
    var lines = [], items = [];
    document.querySelectorAll("[data-product]").forEach(function (p) {
      var id = p.getAttribute("data-product"), n = cart[id] || 0;
      if (n > 0) { var t = p.getAttribute("data-title"); items.push("<li><span>" + t + "</span><b>× " + n + "</b></li>"); lines.push(n + " × " + t); }
    });
    list.innerHTML = items.length ? items.join("") : '<li class="empty">Aucun livre sélectionné pour le moment.</li>';
    if (field) field.value = lines.join("\n");
  }
  if (document.querySelector("[data-product]")) {
    load();
    var pre = new URLSearchParams(location.search).get("livre");
    if (pre && !cart[pre]) cart[pre] = 1;
    document.querySelectorAll("[data-product]").forEach(function (p) {
      var id = p.getAttribute("data-product");
      p.querySelector(".plus").addEventListener("click", function () { cart[id] = Math.min((cart[id] || 0) + 1, 20); save(); render(); });
      p.querySelector(".minus").addEventListener("click", function () { cart[id] = Math.max((cart[id] || 0) - 1, 0); save(); render(); });
    });
    render();
  }

  // sujet prérempli depuis un lien (?sujet=invitation)
  var sj = new URLSearchParams(location.search).get("sujet"), sel = document.getElementById("f-sujet");
  if (sj && sel) { Array.prototype.forEach.call(sel.options, function (o) { if (o.value.toLowerCase() === sj.toLowerCase()) sel.value = o.value; }); }

  // formulaires
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var started = Date.now();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".form-msg"), btn = form.querySelector("button[type=submit]");
      if (form.getAttribute("data-form") === "commande" && field && !field.value) {
        msg.hidden = false; msg.className = "form-msg err"; msg.textContent = "Choisissez au moins un livre avant d'envoyer votre commande."; return;
      }
      var data = new FormData(form); data.append("started", started);
      btn.disabled = true; var label = btn.textContent; btn.textContent = "Envoi en cours…";
      fetch("/api/message", { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (!r.ok) throw new Error(r.message || "error");
          msg.hidden = false; msg.className = "form-msg ok";
          msg.textContent = form.getAttribute("data-ok");
          form.reset();
          if (form.getAttribute("data-form") === "commande") { cart = {}; save(); render(); }
        })
        .catch(function () {
          var body = [];
          data.forEach(function (v, k) { if (k !== "started" && k !== "site_web" && v) body.push(k + " : " + v); });
          var href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(form.getAttribute("data-subject")) + "&body=" + encodeURIComponent(body.join("\n"));
          msg.hidden = false; msg.className = "form-msg err";
          msg.innerHTML = "Le message n'a pas pu partir depuis le site. Vous pouvez l'envoyer directement par e‑mail : <a href=\"" + href + "\">ouvrir ma messagerie</a>, ou écrire à " + EMAIL + ".";
        })
        .finally(function () { btn.disabled = false; btn.textContent = label; });
    });
  });
})();
