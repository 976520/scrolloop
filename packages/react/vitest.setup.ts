import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// DOM cleanup을 각 테스트 후 실행
afterEach(() => {
  cleanup();
});

