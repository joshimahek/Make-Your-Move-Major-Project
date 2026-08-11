import axios from 'axios';

const API_BASE =
  'https://make-your-move-backend.onrender.com/api';

/*
 * Main API client
 * Frontend: Vercel
 * Backend: Render
 */
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
 * Separate client used only for obtaining CSRF tokens.
 *
 * IMPORTANT:
 * We cannot use document.cookie here because the frontend
 * is hosted on Vercel while the CSRF cookie belongs to Render.
 *
 * Therefore we use the token returned directly by:
 * GET /api/csrf/
 */
const csrfApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let csrfToken = '';
let csrfRequest = null;

/*
 * Get a fresh CSRF token from Django.
 *
 * Singleton promise prevents multiple simultaneous requests
 * from requesting different CSRF tokens at the same time.
 */
async function refreshCSRFToken() {
  if (!csrfRequest) {
    csrfRequest = csrfApi
      .get('/csrf/')
      .then((response) => {
        csrfToken = response.data.csrfToken || '';
        return csrfToken;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }

  return csrfRequest;
}

/*
 * Get the currently known CSRF token.
 * If we don't have one yet, ask Django for one.
 */
async function getCSRFToken() {
  if (csrfToken) {
    return csrfToken;
  }

  return refreshCSRFToken();
}

/*
 * Add CSRF token to every unsafe request.
 */
api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();

  if (
    ['post', 'put', 'patch', 'delete'].includes(method)
  ) {
    const token = await getCSRFToken();

    config.headers = config.headers || {};

    if (token) {
      config.headers['X-CSRFToken'] = token;
    }
  }

  return config;
});

/*
 * If Django rejects a request because the CSRF token is stale,
 * get a completely fresh token and retry the request ONCE.
 *
 * This handles the token rotation that happens after login/register.
 */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    const detail = error.response?.data?.detail || '';

    const isCSRFError =
      status === 403 &&
      typeof detail === 'string' &&
      detail.toLowerCase().includes('csrf');

    if (
      isCSRFError &&
      originalRequest &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;

      try {
        /*
         * Throw away the old token.
         */
        csrfToken = '';

        /*
         * Ask Django for the current token.
         */
        const newToken = await refreshCSRFToken();

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers['X-CSRFToken'] = newToken;

        /*
         * Retry the original request once.
         */
        return api.request(originalRequest);
      } catch (refreshError) {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);


/* =========================================================
   AUTH
   ========================================================= */

export const authAPI = {

  register: async (data) => {
    const response = await api.post(
      '/auth/register/',
      data
    );

    /*
     * Django register() automatically logs the user in.
     * login() rotates the CSRF token.
     *
     * Get the new token before any context/session request.
     */
    csrfToken = '';
    await refreshCSRFToken();

    return response;
  },

  login: async (data) => {
    const response = await api.post(
      '/auth/login/',
      data
    );

    /*
     * Django login() rotates the CSRF token.
     */
    csrfToken = '';
    await refreshCSRFToken();

    return response;
  },

  logout: async () => {
    /*
     * Ensure logout uses the current token.
     */
    const token = await getCSRFToken();

    const response = await api.post(
      '/auth/logout/',
      {},
      {
        headers: {
          'X-CSRFToken': token,
        },
      }
    );

    /*
     * Clear our local copy.
     */
    csrfToken = '';

    return response;
  },

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
    api.post(
      `/deep-dive/${domain}/start/`
    ),

  sendMessage: (domain, data) =>
    api.post(
      `/deep-dive/${domain}/message/`,
      data
    ),

  skip: (domain) =>
    api.post(
      `/deep-dive/${domain}/skip/`
    ),
};


/* =========================================================
   ANALYTICS
   ========================================================= */

export const analyticsAPI = {

  get: () =>
    api.get('/analytics/'),
};


export default api;
