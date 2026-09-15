import { afterEach, vi } from 'vitest';
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

global.localStorage = localStorageMock as unknown as Storage;

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock FileReader for image upload tests
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

  readAsDataURL() {
    this.result = 'data:image/png;base64,mockImageData';
    if (this.onloadend) {
      this.onloadend.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
    }
  }
}

global.FileReader = MockFileReader as unknown as typeof FileReader;
