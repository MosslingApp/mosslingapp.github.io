"use strict";

document.documentElement.classList.add("js");

// Mascots: pause off-screen animations; wake the final CTA mascot once it is 40% visible.
// The motion itself is CSS-only and gated by prefers-reduced-motion in styles.css.
(function setUpMascots() {
  const waking = document.querySelectorAll(".mascot-wake-on-view");
  if (!("IntersectionObserver" in window)) {
    waking.forEach((m) => m.classList.add("is-awake"));
    return;
  }

  const pauser = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("m-paused", !e.isIntersecting));
  });
  document.querySelectorAll("svg.mascot").forEach((m) => pauser.observe(m));

  const waker = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-awake");
        observer.unobserve(e.target);
      });
    },
    { threshold: 0.4 },
  );
  waking.forEach((m) => waker.observe(m));
})();

// "How it works" tabs. Without JS all three steps stay visible.
(function setUpTabs() {
  const tablist = document.querySelector(".tabs");
  if (!tablist) return;
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

  function select(tab) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  tablist.hidden = false;
  select(tabs[0]);
})();

// Waitlist forms. Inert unless <body data-waitlist="open">.
// Submission choice is documented in landing/README.md.
(function setUpWaitlist() {
  if (document.body.dataset.waitlist !== "open") return;

  document.querySelectorAll(".waitlist-form").forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const error = form.querySelector(".form-error");
    const success = form.parentElement.querySelector(".form-success");

    // Our own messages replace the browser's validation bubbles when JS runs.
    form.noValidate = true;

    function showError(message) {
      error.textContent = message;
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }

    function clearError() {
      error.hidden = true;
      error.textContent = "";
      input.removeAttribute("aria-invalid");
    }

    input.addEventListener("input", () => {
      if (!error.hidden) clearError();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      input.value = input.value.trim();

      if (input.value === "") return showError("Enter your email first.");
      if (!input.checkValidity()) return showError("That email doesn’t look right. Check it and try again.");
      clearError();

      button.disabled = true;
      try {
        // Cross-origin: the response is opaque, so success is assumed once the request leaves.
        await fetch(form.action, {
          method: "POST",
          mode: "no-cors",
          body: new URLSearchParams(new FormData(form)),
        });
        form.hidden = true;
        success.hidden = false;
        success.focus();
      } catch {
        button.disabled = false;
        showError("Something went wrong. Check your connection and try again.");
      }
    });
  });
})();
