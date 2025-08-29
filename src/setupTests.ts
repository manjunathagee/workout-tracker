import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock canvas for Chart.js
HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => {
      return {
        data: new Array(4),
      };
    },
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => {
      return { width: 0 };
    },
    transform: () => {},
    rect: () => {},
    clip: () => {},
  } as any;
};

// Mock IndexedDB
global.indexedDB = {
  open: () => {},
  deleteDatabase: () => {},
  cmp: () => 0,
} as any;

// Mock Web APIs
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: any) => arr,
    subtle: {
      digest: () => Promise.resolve(new ArrayBuffer(0)),
      importKey: () => Promise.resolve({}),
      deriveBits: () => Promise.resolve(new ArrayBuffer(0)),
    },
  },
});

// Mock navigator APIs
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: () => Promise.resolve(),
    ready: Promise.resolve({
      pushManager: {
        subscribe: () => Promise.resolve(),
        getSubscription: () => Promise.resolve(),
      },
    }),
  },
});

Object.defineProperty(window, 'Notification', {
  value: class Notification {
    constructor(title: string, options?: any) {}
    static permission = 'granted';
    static requestPermission = () => Promise.resolve('granted');
  },
});

// Mock URL methods
global.URL.createObjectURL = () => 'mock-url';
global.URL.revokeObjectURL = () => {};