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
 * Singleton in-flight promise for /csrf/. Prevents two concurrent
 * "no cookie yet" callers from each independently fetching a
 * different csrf secret.
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
 * queue that blocks on the FULL request/response round trip — not
 * just on reading/attaching the CSRF token.
 *
 * This matters because Django's login()/register() ROTATE the CSRF
 * token as an anti session-fixation measure, and that rotation is
 * only guaranteed to be applied to the browser's cookie jar once the
 * response has actually been received. A queue that only serializes
 * "who reads the cookie first" (the previous version of this file)
 * still lets a second mutating request start while the first one is
 * still in flight — it just moves the race slightly later without
 * closing it.
 *
 * Implementation: each mutating request installs a new "tail" promise
 * in `queueTail`, that IT owns the resolution of. The next mutating
 * request awaits the PREVIOUS tail before it's even allowed to read
 * the CSRF cookie. The current request's tail is only resolved from
 * the response (or error) interceptor — i.e. once the round trip,
 * including the browser applying any rotated Set-Cookie, is done.
 */
let queueTail = Promise.resolve();

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();

  if (!['post', 'put', 'patch', 'delete'].includes(method)) {
    return config;
  }

  const previousTail = queueTail;
  let releaseQueue;
  queueTail = new Promise((resolve) => {
    releaseQueue = resolve;
  });
  // Stashed on the config so the response/error interceptor (which
  // runs after the network round trip completes) can release the
  // next request in line.
  config.__releaseQueue = releaseQueue;

  return previousTail
    .then(() => ensureCSRFToken())
    .then((token) => {
      if (token) {
        config.headers['X-CSRFToken'] = token;
      }
      return config;
    })
    .catch((err) => {
      // Attaching the token itself failed (e.g. the /csrf/ priming
      // call failed) — this request never reaches the network, so
      // the response interceptor never fires for it. Release the
      // queue here instead, or every subsequent mutating request
      // wedges forever.
      releaseQueue();
      throw err;
    });
});

api.interceptors.response.use(
  (response) => {
    response.config.__releaseQueue?.();
    return response;
  },
  (error) => {
    error.config?.__releaseQueue?.();
    return Promise.reject(error);
  }
);

/*
 * Optional: call once, early, to remove the very first cold-start
 * /csrf/ round trip from the critical path. Not required for
 * correctness — ensureCSRFToken() + the queue above handle it lazily
 * either way.
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
