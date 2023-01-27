import { SPDXLicense, SPDXLicenseId } from './schema';

// Modeled after: https://github.com/github/choosealicense.com

export type LicensePermission = 'commercial-use' | 'modifications' | 'private-use' | 'patent-use';
export type LicenseConditions = 'include-copyright' | 'disclose-source' | 'same-license' | 'state-changes';
export type LicenseLimitations = 'liability' | 'trademark-use' | 'warranty' | 'patent-use';

interface LicenseProperties {
    readonly name: string;
    readonly link?: string;
    readonly permissions: readonly LicensePermission[];
    readonly conditions: readonly LicenseConditions[];
    readonly limitations: readonly LicenseLimitations[];
}

const KNOWN_LICENSES_: Record<string, LicenseProperties> = {
    'Apache-2.0': {
        name: 'Apache License 2.0',
        permissions: ['commercial-use', 'modifications', 'private-use', 'patent-use'],
        conditions: ['include-copyright', 'state-changes'],
        limitations: ['liability', 'trademark-use', 'warranty'],
    },
    'BSD-3-Clause': {
        name: 'BSD 3-Clause "New" or "Revised" License',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: ['include-copyright'],
        limitations: ['liability', 'warranty'],
    },
    'CC0-1.0': {
        name: 'CC0',
        link: 'https://creativecommons.org/publicdomain/zero/1.0/',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: [],
        limitations: ['liability', 'trademark-use', 'warranty', 'patent-use'],
    },
    'CC-BY-4.0': {
        name: 'CC BY 4.0',
        link: 'https://creativecommons.org/licenses/by/4.0/',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: ['include-copyright', 'state-changes'],
        limitations: ['liability', 'trademark-use', 'warranty', 'patent-use'],
    },
    'CC-BY-SA-4.0': {
        name: 'CC BY-SA 4.0',
        link: 'https://creativecommons.org/licenses/by-sa/4.0/',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: ['include-copyright', 'same-license', 'state-changes'],
        limitations: ['liability', 'trademark-use', 'warranty', 'patent-use'],
    },
    'CC-BY-NC-4.0': {
        name: 'CC BY-NC 4.0',
        link: 'https://creativecommons.org/licenses/by-nc/4.0/',
        permissions: ['modifications', 'private-use'],
        conditions: ['include-copyright', 'state-changes'],
        limitations: ['liability', 'trademark-use', 'warranty', 'patent-use'],
    },
    'CC-BY-NC-SA-4.0': {
        name: 'CC BY-NC-SA 4.0',
        link: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        permissions: ['modifications', 'private-use'],
        conditions: ['include-copyright', 'same-license', 'state-changes'],
        limitations: ['liability', 'trademark-use', 'warranty', 'patent-use'],
    },
    'GPL-3.0-only': {
        name: 'GNU General Public License v3.0 only',
        permissions: ['commercial-use', 'modifications', 'private-use', 'patent-use'],
        conditions: ['include-copyright', 'disclose-source', 'same-license', 'state-changes'],
        limitations: ['liability', 'warranty'],
    },
    MIT: {
        name: 'MIT License',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: ['include-copyright'],
        limitations: ['liability', 'warranty'],
    },
    Unlicense: {
        name: 'The Unlicense',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: [],
        limitations: ['liability', 'warranty'],
    },
    WTFPL: {
        name: 'Do What The F*ck You Want To Public License',
        permissions: ['commercial-use', 'modifications', 'private-use'],
        conditions: [],
        limitations: [],
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
