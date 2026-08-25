(function () {
  "use strict";

  var USERS_KEY = "nnfb_users";
  var SESSION_KEY = "nnfb_session";

  function readUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      var session = raw ? JSON.parse(raw) : null;
      if (session && (session.phone === "030 29005862" || session.phone === "+493029005862")) {
        session.phone = "+4915215729944";
        setSession(session);
      }
      if (session && (session.name === "Test Nutzer" || session.name === "Test")) {
        session.name = "Mark";
        setSession(session);
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  function setSession(session) {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }

  function bytesToHex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  function randomSalt() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }

  function sha256(str) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(bytesToHex);
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function toSession(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      createdAt: user.createdAt
    };
  }

  function signup(data) {
    var name = (data.name || "").trim();
    var email = (data.email || "").trim().toLowerCase();
    var phone = (data.phone || "").trim();
    var password = data.password || "";
    var confirm = data.confirm || "";

    if (!name) return Promise.reject(new Error("Bitte geben Sie Ihren Namen ein."));
    if (!validEmail(email)) return Promise.reject(new Error("Bitte geben Sie eine gültige E-Mail-Adresse ein."));
    if (password.length < 8) return Promise.reject(new Error("Das Passwort muss mindestens 8 Zeichen haben."));
    if (password !== confirm) return Promise.reject(new Error("Die Passwörter stimmen nicht überein."));

    var users = readUsers();
    if (users.some(function (u) { return u.email === email; })) {
      return Promise.reject(new Error("Für diese E-Mail existiert bereits ein Konto. Bitte anmelden."));
    }

    var salt = randomSalt();
    return sha256(salt + password).then(function (hash) {
      var user = {
        id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
        name: name,
        email: email,
        phone: phone,
        passwordHash: hash,
        salt: salt,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      writeUsers(users);
      setSession(toSession(user));
      return user;
    });
  }

  function login(data) {
    var email = (data.email || "").trim().toLowerCase();
    var password = data.password || "";
    var user = readUsers().find(function (u) { return u.email === email; });
    if (!user) return Promise.reject(new Error("E-Mail oder Passwort ist falsch."));

    return sha256(user.salt + password).then(function (hash) {
      if (hash !== user.passwordHash) throw new Error("E-Mail oder Passwort ist falsch.");
      setSession(toSession(user));
      return user;
    });
  }

  function logout() {
    setSession(null);
  }

  function ensureDemoUser() {
    var email = "test@test.com";
    var users = readUsers().filter(function (u) { return u.email !== email; });
    var salt = randomSalt();
    return sha256(salt + "test123").then(function (hash) {
      users.push({
        id: "demo-test-user",
        name: "Mark",
        email: email,
        phone: "+4915215729944",
        passwordHash: hash,
        salt: salt,
        createdAt: "2026-01-15T10:00:00.000Z"
      });
      writeUsers(users);
    });
  }

  function firstName(session) {
    return ((session && session.name) || "Konto").split(" ")[0];
  }

  function paintNav() {
    var session = getSession();
    var loginEl = document.querySelector("[data-auth='login']");
    var signupEl = document.querySelector("[data-auth='signup']");
    var accountEl = document.querySelector("[data-auth='account']");
    var logoutEl = document.querySelector("[data-auth='logout']");

    if (session) {
      if (loginEl) loginEl.hidden = true;
      if (signupEl) signupEl.hidden = true;
      if (accountEl) {
        accountEl.hidden = false;
        accountEl.textContent = firstName(session);
      }
      if (logoutEl) logoutEl.hidden = false;
    } else {
      if (loginEl) loginEl.hidden = false;
      if (signupEl) signupEl.hidden = false;
      if (accountEl) accountEl.hidden = true;
      if (logoutEl) logoutEl.hidden = true;
    }
  }

  function showError(form, message) {
    var box = form.querySelector("[data-auth-error]");
    if (!box) return;
    box.hidden = !message;
    box.textContent = message || "";
  }

  function bindForms() {
    var signupForm = document.querySelector("[data-auth-form='signup']");
    if (signupForm) {
      if (getSession()) {
        window.location.replace("app.html");
        return;
      }
      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = signupForm.querySelector("[type='submit']");
        showError(signupForm, "");
        if (btn) btn.disabled = true;
        signup({
          name: signupForm.name.value,
          email: signupForm.email.value,
          phone: signupForm.phone ? signupForm.phone.value : "",
          password: signupForm.password.value,
          confirm: signupForm.confirm.value
        }).then(function () {
          window.location.href = "app.html";
        }).catch(function (err) {
          showError(signupForm, err.message || "Konto konnte nicht erstellt werden.");
          if (btn) btn.disabled = false;
        });
      });
    }

    var loginForm = document.querySelector("[data-auth-form='login']");
    if (loginForm) {
      if (getSession()) {
        window.location.replace("app.html");
        return;
      }
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = loginForm.querySelector("[type='submit']");
        showError(loginForm, "");
        if (btn) btn.disabled = true;
        login({
          email: loginForm.email.value,
          password: loginForm.password.value
        }).then(function () {
          window.location.href = "app.html";
        }).catch(function (err) {
          showError(loginForm, err.message || "Anmeldung nicht möglich.");
          if (btn) btn.disabled = false;
        });
      });
    }

    var accountRoot = document.querySelector("[data-auth-account]");
    if (accountRoot) {
      if (getSession()) window.location.replace("app.html");
      else window.location.replace("login.html");
      return;
    }
  }

  function bindLogout() {
    document.querySelectorAll("[data-auth='logout']").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        logout();
        window.location.href = "index.html";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureDemoUser().then(function () {
      paintNav();
      bindLogout();
      bindForms();
    });
  });

  window.NNAuth = { getSession: getSession, logout: logout, paintNav: paintNav, signup: signup, login: login, ensureDemoUser: ensureDemoUser };
})();
