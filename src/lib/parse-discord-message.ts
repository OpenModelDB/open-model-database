import { KNOWN_LICENSES } from './license';
import { Arch, ArchId, Model, ModelId, SPDXLicenseId } from './schema';
import { typedEntries } from './util';

export interface ParseMessageTemplate {
    name: string;
    license: SPDXLicenseId;
    link: string;
    architecture: ArchId;
    scale: number;
    purpose: string;
    trainingIterations: number;
    batchSize: number;
    hrSize: number;
    epoch: number;
    dataset: string;
    datasetSize: number;
    otf: boolean;
    pretrained: ModelId;
    description: string;
}

export interface ParseResult {
    parsed: Partial<ParseMessageTemplate>;
    failed: string[];
}

function parseNumber(value: string): number {
    const simplified = value
        .toLowerCase()
        .replace(/[,']/g, '')
        .replace(/[gx]$/, '')
        .replace(/^~/, '')
        .replace(/[kк]$/, '000')
        .replace(/m$/, '000000')
        .trim();
    if (/^\d+$/.test(simplified)) {
        return parseInt(simplified, 10);
    }
    throw new Error(`Invalid number: ${value}`);
}
function parseBoolean(value: string): boolean {
    const simplified = value.toLowerCase().replace(/\.$/, '').trim();
    if (simplified === 'y' || simplified === 'ye' || simplified === 'yes' || simplified === 'true') {
        return true;
    }
    if (simplified === 'n' || simplified === 'no' || simplified === 'false') {
        return false;
    }
    throw new Error(`Invalid boolean: ${value}`);
}
function parseMarkdownUrl(value: string): string {
    let match = /^(https?:\/\/[^()<>\s]+?)\.?$/.exec(value);
    if (match) {
        return match[1];
    }
    match = /^<(https?:\/\/[^<>]+)>$/.exec(value);
    if (match) {
        return match[1];
    }
    match = /^\[[^\[\]]*\]\((https?:\/\/[^()]+)\)$/.exec(value);
    if (match) {
        return match[1];
    }

    throw new Error(`Invalid markdown link: ${value}`);
}

function getMarkdownLinkTitle(value: string): string | undefined {
    const match = /^\[([^\[\]]+)\]\([^()]*\)$/.exec(value);
    return match?.[1];
}

const simplifyKey = (key: string): string =>
    key
        .toLowerCase()
        .trim()
        .replace(/[\s_\-]/g, '');
const keyAliases: Record<keyof ParseMessageTemplate, string[]> = {
    name: ['Model Name'],
    license: [],
    link: ['download', 'model link', 'model download'],
    architecture: ['Arch', 'Model Architecture', 'network'],
    scale: [],
    purpose: [],
    trainingIterations: ['Iterations'],
    batchSize: [],
    hrSize: [],
    epoch: ['epochs'],
    dataset: [],
    datasetSize: ['Number of train images'],
    otf: ['OTF Training'],
    pretrained: ['Pretrained Model', 'Pretrained_Model_G', 'Pretrained\\_Model\\_G'],
    description: [],
};
const keyMapping = new Map<string, keyof ParseMessageTemplate>();
for (const [key, aliases] of typedEntries(keyAliases)) {
    keyMapping.set(simplifyKey(key), key);
    for (const alias of aliases) {
        keyMapping.set(simplifyKey(alias), key);
    }
}

function findBestMatch<T>(value: string, iter: Iterable<T>, selector: (item: T) => Iterable<string>): T | undefined {
    const items = Array.from(iter);

    // find exact matches
    for (const item of items) {
        for (const s of selector(item)) {
            if (s === value) {
                return item;
            }
        }
    }

    // find a single item such that value is a prefix of one of its strings
    const contains = items.filter((item) => {
        for (const s of selector(item)) {
            if (s.includes(value)) {
                return true;
            }
        }
        return false;
    });
    if (contains.length === 1) {
        return contains[0];
    }

    if (contains.length > 1) {
        // find a single item such that value is a prefix of one of its strings
        const prefixes = items.filter((item) => {
            for (const s of selector(item)) {
                if (s.startsWith(value)) {
                    return true;
                }
            }
            return false;
        });
        if (prefixes.length === 1) {
            return prefixes[0];
        }
    }

    // find the longest prefix of value
    let longest: T | undefined = undefined;
    let longestLength = 0;

    for (const item of items) {
        for (const s of selector(item)) {
            const l = s.length;
            if (l > longestLength && value.startsWith(s)) {
                longest = item;
                longestLength = l;
            }
        }
    }

    return longest;
}

interface ParseContext {
    models: ReadonlyMap<ModelId, Model>;
    architectures: ReadonlyMap<ArchId, Arch>;
}

const parseValue: Record<
    keyof ParseMessageTemplate,
    (value: string, context: ParseContext) => Partial<ParseMessageTemplate>
> = {
    // simple strings
    name: (value) => ({ name: value }),
    purpose: (value) => ({ purpose: value }),
    dataset: (value) => ({ dataset: value }),
    description: (value) => ({ description: value }),

    // numbers
    scale: (value) => ({ scale: parseNumber(value) }),
    datasetSize: (value) => ({
        datasetSize: parseNumber(
            value.replace(/\b(?:\d+[x\-]\d+\s+)?(?:page|tile|image)s?(?:\s+(?:64|128|256|512|1024|2048))?$/i, '').trim()
        ),
    }),
    trainingIterations: (value) => ({ trainingIterations: parseNumber(value) }),
    batchSize: (value) => ({ batchSize: parseNumber(value) }),
    hrSize: (value) => ({ hrSize: parseNumber(value) }),
    epoch: (value) => ({ epoch: parseNumber(value) }),

    // boolean
    otf: (value) => ({ otf: parseBoolean(value) }),

    // other
    architecture: (value, { architectures }) => {
        const canonicalize = (s: string): string =>
            s
                .trim()
                .toLowerCase()
                .replace(/[\s_\-]/g, '');

        const best = findBestMatch(
            canonicalize(getMarkdownLinkTitle(value) || value),
            architectures,
            ([archId, arch]) => {
                return [canonicalize(arch.name), canonicalize(archId)];
            }
        );
        if (best) {
            return { architecture: best[0] };
        }

        throw new Error(`Unknown arch: ${value}`);
    },
    link: (value) => {
        return { link: parseMarkdownUrl(value) };
    },
    license: (value) => {
        const canonicalize = (s: string): string =>
            s
                .trim()
                .toLowerCase()
                .replace(/[\s_\-]/g, '');

        const best = findBestMatch(
            canonicalize(getMarkdownLinkTitle(value) || value),
            typedEntries(KNOWN_LICENSES),
            ([licenseId, license]) => {
                if (!license) return [];
                return [canonicalize(license.name), canonicalize(licenseId)];
            }
        );
        if (best) {
            return { license: best[0] };
        }

        throw new Error(`Unknown license: ${value}`);
    },
    pretrained: (value, { models }) => {
        if (/^(?:no|custom|scratch)\b/i.test(value)) {
            return { pretrained: undefined };
        }

        const canonicalize = (s: string): string =>
            s
                .trim()
                .toLowerCase()
                .replace(/[\s_\-]/g, '');

        const best = findBestMatch(
            canonicalize(getMarkdownLinkTitle(value) || value).replace(/pth?$/, ''),
            models,
            ([modelId, model]) => {
                return [canonicalize(modelId), canonicalize(model.name)];
            }
        );
        if (best) {
            return { pretrained: best[0] };
        }

        throw new Error(`Invalid pretrained model: ${value}`);
    },
};

export function parseDiscordMessage(
    message: string,
    models: ReadonlyMap<ModelId, Model>,
    architectures: ReadonlyMap<ArchId, Arch>
): ParseResult {
    const parsed: Partial<ParseMessageTemplate> = {};
    const failed: string[] = [];

    const lines = message
        .split(/(\n|^\*{0,2}Description\s*(?::\s*\*{0,2}|\*{0,2}\s*:)[\s\S]+)/m)
        .filter(Boolean)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((l) => {
            // remove lines that just ping certain channels
            return !/^\s*(?:<@&\d+>\s*)+$/.test(l);
        });

    const context: ParseContext = { models, architectures };

    for (const line of lines) {
        const parsedLine = /^(\*{0,2})(?<key>[\w\- \\().,]{1,25})(?::\s*\1|\1\s*:|(?=\*)\1)(?<value>[\s\S]*)/u.exec(
            line
        );
        if (parsedLine?.groups) {
            const rawKey = parsedLine.groups.key;
            const key =
                keyMapping.get(simplifyKey(rawKey)) ?? keyMapping.get(simplifyKey(rawKey.replace(/\([^()]+\)$/, '')));
            const value = parsedLine.groups.value.trim();
            if (['?', 'unknown', 'n/a', 'none', '-', ''].includes(value.toLowerCase())) {
                // skip unknown values
                continue;
            }

            const parser = key && parseValue[key];
            if (parser) {
                try {
                    const parsedValue = parser(value, context);
                    Object.assign(parsed, parsedValue);
                } catch (error) {
                    failed.push(line);
                }
                continue;
            }
        }

        if (!parsedLine && !parsed.link) {
            try {
                parsed.link = parseMarkdownUrl(line.trim());
                continue;
            } catch {}
        }

        if (!parsedLine && line.toLowerCase().startsWith('otf training')) {
            try {
                parsed.otf = parseBoolean(line.slice('otf training'.length).trim());
                continue;
            } catch {}
        }

        if (!parsedLine && parsed.description !== undefined) {
            parsed.description = `${parsed.description}\n\n${line}`.trim();
            continue;
        }

        failed.push(line);
    }

    // clean up name
    if (parsed.name) {
        parsed.name = parsed.name.replace(/[.\-_\s]?pth?$/i, '');
        if (parsed.scale && parsed.name.toLowerCase().startsWith(`${parsed.scale}x`)) {
            parsed.name = parsed.name.replace(/^\d+x[.\-_\s]?/i, '');
        }
    }

    return { parsed, failed };
}
