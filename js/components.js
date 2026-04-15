/* =============================================
   ETI SHARED LAYOUT COMPONENTS
   components.js — Navbar, Footer, Loader
============================================= */

// ---- NAVBAR TEMPLATE ----
function renderNavbar({ activePage = '' } = {}) {
  const user = typeof AuthService !== 'undefined' ? AuthService.getUser() : null;
  return `
    <nav class="navbar" id="main-navbar">
      <div class="container navbar-inner">
        <a href="/pages/index.html" class="navbar-logo">
          <div class="logo-badge">ET</div>
          <span>ETI</span>
        </a>

        <ul class="navbar-nav" id="navbar-nav">
          <li><a href="/pages/index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">🏠 Home</a></li>
          <li><a href="/pages/competitions.html" class="nav-link ${activePage === 'competitions' ? 'active' : ''}">🏆 Competitions</a></li>
          ${user ? `
          <li><a href="/pages/dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">📊 Dashboard</a></li>
          <li><a href="/pages/profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">👤 Profile</a></li>
          <li><a href="/pages/payments.html" class="nav-link ${activePage === 'payments' ? 'active' : ''}">💳 Payments</a></li>
          ` : ''}
        </ul>

        <div class="navbar-actions">
          <button class="theme-toggle" title="Toggle theme" aria-label="Toggle theme">🌙</button>
          ${user ? `
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:0.85rem;color:var(--text-muted);font-family:'Montserrat',sans-serif;font-weight:500;">Hi, <strong data-nav="username" style="color:var(--primary);">${user.username || 'User'}</strong></span>
              <button class="btn btn-ghost btn-sm" data-nav="logout">Sign Out</button>
            </div>
          ` : `
            <a href="/pages/login.html" class="btn btn-ghost btn-sm" data-nav="login">Log In</a>
            <a href="/pages/register.html" class="btn btn-primary btn-sm" data-nav="register">Register</a>
          `}
          <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  `;
}

// ---- FOOTER TEMPLATE ----
function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-accent-line"></div>
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo">
              <div class="logo-badge" style="width:30px;height:30px;font-size:0.85rem;">ET</div>
              <span>Elora Tech Institute</span>
            </div>
            <p class="footer-tagline">Empowering the next generation of tech innovators through competitions, learning, and community.</p>
            <div class="footer-social">
              <a href="#" class="social-btn" title="Twitter/X">𝕏</a>
              <a href="#" class="social-btn" title="Instagram">📷</a>
              <a href="#" class="social-btn" title="LinkedIn">in</a>
            </div>
          </div>

          <div>
            <div class="footer-heading">Quick Links</div>
            <ul class="footer-links">
              <li><a href="/pages/index.html">Home</a></li>
              <li><a href="/pages/competitions.html">Competitions</a></li>
              <li><a href="/pages/login.html">Login</a></li>
              <li><a href="/pages/register.html">Register</a></li>
            </ul>
          </div>

          <div>
            <div class="footer-heading">Contact Us</div>
            <ul class="footer-links">
              <li><a href="https://www.eloratech.org" target="_blank">🌐 www.eloratech.org</a></li>
              <li><a href="mailto:hello@eloratech.org">✉️ hello@eloratech.org</a></li>
              <li><span style="color:var(--text-muted);font-size:.88rem;">🐦 @EloraTechInst</span></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Elora Tech Institute. All rights reserved.</span>
          <span>Built with 💛 for tech innovators</span>
        </div>
      </div>
    </footer>
  `;
}

// ---- PAGE LOADER TEMPLATE ----
function renderPageLoader() {
  return `
    <div class="page-loader" id="page-loader">
      <div class="pulse-logo">
        <div class="logo-badge" style="width:56px;height:56px;font-size:1.5rem;font-family:'Poppins',sans-serif;font-weight:800;background:var(--primary);color:#fff;border-radius:14px;display:grid;place-items:center;position:relative;overflow:hidden;">
          ET
          <span style="position:absolute;bottom:-5px;right:-5px;width:18px;height:18px;background:var(--secondary);border-radius:4px;"></span>
        </div>
        <span style="font-family:'Montserrat',sans-serif;font-weight:600;font-size:.85rem;color:var(--text-light);letter-spacing:.08em;text-transform:uppercase;">Loading…</span>
      </div>
    </div>
  `;
}

// ---- INJECT LAYOUT ----
function mountLayout({ page = '' } = {}) {
  // Inject loader first (instant)
  document.body.insertAdjacentHTML('afterbegin', renderPageLoader());
  // Inject navbar
  const navEl = document.getElementById('navbar-mount');
  if (navEl) navEl.innerHTML = renderNavbar({ activePage: page });
  // Inject footer
  const footerEl = document.getElementById('footer-mount');
  if (footerEl) footerEl.innerHTML = renderFooter();
}
