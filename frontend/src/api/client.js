/**
 * Axios API client configured for Django backend.
 * Handles CSRF tokens and session cookies.
 */

import axios from 'axios';

const API_BASE =
  'https://make-your-move-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Read the current CSRF token directly from the browser cookie.
 * DO NOT cache it because Django can rotate the token after login.
 */
function getCSRFTokenFromCookie() {
  const name = 'csrftoken=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();

    if (cookie.startsWith(name)) {
      return decodeURIComponent(cookie.substring(name.length));
    }
  }

  return '';
}

/**
 * Ask Django to create/set a CSRF cookie.
 */
async function initializeCSRFToken() {
  await api.get('/csrf/');
  return getCSRFTokenFromCookie();
}

/**
 * Add the CURRENT CSRF token to every mutating request.
 */
api.interceptors.request.use(
  async (config) => {
    const method = config.method?.toLowerCase();

    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      let csrfToken = getCSRFTokenFromCookie();

      // If no CSRF cookie exists, ask Django for one.
      if (!csrfToken) {
        csrfToken = await initializeCSRFToken();
      }

      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   AUTH
========================= */

export const authAPI = {
  register: (data) =>
    api.post('/auth/register/', data),

  login: (data) =>
    api.post('/auth/login/', data),

  logout: () =>
    api.post('/auth/logout/'),

  me: () =>
    api.get('/auth/me/'),
};

/* =========================
   SESSION
========================= */

export const sessionAPI = {
  start: () =>
    api.post('/session/start/'),

  get: () =>
    api.get('/session/'),

  reset: () =>
    api.post('/session/reset/'),

  submitContext: (data) =>
    api.post('/session/context/', data),
};

/* =========================
   ACTIVITIES
========================= */

export const activityAPI = {
  submit: (activityNumber, data) =>
    api.post(`/activity/${activityNumber}/submit/`, data),
};

/* =========================
   ASSESSMENT
========================= */

export const assessmentAPI = {
  getThinkingStyles: () =>
    api.get('/thinking-styles/'),

  submitValidation: (domain, data) =>
    api.post(`/validation/${domain}/submit/`, data),

  getResults: () =>
    api.get('/results/'),

  getRoadmap: (domain) =>
    api.get(`/roadmap/${domain}/`),
};

/* =========================
   DEEP DIVE
========================= */

export const deepDiveAPI = {
  start: (domain) =>
    api.post(`/deep-dive/${domain}/start/`),

  sendMessage: (domain, data) =>
    api.post(`/deep-dive/${domain}/message/`, data),

  skip: (domain) =>
    api.post(`/deep-dive/${domain}/skip/`),
};

/* =========================
   ANALYTICS
========================= */

export const analyticsAPI = {
  get: () =>
    api.get('/analytics/'),
};

export default api;