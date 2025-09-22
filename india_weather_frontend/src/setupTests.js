/* eslint-disable no-undef */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock navigator.geolocation globally to avoid act() warnings and errors in tests.
// Default behavior: simulate permission denied to keep tests deterministic.
// Individual tests can override window.navigator.geolocation.getCurrentPosition if needed.
const geolocationMock = {
  getCurrentPosition: (success, error) => {
    if (typeof error === 'function') {
      // code 1 = PERMISSION_DENIED (W3C Geolocation spec)
      error({ code: 1, message: 'denied' });
    }
  },
  watchPosition: (success, error) => {
    // Return a numeric watch id; use error by default to be consistent with denied permission
    if (typeof error === 'function') {
      error({ code: 1, message: 'denied' });
    }
    return 0;
  },
  clearWatch: () => {},
};

function defineNavigatorProp(obj, prop, value) {
  if (Object.getOwnPropertyDescriptor(obj, prop)) {
    try {
      Object.defineProperty(obj, prop, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
      return;
    } catch {
      // fallback to assignment
    }
  }
  obj[prop] = value; // eslint-disable-line no-param-reassign
}

// Ensure navigator exists in JSDOM environment
if (typeof global.navigator === 'undefined') {
  global.navigator = {};
}

// Attach geolocation mock
defineNavigatorProp(global.navigator, 'geolocation', geolocationMock);

// Mock Permissions API for geolocation queries to avoid unhandled promise warnings.
const permissionsMock = {
  // Returns a thenable with a state that can mimic 'denied' to match geolocation mock
  query: async ({ name }) => {
    if (name === 'geolocation') {
      const res = { state: 'denied', onchange: null };
      return res;
    }
    // Default for other permissions
    return { state: 'prompt', onchange: null };
  },
};
defineNavigatorProp(global.navigator, 'permissions', permissionsMock);
