/**
 * `IS_DEPLOYED` is a module-level constant read from `location.host` at import
 * time, so the only way to exercise the deployed build is to give the whole
 * file the deployed origin before anything is imported.
 *
 * @vitest-environment-options { "url": "https://openmodeldb.info/" }
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebApiProvider } from '../../src/lib/hooks/use-web-api';
import { Dataset, DatasetId } from '../../src/lib/schema';

vi.mock('next/router', () => ({
    useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/', isReady: true, events: { on: vi.fn(), off: vi.fn() } }),
}));

const fixture = vi.hoisted(() => ({
    datasetId: 'div2k',
    dataset: {
        name: 'DIV2K',
        author: [],
        license: null,
        tags: [],
        description: 'A dataset.',
        date: '2024-01-01',
        url: 'https://example.com/div2k',
        images: [],
    },
}));

// The real one talks to `/api/*` over fetch. The page only cares that *some*
// api resolved, which is precisely the condition that used to unlock editing.
// `useDatasets` overwrites its static props with whatever this returns, so the
// datasets collection has to actually contain the fixture.
vi.mock('../../src/lib/web-api', () => {
    const collection = (entries: [string, unknown][] = []) => ({
        get: vi.fn(),
        getAll: vi.fn(() => Promise.resolve(new Map(entries))),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        changeId: vi.fn(() => Promise.resolve()),
    });

    return {
        getWebApi: vi.fn(() =>
            Promise.resolve({
                models: collection(),
                users: collection(),
                tags: collection(),
                tagCategories: collection(),
                architectures: collection(),
                collections: collection(),
                datasets: collection([[fixture.datasetId, fixture.dataset]]),
            })
        ),
        startListeningForUpdates: vi.fn(),
        addUpdateListener: vi.fn(() => vi.fn()),
    };
});

const datasetId = fixture.datasetId as DatasetId;
const dataset = fixture.dataset as unknown as Dataset;

async function renderDatasetPage() {
    const { default: Page } = await import('../../src/pages/datasets/[id]');

    return render(
        <WebApiProvider>
            <Page
                datasetId={datasetId}
                staticDatasetData={{ [datasetId]: dataset }}
            />
        </WebApiProvider>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('dataset page on the deployed site', () => {
    it('stays read-only', async () => {
        // The page used to pass `IS_DEPLOYED` as `useWebApi`'s override, which
        // reads as "allow editing despite deployment" — so being deployed was
        // the very thing that turned edit mode on.
        await renderDatasetPage();

        expect(await screen.findByText('DIV2K')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /delete dataset/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /clipboard/i })).not.toBeInTheDocument();
    });

    it('shows the site notice exactly once', async () => {
        // The page nested two `PageContainer`s, and the notice lives in the
        // shell, so every dataset page rendered the whole shell twice.
        await renderDatasetPage();

        expect(await screen.findByText('DIV2K')).toBeInTheDocument();
        expect(screen.getAllByRole('status')).toHaveLength(1);
    });
});
