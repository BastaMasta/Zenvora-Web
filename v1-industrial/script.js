// ZENVORA — shared site behaviour (nav toggle, scroll reveal, quote form)
(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll reveal — classes are added entirely by JS, so content stays fully
  // visible by default (no-JS, JS-error, or reduced-motion users see everything
  // immediately; nothing depends on JS running for base visibility).
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealTargets = document.querySelectorAll(
      ".card, .value, .industry, .process li, .hero-inner, .glance .wrap, .jubail-inner, .cta-inner"
    );
    revealTargets.forEach(function (el) { el.classList.add("reveal-init"); });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  // Quote form: try the Flask API first, fall back to mailto (works on static hosting e.g. GitHub Pages)
  var form = document.getElementById("quote-form");
  var status = document.getElementById("form-status");

  function showStatus(message) {
    if (!status) return;
    status.textContent = message;
    status.classList.add("visible");
  }

  function mailtoFallback(data) {
    var subject = encodeURIComponent("Quote Request — " + (data.company || data.name || "Zenvora"));
    var body = encodeURIComponent(
      "Name: " + data.name + "\n" +
      "Company: " + (data.company || "-") + "\n" +
      "Email: " + data.email + "\n" +
      "Phone: " + (data.phone || "-") + "\n\n" +
      "Requirement:\n" + data.message
    );
    window.location.href = "mailto:info@zenvora.com?subject=" + subject + "&body=" + body;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());

      fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("request failed");
          return res.json();
        })
        .then(function () {
          showStatus("Thanks — we've received your request and will get back to you shortly.");
          form.reset();
        })
        .catch(function () {
          showStatus("Opening your email client to send this request...");
          mailtoFallback(data);
        });
    });
  }
})();
