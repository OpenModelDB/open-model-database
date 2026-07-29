import { joinClasses } from '../../../lib/util';
import { Link } from '../link';
import style from './empty-stage.module.scss';

/**
 * Shown in place of the viewer for the 265 models with no example images.
 * Deliberately shorter than the stage: a full-height panel would give those
 * pages a whole screen of absence.
 */
export function EmptyStage() {
    return (
        <div
            className={joinClasses(
                style.panel,
                'flex w-full flex-col items-center justify-center gap-2 rounded-card',
                'border border-solid border-line bg-surface-sunken px-6 py-10 text-center'
            )}
        >
            <h2 className="m-0 text-lg font-semibold text-ink">No example images yet</h2>
            <p className="m-0 max-w-md text-sm leading-relaxed text-ink-muted">
                This model doesn&apos;t have a before/after example. Adding one helps people judge whether it fits their
                material.
            </p>
            <Link
                className="mt-2 font-medium text-accent-text hover:underline"
                href="/docs/contributing/models"
            >
                Add an example →
            </Link>
        </div>
    );
}
