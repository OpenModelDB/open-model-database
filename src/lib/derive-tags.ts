import { ARCHITECTURES, PLATFORM_FILE_TYPES, Platform } from './architecture-data';
import { KNOWN_LICENSES, LicenseProperties, parseLicense } from './license';
import { Model, SPDXLicense, TagId } from './schema';
import { EMPTY_ARRAY, asArray, lazyWithKey, lazyWithWeakKey } from './util';

function intersect<T>(arrays: (readonly T[])[]): Iterable<T> {
    if (arrays.length === 0) {
        throw new Error();
    } else if (arrays.length === 1) {
        return arrays[0];
    }

    const [shortest, ...rest] = arrays.sort((a, b) => a.length - b.length);
    if (shortest.length === 0) return shortest;

    return shortest.filter((i) => rest.every((r) => r.includes(i)));
}

type Tag<T extends string> = `${T}:${string}`;

const getLicenseTags = lazyWithKey((license: SPDXLicense | null): Iterable<Tag<'license'>> => {
    const ids = parseLicense(license);
    if (ids.length === 0) {
        return ['license:no-license'];
    }

    const tags = new Set<Tag<'license'>>();

    const props: LicenseProperties[] = [];
    for (const id of ids) {
        const p = KNOWN_LICENSES[id];
        if (p) {
            props.push(p);
        } else {
            tags.add('license:unknown');
        }
    }

    if (props.length > 0) {
        for (const p of props.flatMap((p) => p.permissions)) {
            if (p === 'commercial-use') tags.add('license:commercial');
            if (p === 'modifications') tags.add('license:modifications');
        }

        for (const c of intersect(props.map((p) => p.conditions))) {
            if (c === 'include-copyright') tags.add('license:by');
            if (c === 'same-license') tags.add('license:sa');
        }
    }

    return tags;
});

function getPlatformTags(model: Model): Iterable<Tag<'platform'>> {
    const tags = new Set<Tag<'platform'>>();

    const platforms: Platform[] = model.resources.map(({ type }) => PLATFORM_FILE_TYPES[type]);
    for (const p of platforms) {
        tags.add(`platform:${p}`);
    }

    platforms.push(...(ARCHITECTURES[model.architecture]?.compatiblePlatforms ?? EMPTY_ARRAY));
    for (const p of platforms) {
        tags.add(`platform:${p}-compatible`);
    }

    return tags;
}

export const deriveTags = lazyWithWeakKey((model: Model): readonly TagId[] => {
    const tags: string[] = [...model.tags];

    // author
    tags.push(...asArray(model.author).map((a) => `by:${a}`));

    // scale
    tags.push(`scale:${model.scale}`);

    // color
    if (model.inputChannels === model.outputChannels) {
        tags.push(`color:${model.inputChannels}`);
    } else {
        tags.push(`color:${model.inputChannels}-${model.outputChannels}`);
    }

    // license
    tags.push(...getLicenseTags(model.license));

    // platform
    tags.push(...getPlatformTags(model));

    // sort tags to make sure that their order doesn't matter
    tags.sort();
    return tags as TagId[];
});
