import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Rendering every page against the deployed origin is not practical, and it
 * would only ever cover the pages that exist today. This scans the source
 * instead, so a page added next month is covered the moment it is written.
 *
 * The rule being enforced: `useWebApi`'s argument means "allow editing even
 * though we are deployed". Passing anything truthy is therefore a deliberate
 * decision that has to be justified here, not something a page picks up by
 * copying its neighbour — which is exactly how the dataset page ended up
 * calling `useWebApi(IS_DEPLOYED)` and unlocking editing on the live site.
 */

const SRC = join(__dirname, '..', '..', 'src');

/**
 * Call sites allowed to unlock edit mode on the deployed site, and why.
 *
 * Both entries are the "propose a contribution" flow: they build a model or
 * dataset that does not exist yet and render it editably so a contributor can
 * check it over and open a GitHub issue. On the deployed site `getWebApi`
 * returns session-storage-backed collections, so these edit a local scratch
 * copy and cannot reach the real database.
 */
const ALLOWED = new Map([
    ['pages/add-model.tsx', 'IS_DEPLOYED'],
    ['pages/add-dataset.tsx', 'IS_DEPLOYED'],
    // Threaded from a prop that only `OMDB_ADDMODEL_DUMMY` sets.
    ['pages/models/[id].tsx', 'editModeOverride'],
]);

/** Where `useWebApi` is declared — its signature is not a call site. */
const DEFINITION = 'lib/hooks/use-web-api.tsx';

function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(full);
        return /\.tsx?$/.test(entry.name) ? [full] : [];
    });
}

interface CallSite {
    file: string;
    argument: string;
}

function callSites(): CallSite[] {
    const found: CallSite[] = [];

    for (const file of sourceFiles(SRC)) {
        const id = relative(SRC, file).split(sep).join('/');
        if (id === DEFINITION) continue;

        const source = readFileSync(file, 'utf8');
        for (const match of source.matchAll(/\buseWebApi\(([^)]*)\)/g)) {
            found.push({ file: id, argument: match[1].trim() });
        }
    }

    return found;
}

describe('edit mode on the deployed site', () => {
    it('finds the call sites at all', () => {
        // Guards the guard: a regex that silently matches nothing would make
        // every assertion below pass without checking anything.
        const sites = callSites();

        expect(sites.length).toBeGreaterThan(5);
        expect(sites.some(({ file }) => file === 'pages/models/[id].tsx')).toBe(true);
    });

    it('is not unlocked by any page outside the documented exceptions', () => {
        const offenders = callSites()
            .filter(({ argument }) => argument !== '')
            .filter(({ file, argument }) => ALLOWED.get(file) !== argument);

        expect(offenders).toEqual([]);
    });

    it('keeps the dataset page read-only', () => {
        // The regression this suite was written for.
        const sites = callSites().filter(({ file }) => file === 'pages/datasets/[id].tsx');

        expect(sites).not.toEqual([]);
        for (const { argument } of sites) {
            expect(argument).toBe('');
        }
    });

    it('never passes IS_DEPLOYED from a page that renders existing content', () => {
        // `useWebApi(IS_DEPLOYED)` reads as "unlock when deployed", which is
        // only ever right for the add-* flows. On a page that displays
        // something already in the database it is always a bug.
        const offenders = callSites().filter(({ file, argument }) => argument === 'IS_DEPLOYED' && !ALLOWED.has(file));

        expect(offenders).toEqual([]);
    });
});
