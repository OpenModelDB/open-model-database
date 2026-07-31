import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WebApiProvider } from '../../src/lib/hooks/use-web-api';
import { Model, ModelId } from '../../src/lib/schema';

vi.mock('next/router', () => ({
    useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/', isReady: true, events: { on: vi.fn(), off: vi.fn() } }),
}));

const fixture = vi.hoisted(() => {
    const model = (name: string) => ({
        name,
        author: [],
        license: null,
        tags: [],
        description: 'A model.',
        date: '2024-01-01',
        architecture: 'esrgan',
        size: null,
        scale: 4,
        inputChannels: 3,
        outputChannels: 3,
        resources: [],
        images: [],
    });

    return { main: ['4x-Main', model('4x-Main')], other: ['4x-Other', model('4x-Other')] } as const;
});

vi.mock('../../src/lib/web-api', () => {
    const collection = (entries: readonly (readonly [string, unknown])[] = []) => ({
        get: vi.fn(),
        getAll: vi.fn(() => Promise.resolve(new Map(entries))),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        changeId: vi.fn(() => Promise.resolve()),
    });

    return {
        getWebApi: vi.fn(() =>
            Promise.resolve({
                models: collection([fixture.main, fixture.other]),
                users: collection(),
                tags: collection(),
                tagCategories: collection(),
                architectures: collection(),
                collections: collection(),
                datasets: collection(),
            })
        ),
        startListeningForUpdates: vi.fn(),
        addUpdateListener: vi.fn(() => vi.fn()),
    };
});

const mainId = fixture.main[0] as ModelId;
const otherId = fixture.other[0] as ModelId;

async function renderModelPage() {
    const { default: Page } = await import('../../src/pages/models/[id]');

    return render(
        <WebApiProvider>
            <Page
                modelId={mainId}
                staticCollectionData={{}}
                staticModelData={
                    {
                        [mainId]: fixture.main[1],
                        [otherId]: fixture.other[1],
                    } as unknown as Record<ModelId, Model>
                }
                staticSimilar={[otherId]}
            />
        </WebApiProvider>
    );
}

describe('model page layout', () => {
    it('puts the model details ahead of the related-model grids', async () => {
        // Below `lg` the page grid collapses to a single column and renders in
        // DOM order, so this ordering *is* the mobile layout: downloads and
        // specs have to come before "Similar models", not after it.
        await renderModelPage();

        const specs = await screen.findByText('Architecture');
        const similar = await screen.findByText('Similar models');

        expect(specs.compareDocumentPosition(similar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
});
