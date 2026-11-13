import '@testing-library/jest-dom';

// Ensure native Node fetch and web standards are mapped to JSDOM environment
if (typeof globalThis.fetch !== 'undefined') {
  global.fetch = globalThis.fetch;
  global.Headers = globalThis.Headers;
  global.Request = globalThis.Request;
  global.Response = globalThis.Response;
  global.FormData = globalThis.FormData;
  if (typeof window !== 'undefined') {
    window.fetch = globalThis.fetch;
    window.Headers = globalThis.Headers;
    window.Request = globalThis.Request;
    window.Response = globalThis.Response;
    window.FormData = globalThis.FormData;
  }
}
