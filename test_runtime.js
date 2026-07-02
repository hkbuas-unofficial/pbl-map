const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const htmlPath = path.join(__dirname, 'dist', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const jsDir = path.join(__dirname, 'dist', '_expo', 'static', 'js', 'web');

const errors = [];
const logs = [];

const dom = new JSDOM(html, {
  url: 'http://localhost:3000/',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  beforeParse(window) {
    // Polyfills for jsdom so React Native Web / PostHog don't throw
    window.ResizeObserver = window.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
    window.IntersectionObserver = window.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
    window.navigator.permissions = window.navigator.permissions || { query: () => Promise.resolve({ state: 'prompt' }) };
    if (window.performance && window.performance.getEntriesByType) {
      const orig = window.performance.getEntriesByType.bind(window.performance);
      window.performance.getEntriesByType = (type) => {
        try { return orig(type); } catch (e) { return []; }
      };
    } else {
      window.performance = window.performance || {};
      window.performance.getEntriesByType = () => [];
    }

    window.addEventListener('error', (e) => {
      errors.push({ type: 'error', message: e.message, stack: e.error && e.error.stack });
    });
    window.onerror = (msg, url, line, col, err) => {
      errors.push({ type: 'onerror', message: msg, stack: err && err.stack });
    };
  },
});

const window = dom.window;
window.console.log = (...args) => logs.push(args.join(' '));
window.console.error = (...args) => errors.push({ type: 'console.error', message: args.join(' ') });
window.console.warn = (...args) => logs.push('WARN: ' + args.join(' '));

// Wait a bit for scripts to execute
setTimeout(() => {
  console.log('Logs:', logs.slice(0, 20));
  console.log('Errors:', errors.slice(0, 20));
  process.exit(errors.length > 0 ? 1 : 0);
}, 5000);
