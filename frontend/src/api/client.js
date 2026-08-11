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

/* =========================================================
   CSRF
   ========================================================= */

function getCSRFTokenFromCookie() {
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();

    if (cookie.startsWith('csrftoken=')) {
      return decodeURIComponent(
        cookie.substring('csrftoken='.length)
      );
    }
  }

  return '';
}

/*
 * Singleton in-flight promise for /csrf/.
 *
 * Without this, two requests firing back-to-back (e.g. login
 * immediately followed by a session call) can each see "no cookie
 * yet", each independently call GET /csrf/, and each get back a
 * DIFFERENT csrf secret from Django. Whichever response lands last
 * wins the browser's cookie jar — the other request already grabbed
 * a token that no longer matches anything, and gets rejected with
 * "CSRF token ... incorrect".
 *
 * By sharing one in-flight fetch, every caller waits on the same
 * request and reads the same resulting cookie.
 */
let csrfFetchPromise = null;

async function ensureCSRFToken() {
  const existing = getCSRFTokenFromCookie();
  if (existing) return existing;

  if (!csrfFetchPromise) {
    csrfFetchPromise = api.get('/csrf/').finally(() => {
      csrfFetchPromise = null;
    });
  }

  await csrfFetchPromise;
  return getCSRFTokenFromCookie();
}

/*
 * Serialize all mutating (POST/PUT/PATCH/DELETE) requests through a
 * shared tail promise.
 *
 * Why this matters beyond ensureCSRFToken(): Django's login() call
 * ROTATES the CSRF token as a deliberate anti session-fixation
 * measure. If your app code fires a second mutating request before
 * awaiting the login response (or in parallel with it, e.g. via
 * Promise.all or a fire-and-forget call in a useEffect), that second
 * request's interceptor can read the cookie BEFORE the browser has
 * applied the new Set-Cookie from login's response — attaching an
 * already-rotated-out token.
 *
 * Chaining every mutating request onto one queue forces them to run
 * strictly one at a time, in the order they were issued, so each one
 * always reads the cookie state left behind by the previous one.
 */
let requestQueue = Promise.resolve();

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();

  if (!['post', 'put', 'patch', 'delete'].includes(method)) {
    return config;
  }

  const attachToken = async () => {
    const token = await ensureCSRFToken();
    if (token) {
      config.headers['X-CSRFToken'] = token;
    }
    return config;
  };

  // Chain onto the queue regardless of whether the previous entry
  // succeeded or failed, so one rejected request can't wedge the
  // queue for everything after it.
  const next = requestQueue.then(attachToken, attachToken);
  requestQueue = next.then(
    () => undefined,
    () => undefined
  );

  return next;
});

/*
 * Call this once, early, on app startup (e.g. in main.jsx before
 * rendering, or in a top-level auth-check effect) to prime the CSRF
 * cookie before any mutating requests exist to race each other.
 * Not required for correctness now that requests are queued and
 * ensureCSRFToken() is a singleton, but it removes the very first
 * cold-start round trip from the critical path.
 */
export async function primeCSRF() {
  await ensureCSRFToken();
}

/* =========================================================
   AUTH
   ========================================================= */

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

/* =========================================================
   SESSION
   ========================================================= */

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

/* =========================================================
   ACTIVITIES
   ========================================================= */

export const activityAPI = {
  submit: (activityNumber, data) =>
    api.post(
      `/activity/${activityNumber}/submit/`,
      data
    ),
};

/* =========================================================
   ASSESSMENT
   ========================================================= */

export const assessmentAPI = {
  getThinkingStyles: () =>
    api.get('/thinking-styles/'),

  submitValidation: (domain, data) =>
    api.post(
      `/validation/${domain}/submit/`,
      data
    ),

  getResults: () =>
    api.get('/results/'),

  getRoadmap: (domain) =>
    api.get(`/roadmap/${domain}/`),
};

/* =========================================================
   DEEP DIVE
   ========================================================= */

export const deepDiveAPI = {
  start: (domain) =>
    api.post(`/deep-dive/${domain}/start/`),

  sendMessage: (domain, data) =>
    api.post(
      `/deep-dive/${domain}/message/`,
      data
    ),

  skip: (domain) =>
    api.post(`/deep-dive/${domain}/skip/`),
};

/* =========================================================
   ANALYTICS
   ========================================================= */

export const analyticsAPI = {
  get: () =>
    api.get('/analytics/'),
};

export default api;
