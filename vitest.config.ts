import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    // The app imports SVGs as React components (see the `@svgr/webpack` rule in
    // next.config.js). Without the equivalent here, anything that renders the
    // header or a download button fails on the logo import.
    plugins: [svgr()],

    // tsconfig says `jsx: preserve` because Next does its own transform, and
    // Vite honours that — which leaves raw JSX in the output and every .tsx
    // test dies on "Unexpected JSX expression". Override it here rather than in
    // tsconfig, so Next keeps doing the transform it expects to do.
    // (`oxc`, not `esbuild`: Vite 8 transforms with rolldown.)
    oxc: {
        jsx: { runtime: 'automatic' },
    },

    test: {
        // jsdom for everything, not just component tests. The pure-logic suites
        // run fine in it, and a single environment means nobody has to remember
        // a `@vitest-environment` docblock when adding a test that touches DOM.
        environment: 'jsdom',
        // No injected globals. Tests import `describe`/`it`/`expect` from
        // vitest, which keeps `tsc --noEmit` working over the test files
        // without pulling a runner's ambient types into the whole project.
        globals: false,
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.{ts,tsx}'],

        css: {
            modules: {
                // `style.tagRow` resolves to the literal 'tagRow' rather than a
                // hashed name, so tests can assert against the class the source
                // actually names.
                classNameStrategy: 'non-scoped',
            },
        },
    },
});
