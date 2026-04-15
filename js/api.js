/* =============================================
   ETI CORE UTILITIES
   api.js — Services, Auth, Toast, Theme
============================================= */

// ---- CONFIG ----
const ETI_CONFIG = {
  BASE_URL: window.ETI_BASE_URL || 'http://localhost:3000/api/v1',
  RETRY_COUNT: 3,
  RETRY_BASE_DELAY: 300,
};

// ---- STORAGE HELPERS ----
const Store = {
  set(key, val) { try { localStorage.setItem(`eti_${key}`, JSON.stringify(val)); } catch(e){} },
  get(key) { try { const v = localStorage.getItem(`eti_${key}`); return v ? JSON.parse(v) : null; } catch(e){ return null; } },
  remove(key) { try { localStorage.removeItem(`eti_${key}`); } catch(e){} },
  clear() { Object.keys(localStorage).filter(k => k.startsWith('eti_')).forEach(k => localStorage.removeItem(k)); }
};

// ---- RETRY LOGIC ----
async function withRetry(fn, retries = ETI_CONFIG.RETRY_COUNT, delay = ETI_CONFIG.RETRY_BASE_DELAY) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === retries;
      const isClientError = err?.status >= 400 && err?.status < 500;
      if (isLast || isClientError) throw err;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }
}

// ---- HTTP CLIENT ----
async function http(method, path, body = null, BASE_URL = ETI_CONFIG.BASE_URL, opts = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...opts.headers };

  const token = Store.get('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers, credentials: 'include' };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(url, config);
  let data;
  try { data = await res.json(); } catch(e) { data = {}; }

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---- AUTH SERVICE ----
const AuthService = {
  async login(email, password) {
    return withRetry(() => http('POST', '/auth/login', { email, password }));
  },

  async register(payload) {
    return withRetry(() => http('POST', '/auth/register', payload));
  },

  async getMe() {
    return withRetry(() => http('GET', '/auth/me'));
  },

  async updateProfile(payload) {
    return withRetry(() => http('PUT', '/auth/me', payload));
  },

  logout() {
    Store.clear();
    window.location.href = '/pages/login.html';
  },

  isLoggedIn() {
    return !!(Store.get('user') || Store.get('token'));
  },

  saveSession(user, token) {
    Store.set('user', user);
    if (token) Store.set('token', token);
  },

  getUser() { return Store.get('user'); }
};

// ---- COMPETITION SERVICE ----
const CompetitionService = {
  async list() {
    return withRetry(() => http('GET', '/competitions/'));
  },

  setSelected(id) { Store.set('selected_competition', id); },
  getSelected() { return Store.get('selected_competition'); },
  clearSelected() { Store.remove('selected_competition'); }
};

// ---- PAYMENT SERVICE ----
const PaymentService = {
  async getMyPayments() {
    return withRetry(() => http('GET', '/payments/my-payments'));
  }
};

// ---- TOAST SYSTEM ----
const Toast = (() => {
  let container;

  function getContainer() {
    if (!container) {
      container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }
    }
    return container;
  }

  const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  function show(type, title, message = '', duration = 4000) {
    const c = getContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${ICONS[type]}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;
    c.appendChild(el);

    if (duration > 0) {
      setTimeout(() => {
        el.classList.add('fade-out');
        setTimeout(() => el.remove(), 300);
      }, duration);
    }
    return el;
  }

  return {
    success: (t, m, d) => show('success', t, m, d),
    error: (t, m, d) => show('error', t, m, d),
    warning: (t, m, d) => show('warning', t, m, d),
    info: (t, m, d) => show('info', t, m, d),
  };
})();

// ---- THEME SYSTEM ----
const Theme = {
  STORAGE_KEY: 'eti_theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'light';
    this.apply(saved);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    this.apply(next);
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  }
};

// ---- AUTH GUARD ----
function requireAuth() {
  if (!AuthService.isLoggedIn()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

function requireGuest() {
  if (AuthService.isLoggedIn()) {
    window.location.href = '/pages/dashboard.html';
    return false;
  }
  return true;
}

// ---- NAVBAR HELPERS ----
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;

  // Scroll shadow
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Theme toggle
  const themeBtn = nav.querySelector('.theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', () => Theme.toggle());

  // Mobile hamburger
  const hamburger = nav.querySelector('.nav-hamburger');
  const navMenu = nav.querySelector('.navbar-nav');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
  }

  // Active link
  const links = nav.querySelectorAll('.nav-link');
  links.forEach(link => {
    if (link.href === window.location.href) link.classList.add('active');
  });

  // Auth state in navbar
  const user = AuthService.getUser();
  const loginBtn = nav.querySelector('[data-nav="login"]');
  const registerBtn = nav.querySelector('[data-nav="register"]');
  const userMenu = nav.querySelector('[data-nav="user"]');
  const logoutBtn = nav.querySelector('[data-nav="logout"]');
  const usernameEl = nav.querySelector('[data-nav="username"]');

  if (user) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (registerBtn) registerBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (usernameEl) usernameEl.textContent = user.username || 'Me';
  } else {
    if (userMenu) userMenu.classList.add('hidden');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => AuthService.logout());
  }
}

// ---- FORM VALIDATION ----
const Validators = {
  required: (v) => v && v.trim() !== '' ? null : 'This field is required.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address.',
  minLength: (n) => (v) => v && v.length >= n ? null : `Minimum ${n} characters required.`,
  password: (v) => v && v.length >= 8 ? null : 'Password must be at least 8 characters.',
};

function validateField(input, validators = []) {
  const errorEl = input.closest('.form-group')?.querySelector('.form-error');
  const val = input.value;
  for (const validate of validators) {
    const err = validate(val);
    if (err) {
      input.classList.add('error');
      if (errorEl) { errorEl.textContent = err; errorEl.classList.add('visible'); }
      return false;
    }
  }
  input.classList.remove('error');
  if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
  return true;
}

function setButtonLoading(btn, loading = true) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span><span class="btn-text">Please wait…</span>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
  }
}

// ---- PAGE LOADER ----
function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 400);
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  initNavbar();
  hidePageLoader();
});
