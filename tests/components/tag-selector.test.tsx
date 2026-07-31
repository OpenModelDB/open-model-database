import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TagSelector, TagSelectorStyle } from '../../src/elements/tag-selector';
import { TagId } from '../../src/lib/schema';
import { STATIC_TAG_CATEGORY_DATA, STATIC_TAG_DATA } from '../../src/lib/static-data';
import { SelectionState, TagSelection } from '../../src/lib/tag-condition';

/**
 * Derived from the real tag data rather than hard-coded, so editing
 * data/tags.json does not break these tests.
 */
function tagsOf(categoryId: string): { id: TagId; name: string }[] {
    const category = STATIC_TAG_CATEGORY_DATA.get(categoryId as never);
    if (!category) throw new Error(`no such tag category: ${categoryId}`);

    return category.tags.map((id) => ({ id, name: STATIC_TAG_DATA.get(id)?.name ?? id }));
}

const SUBJECT = tagsOf('subject');
const ARCHITECTURE = tagsOf('architecture');
const DATASET = tagsOf('dataset');

const EMPTY: TagSelection = new Map();

function required(...ids: TagId[]): TagSelection {
    return new Map(ids.map((id) => [id, SelectionState.Required]));
}

/** Reports what the selector asked for without re-rendering it. */
function renderStatic(selection: TagSelection = EMPTY, context?: 'models' | 'datasets') {
    const onChange = vi.fn<(selection: TagSelection, style: TagSelectorStyle) => void>();

    render(
        <TagSelector
            context={context}
            selection={selection}
            onChange={onChange}
        />
    );

    return { onChange, user: userEvent.setup() };
}

/** Feeds `onChange` back in, so multi-click flows behave like the real page. */
function renderLive(initial: TagSelection = EMPTY) {
    const seen: TagSelection[] = [];

    function Harness() {
        const [selection, setSelection] = useState(initial);

        return (
            <TagSelector
                selection={selection}
                onChange={(next) => {
                    seen.push(next);
                    setSelection(next);
                }}
            />
        );
    }

    render(<Harness />);

    return { seen, user: userEvent.setup() };
}

const toAdvanced = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: /advanced tag selector/i }));

describe('TagSelector in simple mode', () => {
    it('starts simple, showing everything and no tag chosen', () => {
        renderStatic();

        expect(screen.getByRole('button', { name: /all models/i })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: /advanced tag selector/i })).toBeInTheDocument();
    });

    it('hides the categories that only make sense in advanced mode', () => {
        // Architecture is `simple: false` — 33 buttons that would swamp the
        // handful of subject and purpose options.
        renderStatic();

        expect(screen.getByRole('button', { name: SUBJECT[0].name })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: ARCHITECTURE[0].name })).not.toBeInTheDocument();
    });

    it('requires the tag that was clicked', async () => {
        const { onChange, user } = renderStatic();

        await user.click(screen.getByRole('button', { name: SUBJECT[1].name }));

        expect(onChange).toHaveBeenCalledWith(required(SUBJECT[1].id), 'simple');
    });

    it('replaces the previous tag rather than adding to it', async () => {
        // Simple mode is single-select across every group, not per group.
        const { seen, user } = renderLive(required(SUBJECT[0].id));

        await user.click(screen.getByRole('button', { name: SUBJECT[1].name }));

        expect(seen.at(-1)).toEqual(required(SUBJECT[1].id));
    });

    it('clears the selection through "All models"', async () => {
        const { onChange, user } = renderStatic(required(SUBJECT[0].id));

        await user.click(screen.getByRole('button', { name: /all models/i }));

        expect(onChange).toHaveBeenCalledWith(EMPTY, 'simple');
    });

    it('ignores a click on the tag that is already chosen', async () => {
        const { onChange, user } = renderStatic(required(SUBJECT[0].id));

        await user.click(screen.getByRole('button', { name: SUBJECT[0].name }));

        expect(onChange).not.toHaveBeenCalled();
    });

    it('switches itself to advanced for a selection it cannot show', async () => {
        // A forbidden tag has no simple representation. Staying simple would
        // display a filter that silently disagrees with the results.
        render(
            <TagSelector
                selection={new Map([[SUBJECT[0].id, SelectionState.Forbidden]])}
                onChange={vi.fn()}
            />
        );

        expect(await screen.findByRole('button', { name: /simple tag selector/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ARCHITECTURE[0].name })).toBeInTheDocument();
    });
});

describe('TagSelector in advanced mode', () => {
    it('reveals the categories simple mode holds back', async () => {
        const { user } = renderStatic();

        await toAdvanced(user);

        expect(screen.getByRole('button', { name: ARCHITECTURE[0].name })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: SUBJECT[0].name })).toBeInTheDocument();
    });

    it('cycles a tag through required, forbidden and back to any', async () => {
        const { seen, user } = renderLive();

        await toAdvanced(user);
        const tag = () => screen.getByRole('button', { name: ARCHITECTURE[0].name });

        await user.click(tag());
        expect(seen.at(-1)).toEqual(new Map([[ARCHITECTURE[0].id, SelectionState.Required]]));

        await user.click(tag());
        expect(seen.at(-1)).toEqual(new Map([[ARCHITECTURE[0].id, SelectionState.Forbidden]]));

        await user.click(tag());
        expect(seen.at(-1)?.size).toBe(0);
    });

    it('keeps several tags at once, unlike simple mode', async () => {
        const { seen, user } = renderLive();

        await toAdvanced(user);
        await user.click(screen.getByRole('button', { name: ARCHITECTURE[0].name }));
        await user.click(screen.getByRole('button', { name: ARCHITECTURE[1].name }));

        expect(seen.at(-1)).toEqual(required(ARCHITECTURE[0].id, ARCHITECTURE[1].id));
    });

    it('marks a required tag as pressed', async () => {
        // No mode switch needed: an architecture tag has no simple
        // representation, so the selector opens in advanced mode already.
        renderStatic(required(ARCHITECTURE[0].id));

        expect(await screen.findByRole('button', { name: ARCHITECTURE[0].name })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
    });

    it('offers "Clear all tags" only when there is something to clear', async () => {
        const { user } = renderStatic();

        await toAdvanced(user);

        expect(screen.getByRole('button', { name: /clear all tags/i })).toBeDisabled();
    });

    it('clears everything at once', async () => {
        // Opens in advanced mode, as above.
        const { onChange, user } = renderStatic(required(ARCHITECTURE[0].id, SUBJECT[0].id));

        await user.click(await screen.findByRole('button', { name: /clear all tags/i }));

        expect(onChange).toHaveBeenCalledWith(EMPTY, 'simple');
    });

    it('groups each category into a single spacing container', async () => {
        // jsdom does no layout, so the gap itself is unmeasurable here. What is
        // checkable is the thing that was actually missing: the buttons sat in
        // a bare <div>, and since they are inline-flex and JSX drops the
        // whitespace between them, a whole category rendered as one unbroken
        // strip of touching pills.
        const { user } = renderStatic();

        await toAdvanced(user);
        const button = screen.getByRole('button', { name: ARCHITECTURE[0].name });
        const container = button.parentElement;

        expect(container).toHaveClass('advancedTags');
        expect(within(container as HTMLElement).getAllByRole('button').length).toBe(ARCHITECTURE.length);
    });
});

describe('TagSelector on the datasets page', () => {
    it('shows dataset tags and nothing else', () => {
        renderStatic(EMPTY, 'datasets');

        expect(screen.getByRole('button', { name: /all datasets/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: DATASET[0].name })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: SUBJECT[0].name })).not.toBeInTheDocument();
    });

    it('keeps model categories out of advanced mode too', async () => {
        const { user } = renderStatic(EMPTY, 'datasets');

        await toAdvanced(user);

        expect(screen.getByRole('button', { name: DATASET[0].name })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: ARCHITECTURE[0].name })).not.toBeInTheDocument();
    });
});
