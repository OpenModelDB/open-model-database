import { SPDXLicense, SPDXLicenseId } from './schema';

// Modeled after: https://github.com/github/choosealicense.com

export type LicensePermission = 'commercial-use' | 'modifications' | 'private-use' | 'patent-use';
export type LicenseConditions = 'include-copyright' | 'disclose-source' | 'same-license' | 'state-changes';

interface LicenseProperties {
    readonly name: string;
    readonly link?: string;
    readonly permissions: readonly LicensePermission[];
    readonly conditions: readonly LicenseConditions[];
}

const KNOWN_LICENSES_: Record<string, LicenseProperties> = {
    'Apache-2.0': {
        name: 'Apache License 2.0',
        permissions: ['commercial-use', 'modifications', 'private-use', 'patent-use'],
        conditions: ['include-copyright', 'state-changes'],
    },
    'BSD-3-Clause': {
        name: 'BSD 3-Clause "New" or "Revised" License',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: ['include-copyright'],
    },
    'CC-BY-4.0': {
        name: 'CC BY 4.0',
        link: 'https://creativecommons.org/licenses/by/4.0/',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: ['include-copyright', 'state-changes'],
    },
    'CC-BY-SA-4.0': {
        name: 'CC BY-SA 4.0',
        link: 'https://creativecommons.org/licenses/by-sa/4.0/',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: ['include-copyright', 'same-license', 'state-changes'],
    },
    'CC-BY-NC-4.0': {
        name: 'CC BY-NC 4.0',
        link: 'https://creativecommons.org/licenses/by-nc/4.0/',
        permissions: ['modifications', 'private-use'],
        conditions: ['include-copyright', 'state-changes'],
    },
    'CC-BY-NC-SA-4.0': {
        name: 'CC BY-NC-SA 4.0',
        link: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        permissions: ['modifications', 'private-use'],
        conditions: ['include-copyright', 'same-license', 'state-changes'],
    },
    'GPL-3.0-only': {
        name: 'GNU General Public License v3.0 only',
        permissions: ['commercial-use', 'modifications', 'private-use', 'patent-use'],
        conditions: ['include-copyright', 'disclose-source', 'same-license', 'state-changes'],
    },
    MIT: {
        name: 'MIT License',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: ['include-copyright'],
    },
    Unlicense: {
        name: 'The Unlicense',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: [],
    },
    WTFPL: {
        name: 'Do What The F*ck You Want To Public License',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: [],
    },
};
export const KNOWN_LICENSES = KNOWN_LICENSES_ as Partial<Readonly<Record<SPDXLicenseId, LicenseProperties>>>;

export function parseLicense(license: SPDXLicense | null | undefined): SPDXLicenseId[] {
    if (!license) return [];

    const parts = license.split(/\s+OR\s+/i);
    return parts.map((id) => {
        if (!/^[a-z0-9.\-]$/i.test(id)) {
            throw new Error(`"${id}" is not a valid SPDX license ID`);
        }
        return id as SPDXLicenseId;
    });
}
