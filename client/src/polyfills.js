// Polyfill for process
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {
      NODE_ENV: 'development'
    },
    browser: true,
    version: '',
    versions: {},
    nextTick: (callback, ...args) => {
      setTimeout(() => {
        callback(...args);
      }, 0);
    }
  };
}

// Polyfill for Buffer
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer').Buffer;
} 