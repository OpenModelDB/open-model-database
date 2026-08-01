import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    cleanup();
});

// jsdom implements neither of these, and both are load-bearing in this app:
// ClampedTags measures the tag row through a ResizeObserver, and the carousel
// asks matchMedia-adjacent APIs about the viewport. Without the stubs the
// components throw on mount rather than failing an assertion.
class ResizeObserverStub implements ResizeObserver {
    observe(): void {
        /* no layout in jsdom, so nothing to report */
    }
    unobserve(): void {
        /* no-op */
    }
    disconnect(): void {
        /* no-op */
    }
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))
);
