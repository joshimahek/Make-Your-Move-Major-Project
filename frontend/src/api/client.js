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
 * just on reading/attaching the CSRF token. Django's login()/
 * register() rotate the CSRF token server-side; that rotation is
 * only reflected in the browser's cookie jar once the response has
 * actually landed, so the next mutating request must wait for that,
 * not just for "a token was read."
 */
let queueTail = Promise.resolve();

/*
 * In-flight de-duplication for mutating requests.
 *
 * Root cause of "register/login fires twice, one 403 one succeeds":
 * a submit button's `disabled={loading}` only takes effect after a
 * React re-render, so a fast double-click / double-tap / double-Enter
 * can invoke the same handler twice before the button visually
 * disables. Both calls independently reach client.js and both fire a
 * real network request. Whichever response's Set-Cookie lands last in
 * the browser silently "wins" the cookie jar — the other request's
 * CSRF/session state is now stale, and it fails.
 *
 * Fix: key in-flight mutating requests by method+url+body. If an
 * identical request is already in flight, return that SAME promise
 * instead of issuing a second network call. This makes duplicate
 * fires a no-op at the network layer, regardless of which button,
 * effect, or page triggered the duplicate — it doesn't rely on every
 * page remembering to add its own guard.
 */
const inFlightRequests = new Map();

function requestKey(config) {
  const body =
    typeof config.data === 'string'
      ? config.data
      : JSON.stringify(config.data ?? '');
  return `${config.method}:${config.url}:${body}`;
}

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();

  if (!['post', 'put', 'patch', 'delete'].includes(method)) {
    return config;
  }

  const key = requestKey(config);
  const existing = inFlightRequests.get(key);
  if (existing) {
    // An identical request is already in flight — piggyback on it
    // instead of sending a duplicate. Mark this config so axios
    // knows to short-circuit (handled below via adapter override).
    config.adapter = () => existing;
    return config;
  }

  const previousTail = queueTail;
  let releaseQueue;
  queueTail = new Promise((resolve) => {
    releaseQueue = resolve;
  });
  config.__releaseQueue = releaseQueue;
  config.__requestKey = key;

  return previousTail
    .then(() => ensureCSRFToken())
    .then((token) => {
      if (token) {
        config.headers['X-CSRFToken'] = token;
      }
      return config;
    })
    .catch((err) => {
      releaseQueue();
      throw err;
    });
});

api.interceptors.response.use(
  (response) => {
    response.config.__releaseQueue?.();
    if (response.config.__requestKey) {
      inFlightRequests.delete(response.config.__requestKey);
    }
    return response;
  },
  (error) => {
    error.config?.__releaseQueue?.();
    if (error.config?.__requestKey) {
      inFlightRequests.delete(error.config.__requestKey);
    }
    return Promise.reject(error);
  }
);

export async function primeCSRF() {
  await ensureCSRFToken();
}

/* =========================================================
   AUTH
   ========================================================= */

export const authAPI = {
  register: (data) =>
    trackInFlight('post', '/auth/register/', data, () =>
      api.post('/auth/register/', data)
    ),

  login: (data) =>
    trackInFlight('post', '/auth/login/', data, () =>
      api.post('/auth/login/', data)
    ),

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
    trackInFlight('post', '/session/context/', data, () =>
      api.post('/session/context/', data)
    ),
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

/*
 * Registers a request-level function under the same dedupe key the
 * interceptor uses, so a genuine duplicate call (e.g. from a
 * double-clicked submit button) reuses the in-flight promise instead
 * of the interceptor needing to intercept an already-created request.
 * This is the one applied to register/login/submitContext — the
 * three endpoints where a duplicate fire has real side effects
 * (double account creation, double session rotation).
 */
function trackInFlight(method, url, data, fn) {
  const body = JSON.stringify(data ?? '');
  const key = `${method}:${url}:${body}`;

  const existing = inFlightRequests.get(key);
  if (existing) return existing;

  const promise = fn().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

export default api;
