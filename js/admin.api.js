/* =============================================
   ETI ADMIN API SERVICES
   admin.api.js — Admin-only endpoints & guards
============================================= */

// Reuses ETI_CONFIG, Store, withRetry, http from api.js
// This file MUST be loaded after api.js


// ---- CONFIG ----
const ETI_ADMIN_CONFIG = {
  BASE_URL: window.ETI_ADMIN_BASE_URL || 'http://localhost:3000/api',
  RETRY_COUNT: 3,
  RETRY_BASE_DELAY: 300,
};


// ---- ADMIN AUTH GUARD ----
function requireAdmin() {
  const user = Store.get('user');
  if (!user) {
    window.location.href = '/pages/login.html';
    return false;
  }
  if (!user.is_admin) {
    window.location.href = '/pages/admin/denied.html';
    return false;
  }
  return true;
}

// ---- ADMIN BASE HTTP (prefixed) ----
function adminHttp(method, path, body = null) {
  return http(method, `/admin${path}`, body, BASE_URL=ETI_ADMIN_CONFIG.BASE_URL);
}

// ---- ADMIN USER SERVICE ----
const AdminUserService = {
  async getAll() {
    return withRetry(() => adminHttp('GET', '/auth'));
  },

  async getById(id) {
    return withRetry(() => adminHttp('GET', `/auth/${id}`));
  },

  async update(id, payload) {
    return withRetry(() => adminHttp('PUT', `/auth/${id}`, payload));
  },

  async delete(id) {
    return withRetry(() => adminHttp('DELETE', `/auth/${id}`));
  }
};

// ---- ADMIN COMPETITION SERVICE ----
const AdminCompetitionService = {
  async create(payload) {
    return withRetry(() => adminHttp('POST', '/competitions', payload));
  },

  async update(id, payload) {
    return withRetry(() => adminHttp('PUT', `/competitions/${id}`, payload));
  },

  async delete(id) {
    return withRetry(() => adminHttp('DELETE', `/competitions/${id}`));
  }
};

// ---- ADMIN PAYMENT SERVICE ----
const AdminPaymentService = {
  async getAll() {
    return withRetry(() => adminHttp('GET', '/payments'));
  },

  async getRecent(days = 7) {
    return withRetry(() => adminHttp('GET', `/payments/recent?days=${days}`));
  }
};

// ---- ADMIN PERMISSIONS SERVICE ----
const AdminPermissionService = {
  async activate(id) {
    return withRetry(() => adminHttp('PATCH', `/permissions/${id}/activate`));
  },

  async deactivate(id) {
    return withRetry(() => adminHttp('PATCH', `/permissions/${id}/deactivate`));
  },

  async makeAdmin(id) {
    return withRetry(() => adminHttp('PATCH', `/permissions/${id}/make-admin`));
  },

  async removeAdmin(id) {
    return withRetry(() => adminHttp('PATCH', `/permissions/${id}/remove-admin`));
  }
};

// ---- CONFIRM DIALOG ----
function confirmAction({ title, message, confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
        </div>
        <p style="color:var(--text-muted);font-size:.92rem;margin-bottom:28px;line-height:1.6;">${message}</p>
        <div class="flex gap-3">
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} flex-1" id="confirm-yes">${confirmText}</button>
          <button class="btn btn-ghost flex-1" id="confirm-no">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const close = (val) => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
      resolve(val);
    };

    overlay.querySelector('#confirm-yes').addEventListener('click', () => close(true));
    overlay.querySelector('#confirm-no').addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
}

// ---- ADMIN NAVBAR ----
function renderAdminNavbar(activePage = '') {
  const user = typeof AuthService !== 'undefined' ? AuthService.getUser() : null;
  return `
    <nav class="navbar admin-navbar" id="main-navbar">
      <div class="container navbar-inner">
        <a href="/pages/admin/dashboard.html" class="navbar-logo">
          <div class="logo-badge admin-badge">ET</div>
          <span>ETI <span class="admin-tag">Admin</span></span>
        </a>

        <ul class="navbar-nav" id="navbar-nav">
          <li><a href="/pages/admin/dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">📊 Dashboard</a></li>
          <li><a href="/pages/admin/users.html" class="nav-link ${activePage === 'users' ? 'active' : ''}">👥 Users</a></li>
          <li><a href="/pages/admin/competitions.html" class="nav-link ${activePage === 'competitions' ? 'active' : ''}">🏆 Competitions</a></li>
          <li><a href="/pages/admin/payments.html" class="nav-link ${activePage === 'payments' ? 'active' : ''}">💳 Payments</a></li>
        </ul>

        <div class="navbar-actions">
          <button class="theme-toggle" title="Toggle theme" aria-label="Toggle theme">🌙</button>
          <a href="/pages/index.html" class="btn btn-ghost btn-sm" title="Back to public site" style="font-size:.8rem;">← Public Site</a>
          ${user ? `
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="admin-user-pill">
                <span class="aup-dot"></span>
                <span style="font-size:.82rem;font-family:'Montserrat',sans-serif;font-weight:600;">${user.username || 'Admin'}</span>
              </div>
              <button class="btn btn-ghost btn-sm" data-nav="logout">Sign Out</button>
            </div>
          ` : ''}
          <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  `;
}

function mountAdminLayout(activePage = '') {
  document.body.insertAdjacentHTML('afterbegin', renderPageLoader());
  const navEl = document.getElementById('navbar-mount');
  if (navEl) navEl.innerHTML = renderAdminNavbar(activePage);
  const footerEl = document.getElementById('footer-mount');
  if (footerEl) footerEl.innerHTML = renderAdminFooter();
}

function renderAdminFooter() {
  return `
    <footer class="footer" style="padding:20px 0;">
      <div class="container">
        <div class="footer-bottom" style="border-top:none;padding-top:0;">
          <span style="font-size:.8rem;">ETI Admin Panel · © ${new Date().getFullYear()} Elora Tech Institute</span>
          <span style="font-size:.8rem;color:var(--text-light);">Restricted Access</span>
        </div>
      </div>
    </footer>
  `;
}

// ---- PAGINATION HELPER ----
function paginate(items, page, perPage = 15) {
  const total = items.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    items: items.slice(start, end),
    total, totalPages, page, perPage,
    hasPrev: page > 1,
    hasNext: page < totalPages
  };
}

function renderPagination(container, { page, totalPages, total, perPage }, onPageChange) {
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  const start = ((page - 1) * perPage) + 1;
  const end = Math.min(page * perPage, total);

  container.innerHTML = `
    <div class="pagination">
      <span class="pag-info">${start}–${end} of ${total}</span>
      <div class="pag-buttons">
        <button class="pag-btn" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">‹ Prev</button>
        ${Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map(p => p === '...'
            ? `<span class="pag-ellipsis">…</span>`
            : `<button class="pag-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`)
          .join('')}
        <button class="pag-btn" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">Next ›</button>
      </div>
    </div>
  `;

  container.querySelectorAll('.pag-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)));
  });
}
