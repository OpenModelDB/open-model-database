import { ReactNode } from 'react';
import { MetadataRow, MetadataTable } from './metadata-table';

export function SpecCards({ modelRows, rights }: { modelRows: MetadataRow[]; rights: ReactNode }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <section>
                <h2 className="mt-0 mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">Model</h2>
                <MetadataTable rows={modelRows} />
            </section>

            <section>
                <h2 className="mt-0 mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">Rights</h2>
                <div className="rounded-card border border-solid border-line bg-surface p-4">{rights}</div>
            </section>
        </div>
    );
}
