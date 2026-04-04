import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage with actual storage
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
};

global.localStorage = localStorageMock as any;

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock FileReader for image upload tests
global.FileReader = class {
  result: string | ArrayBuffer | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsDataURL() {
    this.result = 'data:image/png;base64,mockImageData';
    if (this.onloadend) {
      this.onloadend({} as ProgressEvent<FileReader>);
    }
  }
} as any;
