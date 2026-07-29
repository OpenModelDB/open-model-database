import { MetadataRow, MetadataTable } from './metadata-table';

interface TrainingDetailsProps {
    rows: MetadataRow[];
    editMode: boolean;
}

/**
 * Training provenance is reference material: people rarely choose a model
 * because it ran 85,000 iterations. Collapsed by default, but open in edit
 * mode so contributors are not fighting a disclosure.
 */
export function TrainingDetails({ rows, editMode }: TrainingDetailsProps) {
    const filled = rows.filter(Boolean).length;
    if (filled === 0) return null;

    return (
        <details
            className="rounded-card border border-solid border-line bg-surface"
            open={editMode}
        >
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Training details ({filled})
            </summary>
            <div className="border-x-0 border-t border-b-0 border-solid border-line">
                <MetadataTable rows={rows} />
            </div>
        </details>
    );
}
