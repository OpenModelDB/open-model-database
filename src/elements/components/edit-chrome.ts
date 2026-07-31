/**
 * Shared chrome for the UI that only exists in edit mode.
 *
 * Edit mode is invisible to almost everyone — it appears only when the local
 * web API is reachable — so its controls were never given a look. They ended
 * up as bare elements plus hand-paired `gray-*`/`dark:gray-*` classes, which
 * track neither the theme tokens nor each other: five different greys across
 * three popovers, and buttons with no styling at all falling back to the
 * operating system's chrome.
 *
 * These constants are the one convention. They are built from the same
 * semantic tokens as read mode (`surface`, `line`, `ink`) so edit mode reads
 * as part of the site rather than as scaffolding bolted onto it.
 */

/**
 * The standard edit-mode control. Deliberately the same recipe as the
 * carousel's arrows: edit mode should look like it was designed by whoever
 * designed the rest of the page.
 */
export const EDIT_BUTTON =
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-control border border-solid border-line bg-surface px-2.5 py-1.5 text-sm text-ink transition-colors duration-100 ease-in-out hover:border-line-strong hover:bg-surface-hover disabled:cursor-default disabled:opacity-50 disabled:hover:border-line disabled:hover:bg-surface';

/** The same control, currently selected. Used by the popover mode toggles. */
export const EDIT_BUTTON_ACTIVE =
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-control border border-solid border-accent-600 bg-accent-600 px-2.5 py-1.5 text-sm text-white transition-colors duration-100 ease-in-out hover:bg-accent-500 dark:border-accent-500 dark:bg-accent-500 dark:hover:bg-accent-600';

/**
 * The primary action of a form — the Save at the bottom of a popover. One per
 * panel; everything else stays quiet so this reads as the way out.
 */
export const EDIT_BUTTON_PRIMARY =
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-control border-0 bg-accent-600 px-3 py-2 text-sm font-semibold text-white transition-opacity duration-100 ease-in-out hover:opacity-90 disabled:cursor-default disabled:opacity-50 dark:bg-accent-500';

/** Destructive action. Muted until hover, so it is not the loudest thing on screen. */
export const EDIT_BUTTON_DANGER =
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-control border border-solid border-line bg-surface px-2.5 py-1.5 text-sm text-ink transition-colors duration-100 ease-in-out hover:border-red-500 hover:bg-red-500 hover:text-white';

/**
 * Icon-only control: delete, reorder, add. Sized by its icon, so no padding
 * beyond a hit area — these sit in tight rows under carousel thumbnails.
 */
export const EDIT_ICON_BUTTON =
    'inline-flex cursor-pointer items-center justify-center rounded-control p-1 text-ink-muted transition-colors duration-100 ease-in-out hover:bg-surface-hover hover:text-ink';

/**
 * The floating panel behind the edit popovers. `shadow-pop` and a real border
 * because these overlap page content and need to read as a separate layer;
 * the previous `dark:bg-black` merged into the page in dark mode.
 */
export const EDIT_PANEL =
    'absolute z-50 mt-2 w-96 origin-top-right rounded-card border border-solid border-line bg-surface text-sm text-ink shadow-pop focus:outline-none';

/** One labelled field inside a popover. */
export const EDIT_FIELD = 'mb-3 flex flex-col gap-1';

/** Field label. Same micro-type as the metadata table's labels. */
export const EDIT_LABEL = 'text-xs font-semibold uppercase tracking-wide text-ink-subtle';
