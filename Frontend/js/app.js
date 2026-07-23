/* ==========================================================================
   EventSphere — Core Client, Auth & UI
   ========================================================================== */

const API_BASE = '/api';

// ── Auth ──
const Auth = {
  getToken: () => localStorage.getItem('es_access_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('es_user') || 'null'); } catch { return null; } },
  save(data) {
    if (data.accessToken) localStorage.setItem('es_access_token', data.accessToken);
    if (data.refreshToken) localStorage.setItem('es_refresh_token', data.refreshToken);
    if (data.user) localStorage.setItem('es_user', JSON.stringify(data.user));
  },
  clear() {
    localStorage.removeItem('es_access_token');
    localStorage.removeItem('es_refresh_token');
    localStorage.removeItem('es_user');
  },
  isLoggedIn() { return !!this.getToken(); },
  isOrganizer() { const u = this.getUser(); return u && (u.role === 'organizer' || u.role === 'admin'); },
  isAdmin() { const u = this.getUser(); return u && u.role === 'admin'; }
};

// ── Fetch Wrapper ──
async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      Auth.clear();
      window.location.href = '/login.html';
    }
    throw new Error(json.message || 'Request failed');
  }
  return json;
}

// ── Toast ──
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: 'check_circle', error: 'error', info: 'info' };
  toast.innerHTML = `<span class="material-symbols-outlined">${icons[type] || 'info'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Utilities ──
function escapeHtml(v = '') {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(d) { return d ? `${formatDate(d)} at ${formatTime(d)}` : '—'; }

function timeUntil(d) {
  if (!d) return '';
  const diff = new Date(d) - new Date();
  if (diff < 0) return 'Past';
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)}mo`;
  if (days > 0) return `${days}d left`;
  return `${Math.floor(diff / 3600000)}h left`;
}

function getSampleBanner(i) {
  const banners = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
  ];
  return banners[i % banners.length];
}

function tagForStatus(status) {
  const map = {
    draft: 'tag-amber', published: 'tag-blue', completed: 'tag-green', cancelled: 'tag-red',
    registered: 'tag-green', waitlisted: 'tag-amber', attended: 'tag-blue', cancelled: 'tag-red',
  };
  return map[status] || 'tag-gray';
}

function showLoading(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.innerHTML = '<div class="spinner-center"><div class="spinner"></div></div>';
}

function showEmpty(el, icon, title, text) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon"><span class="material-symbols-outlined">${icon || 'inbox'}</span></div><div class="empty-title">${title || 'Nothing here'}</div>${text ? `<div class="empty-text">${text}</div>` : ''}</div>`;
}

function requireAuth() {
  if (!Auth.isLoggedIn()) { window.location.href = '/login.html'; return false; }
  return true;
}

// ── Navbar ──
function renderNavbar(activePage = '') {
  const user = Auth.getUser();
  const isOrg = Auth.isOrganizer();
  const loggedIn = !!user;
  const brandHref = loggedIn ? '/dashboard.html' : '/';
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const displayName = user?.name || 'User';

  let navLinks = '';
  if (!loggedIn) {
    navLinks += `<a href="/" class="nav-link ${activePage === 'home' ? 'active' : ''}"><span class="material-symbols-outlined">home</span> Home</a>`;
  }
  navLinks += `<a href="/events.html" class="nav-link ${activePage === 'events' ? 'active' : ''}"><span class="material-symbols-outlined">event</span> Events</a>`;
  if (loggedIn) {
    navLinks += `<a href="/dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}"><span class="material-symbols-outlined">dashboard</span> Dashboard</a>`;
    if (isOrg) {
      navLinks += `<a href="/create-event.html" class="nav-link ${activePage === 'create' ? 'active' : ''}"><span class="material-symbols-outlined">add_circle</span> Create</a>`;
    }
  }

  let navRight = '';
  if (loggedIn) {
    navRight = `<div class="nav-user"><div class="nav-avatar" title="${escapeHtml(displayName)}">${escapeHtml(initials)}</div><span class="nav-user-name">${escapeHtml(displayName)}</span><button class="btn btn-ghost btn-sm" onclick="logout()" title="Sign out"><span class="material-symbols-outlined" style="font-size:18px;">logout</span></button></div>`;
  } else {
    navRight = `<a href="/login.html" class="btn btn-secondary btn-sm">Log in</a><a href="/signup.html" class="btn btn-primary btn-sm">Sign up</a>`;
  }

  return `<nav class="navbar" id="main-navbar"><div class="container nav-inner"><a href="${brandHref}" class="navbar-brand"><div class="brand-icon"><span class="material-symbols-outlined">event</span></div>EventSphere</a><button class="menu-toggle" id="menu-toggle" aria-label="Toggle navigation"><span class="material-symbols-outlined">menu</span></button><div class="nav-links" id="nav-links">${navLinks}</div><div class="nav-right">${navRight}</div></div></nav>`;
}

function initNavbar() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      const isOpen = nav.classList.contains('open');
      toggle.querySelector('.material-symbols-outlined').textContent = isOpen ? 'close' : 'menu';
    });
  }
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function logout() {
  Auth.clear();
  showToast('Signed out', 'info');
  setTimeout(() => window.location.href = '/', 350);
}

// ── Status Badge ──
function statusBadge(status) {
  return `<span class="tag ${tagForStatus(status)}"><span class="tag-dot ${tagForStatus(status).replace('tag-', '')}"></span>${escapeHtml(status || 'unknown')}</span>`;
}

// ── Star Rating ──
function renderStars(rating, interactive = false, inputId = 'rating-input') {
  let html = `<div class="star-rating" ${interactive ? `id="${inputId}"` : ''}>`;
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= rating ? 'filled' : ''}" ${interactive ? `data-value="${i}" onclick="setRating(${i},'${inputId}')"` : ''}>★</span>`;
  }
  return html + '</div>';
}

function setRating(value, containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.dataset.rating = value;
  c.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('filled', i + 1 <= value));
}
