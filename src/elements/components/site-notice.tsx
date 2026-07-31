import { MdWarningAmber } from 'react-icons/md';
import { joinClasses } from '../../lib/util';
import style from './site-notice.module.scss';

/**
 * A site-wide notice about a known, temporary problem with the data.
 *
 * Deliberately part of the page shell rather than a dismissible toast: a
 * visitor who lands on a model page from a search engine needs the context as
 * much as one who arrives at the home page, and dismissing it would hide the
 * explanation for the very thing they are about to notice. Delete this
 * component and its use in `PageContainer` once the images are recovered.
 */
export function SiteNotice() {
    return (
        <div
            className="border-x-0 border-t-0 border-b border-solid border-warning-line bg-warning-surface"
            role="status"
        >
            <div
                className={joinClasses(
                    style.inner,
                    'flex items-start gap-2.5 py-2.5 text-sm leading-snug text-warning-ink'
                )}
            >
                <MdWarningAmber
                    aria-hidden
                    className="mt-0.5 shrink-0 text-base"
                />
                <p className="m-0">
                    Many preview images on this site are currently broken due to their original hosts being indefinitely
                    offline. Work is underway to recover the affected images and rehost them somewhere reliable.
                </p>
            </div>
        </div>
    );
}
