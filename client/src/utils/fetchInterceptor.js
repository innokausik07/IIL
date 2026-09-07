/**
 * Global Fetch Interceptor
 * Automatically attaches Authorization header with Bearer JWT token
 * to all /api calls across the frontend.
 */
const originalFetch = window.fetch;

window.fetch = async (input, init = {}) => {
  let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');

  // Intercept relative /api or local API calls
  if (url.startsWith('/api') || url.includes('/api/')) {
    const token = localStorage.getItem('erp_token') || localStorage.getItem('token');
    if (token) {
      let headers;
      if (init.headers instanceof Headers) {
        headers = init.headers;
      } else if (Array.isArray(init.headers)) {
        headers = new Headers(init.headers);
      } else if (typeof init.headers === 'object' && init.headers !== null) {
        headers = new Headers(init.headers);
      } else {
        headers = new Headers(input instanceof Request ? input.headers : {});
      }

      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      init = { ...init, headers };
    }
  }

  return originalFetch(input, init);
};
