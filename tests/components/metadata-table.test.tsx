import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetadataRow, MetadataTable } from '../../src/elements/components/model-page/metadata-table';

const rows: MetadataRow[] = [
    ['Scale', '4x'],
    ['Architecture', 'ESRGAN'],
];

describe('MetadataTable', () => {
    it('renders a term and a definition per row', () => {
        render(<MetadataTable rows={rows} />);

        expect(screen.getByText('Scale')).toBeInTheDocument();
        expect(screen.getByText('4x')).toBeInTheDocument();
        expect(screen.getByText('Architecture')).toBeInTheDocument();
        expect(screen.getByText('ESRGAN')).toBeInTheDocument();
    });

    it('drops rows that are false, null or undefined', () => {
        render(<MetadataTable rows={[['Scale', '4x'], false, null, undefined, ['License', 'MIT']]} />);

        expect(screen.getAllByRole('term')).toHaveLength(2);
    });

    it('renders nothing at all when every row is empty', () => {
        const { container } = render(<MetadataTable rows={[false, null, undefined]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the title as a heading when given one', () => {
        render(
            <MetadataTable
                rows={rows}
                title="Model details"
            />
        );

        expect(screen.getByRole('heading', { name: 'Model details' })).toBeInTheDocument();
    });

    // The regression this prop exists for: nested inside the <details> card in
    // TrainingDetails, its own border and radius landed a hairline inside the
    // parent's and read as a doubled rounded box.
    it('drops its card chrome when flush', () => {
        const { container } = render(
            <MetadataTable
                flush
                rows={rows}
            />
        );
        const list = container.querySelector('dl');

        expect(list).not.toHaveClass('rounded-card');
        expect(list).not.toHaveClass('border');
        expect(list).not.toHaveClass('bg-surface');
    });

    it('keeps its card chrome by default', () => {
        const { container } = render(<MetadataTable rows={rows} />);
        const list = container.querySelector('dl');

        expect(list).toHaveClass('rounded-card');
        expect(list).toHaveClass('border');
        expect(list).toHaveClass('bg-surface');
    });
});
