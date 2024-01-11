import { Model } from './schema';
import { DATE_REGEX, assertNever } from './util';

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
    minLength?: number;
    format?: RegExp;
    kind?: 'model-id' | 'user-id' | 'tag-id' | 'arch-id';
    enum?: string[];
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
export interface ObjectProp {
    type: 'object';
    properties: Record<string, ModelProp>;
}
export interface UnknownTypeProp {
    type: 'unknown';
}
export type PropType = NumberProp | StringProp | BooleanProp | ArrayProp | ObjectProp | UnknownTypeProp;
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
            if (prop.minLength && value.length < prop.minLength) {
                return `Expected ${name} to be at least ${prop.minLength} character(s) long, but found ${value.length} character(s).`;
            }
            if (prop.format && !prop.format.test(value)) {
                return `Expected ${name} to match ${prop.format.toString()}`;
            }
            if (prop.enum && !prop.enum.includes(value)) {
                return `Expected ${name} to be one of ${prop.enum.join(', ')}`;
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
            break;
        }
        case 'object':
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                return `Expected ${name} to be an object`;
            }
            for (const [key, subProp] of Object.entries(prop.properties)) {
                const subValue = (value as Record<string, unknown>)[key];
                if (subValue == null) {
                    if (!subProp.optional) {
                        return `Expected ${name}.${key} to be present`;
                    }
                    continue;
                }

                const subError = validateType(subValue, subProp, `${name}.${key}`);
                if (subError) return subError;
            }
            break;
        case 'unknown':
            break;
        default:
            return assertNever(prop);
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
        allowEmpty: false,
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
        of: { type: 'string', minLength: 1 },
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
        of: {
            type: 'object',
            properties: {
                type: {
                    name: 'Type',
                    type: 'string',
                    enum: ['pth', 'onnx'],
                },
                size: {
                    name: 'Size',
                    optional: true,
                    type: 'number',
                    isInteger: true,
                    min: 1,
                },
                sha256: {
                    name: 'SHA256',
                    optional: true,
                    type: 'string',
                    format: /^[0-9a-f]{64}$/i,
                },
                urls: {
                    name: 'URLs',
                    type: 'array',
                    of: { type: 'string' },
                },
                platform: {
                    name: 'Platform',
                    type: 'string',
                    enum: ['pytorch', 'onnx', 'ncnn'],
                },
            },
        },
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
    images: {
        name: 'Images',
        type: 'array',
        of: { type: 'unknown' },
        allowEmpty: true,
    },
    thumbnail: {
        optional: true,
        name: 'Thumbnail',
        type: 'unknown',
    },
};
