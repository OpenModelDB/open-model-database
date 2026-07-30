import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetadataRow } from '../../src/elements/components/model-page/metadata-table';
import { TrainingDetails } from '../../src/elements/components/model-page/training-details';

const rows: MetadataRow[] = [
    ['Iterations', '85,000'],
    ['Batch size', '8'],
];

describe('TrainingDetails', () => {
    it('renders nothing when no field is filled in', () => {
        const { container } = render(
            <TrainingDetails
                editMode={false}
                rows={[false, null, undefined]}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('counts only the filled fields in its summary', () => {
        render(
            <TrainingDetails
                editMode={false}
                rows={[...rows, false, undefined]}
            />
        );

        expect(screen.getByText('Training details (2)')).toBeInTheDocument();
    });

    it('stays collapsed in read mode', () => {
        const { container } = render(
            <TrainingDetails
                editMode={false}
                rows={rows}
            />
        );

        expect(container.querySelector('details')).not.toHaveAttribute('open');
    });

    it('opens in edit mode so contributors are not fighting a disclosure', () => {
        const { container } = render(
            <TrainingDetails
                editMode
                rows={rows}
            />
        );

        expect(container.querySelector('details')).toHaveAttribute('open');
    });

    // The doubled-rounded-box regression: the <details> is already the card, so
    // the table inside it must not draw a second border and radius a hairline
    // within the first.
    it('does not nest a second card inside its own', () => {
        const { container } = render(
            <TrainingDetails
                editMode
                rows={rows}
            />
        );

        const card = container.querySelector('details');
        const inner = container.querySelector('dl');

        expect(card).toHaveClass('rounded-card');
        expect(inner).not.toHaveClass('rounded-card');
        expect(container.querySelectorAll('.rounded-card')).toHaveLength(1);
    });
});
