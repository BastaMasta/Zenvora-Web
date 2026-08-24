// ZENVORA — shared site behaviour (nav toggle, quote form)
(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
      if (!open) {
        nav.querySelectorAll(".nav-dropdown.open").forEach(closeDropdown);
      }
    });
    nav.querySelectorAll(".nav-dropdown-menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
    nav.querySelectorAll(":scope > a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  // Business Divisions / Industries dropdowns
  function closeDropdown(dropdown) {
    dropdown.classList.remove("open");
    var btn = dropdown.querySelector(".nav-dropdown-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  var dropdowns = document.querySelectorAll(".nav-dropdown");
  dropdowns.forEach(function (dropdown) {
    var btn = dropdown.querySelector(".nav-dropdown-toggle");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.contains("open");
      dropdowns.forEach(closeDropdown);
      if (!isOpen) {
        dropdown.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", function () {
    dropdowns.forEach(closeDropdown);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") dropdowns.forEach(closeDropdown);
  });

  // In-page anchor links: scroll manually so the sticky header never
  // overlaps the target (native fragment-nav scroll offset support is
  // inconsistent, so we compute the header height ourselves).
  var siteHeader = document.querySelector(".site-header");
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      var top;
      if (hash === "#top") {
        top = 0;
      } else {
        var offset = (siteHeader ? siteHeader.offsetHeight : 0) + 40;
        top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      }
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      history.pushState(null, "", hash);
    });
  });

  // Quote form: try the Flask API first, fall back to mailto (works on static hosting e.g. GitHub Pages)
  var form = document.getElementById("quote-form");
  var status = document.getElementById("form-status");

  function showStatus(message) {
    if (!status) return;
    status.textContent = message;
    status.classList.add("visible");
  }

  function mailtoFallback(data) {
    var subject = encodeURIComponent("Enquiry — " + (data.company || data.name || "Zenvora"));
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
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

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
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
          }
        });
    });
  }
})();
