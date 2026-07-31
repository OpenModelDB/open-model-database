import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `IS_DEPLOYED` is a module-level constant, so each case has to load
 * `use-web-api` against a freshly mocked `site-data`.
 */
async function load(isDeployed: boolean) {
    vi.resetModules();

    const getWebApi = vi.fn(() => Promise.resolve({ tags: { update: vi.fn(() => Promise.resolve()) } }));

    vi.doMock('../../src/lib/site-data', () => ({
        IS_DEPLOYED: isDeployed,
        SITE_URL: 'https://openmodeldb.info',
        ADSENSE_PUBLISHER_ID: 'test',
    }));
    vi.doMock('../../src/lib/web-api', () => ({
        getWebApi,
        startListeningForUpdates: vi.fn(),
        addUpdateListener: vi.fn(() => vi.fn()),
    }));

    return { ...(await import('../../src/lib/hooks/use-web-api')), getWebApi };
}

/**
 * Await the exact promise the provider awaited, so assertions run against the
 * settled state.
 *
 * Without this, `webApi` is still undefined and `editMode` still false on the
 * first tick — which is also what a correct deployed build looks like — so a
 * `waitFor` would pass before the api ever arrived and the test would hold
 * even with the deployment check deleted.
 */
async function settle(getWebApi: { mock: { results: { value: unknown }[] } }) {
    await act(async () => {
        await getWebApi.mock.results[0]?.value;
    });
}

afterEach(() => {
    vi.doUnmock('../../src/lib/site-data');
    vi.doUnmock('../../src/lib/web-api');
});

describe('useWebApi when deployed', () => {
    it('refuses edit mode to a caller that does not override', async () => {
        const { WebApiProvider, useWebApi, getWebApi } = await load(true);

        // Both callers in one render, against one loaded api. The overriding
        // one is the control: it proves the api really did arrive, so the
        // plain one staying locked is a refusal rather than a slow start.
        const { result } = renderHook(() => ({ plain: useWebApi(), overriding: useWebApi(true) }), {
            wrapper: WebApiProvider,
        });
        await settle(getWebApi);

        expect(result.current.overriding.editMode).toBe(true);
        expect(result.current.plain.editMode).toBe(false);
    });

    it('withholds the api itself, not just the flag', async () => {
        // Anything that slipped past the flag still has nothing to write with.
        const { WebApiProvider, useWebApi, getWebApi } = await load(true);

        const { result } = renderHook(() => ({ plain: useWebApi(), overriding: useWebApi(true) }), {
            wrapper: WebApiProvider,
        });
        await settle(getWebApi);

        expect(result.current.overriding.webApi).toBeDefined();
        expect(result.current.plain.webApi).toBeUndefined();
    });

    it('allows edit mode only for a caller that explicitly overrides', async () => {
        // The add-model / add-dataset flow. On the deployed site `getWebApi`
        // hands back session-storage-backed collections, so this edits a local
        // scratch copy and never reaches the real database.
        const { WebApiProvider, useWebApi, getWebApi } = await load(true);

        const { result } = renderHook(() => useWebApi(true), { wrapper: WebApiProvider });
        await settle(getWebApi);

        expect(result.current.editMode).toBe(true);
    });

    it('never offers the header toggle', async () => {
        const { WebApiProvider, useWebApi, useEditModeToggle, getWebApi } = await load(true);

        const { result } = renderHook(() => ({ toggle: useEditModeToggle(), control: useWebApi(true) }), {
            wrapper: WebApiProvider,
        });
        await settle(getWebApi);

        expect(result.current.control.editMode).toBe(true);
        expect(result.current.toggle.editModeAvailable).toBe(false);
        expect(result.current.toggle.editMode).toBe(false);
    });

    it('stays read-only however the toggle is driven', async () => {
        // `toggleEditMode` flips the shared `enabled` flag, which is also what
        // `useWebApi` reads. Being deployed has to win either way round.
        //
        // Twice, not once: `enabled` starts true, so a single toggle only ever
        // turns editing *off* and would pass even with the deployment check
        // gone. The second toggle is the one that asks the real question.
        const { WebApiProvider, useWebApi, useEditModeToggle, getWebApi } = await load(true);

        const { result } = renderHook(() => ({ toggle: useEditModeToggle(), page: useWebApi() }), {
            wrapper: WebApiProvider,
        });
        await settle(getWebApi);

        for (let i = 0; i < 2; i++) {
            act(() => result.current.toggle.toggleEditMode());

            expect(result.current.toggle.editMode).toBe(false);
            expect(result.current.page.editMode).toBe(false);
            expect(result.current.page.webApi).toBeUndefined();
        }
    });
});

describe('useWebApi when running locally', () => {
    it('enables edit mode without any override', async () => {
        // The positive control for the suite above: same harness, same mocked
        // api, only `IS_DEPLOYED` differs.
        const { WebApiProvider, useWebApi, getWebApi } = await load(false);

        const { result } = renderHook(() => useWebApi(), { wrapper: WebApiProvider });
        await settle(getWebApi);

        expect(result.current.editMode).toBe(true);
        expect(result.current.webApi).toBeDefined();
    });

    it('offers the header toggle', async () => {
        const { WebApiProvider, useEditModeToggle, getWebApi } = await load(false);

        const { result } = renderHook(() => useEditModeToggle(), { wrapper: WebApiProvider });
        await settle(getWebApi);

        expect(result.current.editModeAvailable).toBe(true);
        expect(result.current.editMode).toBe(true);
    });
});
