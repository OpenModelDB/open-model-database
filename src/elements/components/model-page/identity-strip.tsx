import { ReactNode } from 'react';
import { Model, Resource } from '../../../lib/schema';
import { joinClasses } from '../../../lib/util';
import { DownloadButton } from '../download-button';
import style from './identity-strip.module.scss';

interface IdentityStripProps {
    model: Model;
    archName: string;
    /** `EditableLabel` for the model name, supplied by the page. */
    name: ReactNode;
    /** `EditableUsers` for the authors, supplied by the page. */
    authors: ReactNode;
    editMode: boolean;
    onResourceChange: (resource: Resource) => void;
}

/**
 * Model pages are linked directly from Discord, forums and search, so a cold
 * visitor needs the name and the primary action before scrolling. Previously
 * the name sat below the image.
 */
export function IdentityStrip({ model, archName, name, authors, editMode, onResourceChange }: IdentityStripProps) {
    const primary = model.resources[0] as Resource | undefined;

    return (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
                <h1 className="mt-0 mb-2 text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">
                    {name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                    <span className="rounded border border-solid border-line px-1.5 py-0.5 text-xs font-semibold text-ink">
                        {model.scale}x
                    </span>
                    <span className="rounded border border-solid border-line px-1.5 py-0.5 text-xs font-semibold text-ink">
                        {archName}
                    </span>
                    <span aria-hidden>·</span>
                    {authors}
                </div>
            </div>

            {/* A model can have zero resources (see add-model). The strip is the
                primary action, not the management surface — DownloadsBlock owns
                adding resources, and renders unconditionally in edit mode. */}
            {primary && (
                <div className={joinClasses(style.action, 'w-full sm:w-auto')}>
                    <DownloadButton
                        readonly={!editMode}
                        resource={primary}
                        onChange={onResourceChange}
                    />
                </div>
            )}
        </div>
    );
}
