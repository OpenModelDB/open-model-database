import { Model } from './schema';
import { DATE_REGEX } from './util';

export interface PropBase {
    name: string;
    optional?: boolean;
}
export interface NumberProp {
    type: 'number';
    isInteger?: boolean;
    min?: number;
    max?: number;
}
export interface StringProp {
    type: 'string';
    format?: RegExp;
    kind?: 'model-id' | 'user-id' | 'tag-id' | 'arch-id';
}
export interface BooleanProp {
    type: 'boolean';
}
export interface ArrayProp {
    type: 'array';
    of: PropType;
    allowEmpty?: boolean;
    allowSingleItem?: boolean;
}
export interface UnknownTypeProp {
    type: 'unknown';
}
export type PropType = NumberProp | StringProp | BooleanProp | ArrayProp | UnknownTypeProp;
export type ModelProp = PropBase & PropType;

export interface ExternalValidator {
    isValidModelId?(modelId: string): boolean;
    isValidUserId?(userId: string): boolean;
    isValidTagId?(tagId: string): boolean;
    isValidArchitectureId?(arch: string): boolean;
}
export function validateType(
    value: unknown,
    prop: PropType,
    name: string,
    external: ExternalValidator = {}
): string | undefined {
    switch (prop.type) {
        case 'number':
            if (typeof value !== 'number') {
                return `Expected ${name} to be a number`;
            }
            if (prop.isInteger && !Number.isInteger(value)) {
                return `Expected ${name} to be an integer`;
            }
            if (prop.min !== undefined && value < prop.min) {
                return `Expected ${name} to be >= ${prop.min}`;
            }
            if (prop.max !== undefined && value > prop.max) {
                return `Expected ${name} to be <= ${prop.max}`;
            }
            break;
        case 'string':
            if (typeof value !== 'string') {
                return `Expected ${name} to be a string`;
            }
            if (prop.format && !prop.format.test(value)) {
                return `Expected ${name} to match ${prop.format.toString()}`;
            }
            if (prop.kind) {
                switch (prop.kind) {
                    case 'model-id':
                        if (external.isValidModelId && !external.isValidModelId(value)) {
                            return `Expected ${name} to be a valid model ID`;
                        }
                        break;
                    case 'user-id':
                        if (external.isValidUserId && !external.isValidUserId(value)) {
                            return `Expected ${name} to be a valid user ID`;
                        }
                        break;
                    case 'tag-id':
                        if (external.isValidTagId && !external.isValidTagId(value)) {
                            return `Expected ${name} to be a valid tag ID`;
                        }
                        break;
                    case 'arch-id':
                        if (external.isValidArchitectureId && !external.isValidArchitectureId(value)) {
                            return `Expected ${name} to be a valid architecture`;
                        }
                        break;
                }
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean') {
                return `Expected ${name} to be a boolean`;
            }
            break;
        case 'array': {
            let arrayValue: unknown[];
            if (Array.isArray(value)) {
                arrayValue = value;
            } else {
                if (!prop.allowSingleItem) {
                    return `Expected ${name} to be an array`;
                }
                arrayValue = [value];
            }

            if (!prop.allowEmpty && arrayValue.length === 0) {
                return `Expected ${name} to be a non-empty array`;
            }

            for (let i = 0; i < arrayValue.length; i++) {
                const item = arrayValue[i];
                const itemError = validateType(item, prop.of, `${name}[${i}]`);
                if (itemError) return itemError;
            }
        }
    }
}

export const MODEL_PROPS: Readonly<Record<keyof Model, ModelProp>> = {
    name: {
        name: 'Name',
        type: 'string',
    },
    author: {
        name: 'Author(s)',
        type: 'array',
        of: { type: 'string', kind: 'user-id' },
        allowSingleItem: true,
    },
    tags: {
        name: 'Tags',
        type: 'array',
        of: { type: 'string', kind: 'tag-id' },
        allowEmpty: true,
    },
    description: {
        name: 'Description',
        type: 'string',
    },
    license: {
        name: 'License',
        optional: true,
        type: 'string',
    },
    date: {
        name: 'Date',
        type: 'string',
        format: DATE_REGEX,
    },
    architecture: {
        name: 'Architecture',
        type: 'string',
        kind: 'arch-id',
    },
    size: {
        name: 'Size',
        optional: true,
        type: 'array',
        of: { type: 'string' },
    },
    scale: {
        name: 'Scale',
        type: 'number',
        isInteger: true,
        min: 1,
        max: 16,
    },
    inputChannels: {
        name: 'Input channels',
        type: 'number',
        isInteger: true,
        min: 1,
        max: 4,
    },
    outputChannels: {
        name: 'Output channels',
        type: 'number',
        isInteger: true,
        min: 1,
        max: 4,
    },
    resources: {
        name: 'Resources',
        type: 'array',
        of: { type: 'unknown' },
    },
    images: {
        name: 'Images',
        type: 'array',
        of: { type: 'unknown' },
        allowEmpty: true,
    },
    trainingIterations: {
        name: 'Training iterations',
        optional: true,
        type: 'number',
        isInteger: true,
        min: 1,
    },
    trainingEpochs: {
        name: 'Training epochs',
        optional: true,
        type: 'number',
        isInteger: true,
        min: 1,
    },
    trainingBatchSize: {
        name: 'Training batch size',
        optional: true,
        type: 'number',
        isInteger: true,
        min: 1,
    },
    trainingHRSize: {
        name: 'Training HR size',
        optional: true,
        type: 'number',
        isInteger: true,
        min: 1,
    },
    trainingOTF: {
        name: 'Training OTF',
        optional: true,
        type: 'boolean',
    },
    dataset: {
        name: 'Dataset',
        optional: true,
        type: 'string',
    },
    datasetSize: {
        name: 'Dataset size',
        optional: true,
        type: 'number',
        isInteger: true,
        min: 1,
    },
    pretrainedModelG: {
        name: 'Pretrained Model (G)',
        optional: true,
        type: 'string',
        kind: 'model-id',
    },
    pretrainedModelD: {
        name: 'Pretrained Model (D)',
        optional: true,
        type: 'string',
        kind: 'model-id',
    },
};
