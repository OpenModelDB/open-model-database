import { useTooltip } from '../../lib/hooks/use-tooltip';
import {
    KNOWN_LICENSES,
    LicenseConditions,
    LicenseLimitations,
    LicensePermission,
    LicenseProperties,
    parseLicense,
} from '../../lib/license';
import { SPDXLicense } from '../../lib/schema';
import { isNonNull } from '../../lib/util';
import styles from './license-attributes.module.scss';
import { TextLink } from './link';

interface LicenseAttributesProps {
    license: SPDXLicense;
}
export function LicenseAttributes({ license }: LicenseAttributesProps) {
    const licenseProperties = parseLicense(license)
        .map((id) => KNOWN_LICENSES[id])
        .filter(isNonNull);

    if (licenseProperties.length === 1) {
        return <PropertiesView properties={licenseProperties[0]} />;
    }
    return null;
}

interface Description {
    readonly title: string;
    readonly description: string;
}

const PERMISSIONS_INFO: Readonly<Record<LicensePermission, Description>> = {
    'private-use': {
        title: 'Private use',
        description:
            'Permission: The licensed material and derivatives may be used for private purposes.\n\nYou can freely use the model for non-commercial purposes. All models on this site include this permission.',
    },
    'commercial-use': {
        title: 'Commercial use',
        description: 'Permission: The licensed material and derivatives may be used for commercial purposes.',
    },
    distribution: {
        title: 'Distribution',
        description:
            'Permission: Copies of the licensed material may be redistributed.\n\nYou can freely reupload the model anywhere, as long as you follow the conditions of the license (e.g. some licenses require crediting the author). All models on this site include this permission.',
    },
    'patent-use': {
        title: 'Patent use',
        description: 'Permission: The license provides an express grant of patent rights from contributors.',
    },
    modifications: {
        title: 'Modifications',
        description:
            'Permission: The licensed material may be modified.\n\nThis includes model interpolation and using a model to train another model.',
    },
};

const CONDITIONS_INFO: Readonly<Record<LicenseConditions, Description>> = {
    'disclose-source': {
        title: 'Disclose Source',
        description: 'Condition: Source code must be made available when distributing.',
    },
    'include-copyright': {
        title: 'Credit required',
        description:
            'Condition: The author must be credited when distributing copies or derivatives of the licensed work.\n\nAt a minimum, this includes the name of the author and the license. E.g. "by John Doe, licensed under MIT."',
    },
    'state-changes': {
        title: 'State Changes',
        description: 'Condition: Changes made to the licensed material must be documented.',
    },
    'same-license': {
        title: 'Same License',
        description:
            'Condition: Modifications must be released under the same license when distributing.\n\nE.g. a model trained on a model licensed under CC BY-SA 4.0 must also be licensed under CC BY-SA 4.0.',
    },
};

const LIMITATIONS_INFO: Readonly<Record<LicenseLimitations, Description>> = {
    liability: {
        title: 'No Liability',
        description: 'Limitation: The license includes a limitation of liability.',
    },
    'trademark-use': {
        title: 'No Trademark use',
        description: 'Limitation: The license explicitly states that it does NOT grant trademark rights.',
    },
    'patent-use': {
        title: 'No Patent use',
        description: 'Limitation: The license explicitly states that it does NOT grant patent rights.',
    },
    warranty: {
        title: 'No Warranty',
        description: 'Limitation: The license explicitly states that it does NOT provide any warranty.',
    },
};

let counter = 0;

const PERMISSIONS_ORDER: Readonly<Record<LicensePermission, number>> = {
    'private-use': counter++,
    'commercial-use': counter++,
    'patent-use': counter++,
    distribution: counter++,
    modifications: counter++,
};

const CONDITIONS_ORDER: Readonly<Record<LicenseConditions, number>> = {
    'disclose-source': counter++,
    'include-copyright': counter++,
    'same-license': counter++,
    'state-changes': counter++,
};

const LIMITATIONS_ORDER: Readonly<Record<LicenseLimitations, number>> = {
    liability: counter++,
    warranty: counter++,
    'patent-use': counter++,
    'trademark-use': counter++,
};

function PropertiesView({ properties }: { properties: LicenseProperties }) {
    let { permissions, conditions, limitations } = properties;

    // AI models do not have source code, so disclose-source does not apply
    conditions = conditions.filter((c) => c !== 'disclose-source');

    // we handle liability and warranty separately
    const liabilityAndWarranty = limitations.includes('liability') && limitations.includes('warranty');
    if (liabilityAndWarranty) {
        // if both liability and warranty are present, we can remove them both
        limitations = limitations.filter((l) => l !== 'liability' && l !== 'warranty');
    }

    // Lastly, patent and trademark use.
    // Our users probably don't care about these, and if they do, they shouldn't come to use for legal advice.
    permissions = permissions.filter((p) => p !== 'patent-use');
    limitations = limitations.filter((l) => l !== 'patent-use' && l !== 'trademark-use');

    // sort
    permissions = [...permissions].sort((a, b) => PERMISSIONS_ORDER[a] - PERMISSIONS_ORDER[b]);
    conditions = [...conditions].sort((a, b) => CONDITIONS_ORDER[a] - CONDITIONS_ORDER[b]);
    limitations = [...limitations].sort((a, b) => LIMITATIONS_ORDER[a] - LIMITATIONS_ORDER[b]);

    return (
        <div>
            <div className="my-1">
                {permissions.map((permission) => {
                    const info = PERMISSIONS_INFO[permission];
                    return (
                        <Item
                            color="green"
                            description={info.description}
                            key={permission}
                            title={info.title}
                        />
                    );
                })}
            </div>
            {conditions.length > 0 && (
                <div className="my-1">
                    {conditions.map((condition) => {
                        const info = CONDITIONS_INFO[condition];
                        return (
                            <Item
                                color="blue"
                                description={info.description}
                                key={condition}
                                title={info.title}
                            />
                        );
                    })}
                </div>
            )}
            <div className="my-1">
                {liabilityAndWarranty && (
                    <Item
                        color="red"
                        description="Limitation: The license explicitly states that it does NOT provide any warranty and liability."
                        title="No Liability & Warranty"
                    />
                )}
                {limitations.map((limitation) => {
                    const info = LIMITATIONS_INFO[limitation];
                    return (
                        <Item
                            color="red"
                            description={info.description}
                            key={limitation}
                            title={info.title}
                        />
                    );
                })}
            </div>

            <TextLink href="/docs/licenses#disclaimer">Disclaimer</TextLink>
        </div>
    );
}

const ITEM_COLORS = {
    red: 'bg-red-700',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
} as const;
function Item({ title, description, color }: { title: string; description?: string; color: keyof typeof ITEM_COLORS }) {
    const tooltipId = useTooltip();

    return (
        <div className="pl-4">
            <span className={`${styles.dot} ${ITEM_COLORS[color]}`} />
            <span
                data-tooltip-content={description}
                data-tooltip-delay-show={300}
                data-tooltip-id={tooltipId}
            >
                {title}
            </span>
        </div>
    );
}
