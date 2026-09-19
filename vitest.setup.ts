import "@testing-library/jest-dom/vitest";

/**
 * jsdom does not implement window.matchMedia. Every real browser does, so this
 * is a test-environment gap rather than something components should defend
 * against. Defaults to "no preference" so motion paths are exercised; a test
 * that cares about reduced motion can override the return value.
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
