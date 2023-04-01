export type ModelId = string & { readonly ModelId: never };
export type UserId = string & { readonly UserId: never };
/**
 * A SPDX license expressions.
 * @see https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions/
 */
export type SPDXLicense = string & { readonly SPDXLicense: never };
/**
 * A SPDX license id (short).
 * @see https://spdx.org/licenses/
 */
export type SPDXLicenseId = string & { readonly SPDXLicenseId: never };
export type TagId = string & { readonly TagId: never };
export type TagCategoryId = string & { readonly TagCategoryId: never };
export type ArchId = string & { readonly ArchId: never };
export type MarkDownString = string;

export interface Model extends Partial<ExtraModelProperties> {
    name: string;
    author: UserId | UserId[];
    license: SPDXLicense | null;
    tags: TagId[];
    description: MarkDownString;
    /** The date the model was published. Format: yyyy-mm-dd */
    date: string;
    architecture: ArchId;
    size: string[] | null;
    scale: number;
    inputChannels: number;
    outputChannels: number;
    resources: Resource[];
}
interface ExtraModelProperties {
    trainingIterations: number;
    trainingEpochs: number;
    trainingBatchSize: number | string;
    trainingHRSize: number;
    trainingOTF: boolean;
    dataset: MarkDownString;
    datasetSize: number;
    pretrainedModelG: ModelReference;
    pretrainedModelD: ModelReference;
}
/** A reference to a model. The model might be in the database or not. */
export type ModelReference = ModelId | { description: MarkDownString };

export type Resource = PthFile | OnnxFile;
interface SingleFile {
    size: number | null;
    sha256: string | null;
    urls: string[];
    platform: Platform;
}
interface PthFile extends SingleFile {
    type: 'pth';
    platform: 'pytorch';
}
interface OnnxFile extends SingleFile {
    type: 'onnx';
    platform: 'onnx';
}

export interface User {
    name: string;
}

export interface Tag {
    name: string;
    description: MarkDownString;
}

export interface TagCategory {
    name: string;
    description: MarkDownString;
    order: number;
    /** Whether the tags of this category are part of the simple tag selector. */
    simple: boolean;
    tags: TagId[];
}

export type Platform = 'pytorch' | 'onnx' | 'ncnn';

export interface Arch {
    name: string;
    compatiblePlatforms: Platform[];
}

export const ModelIdPattern = /^\d+x-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
export const UserIdPattern = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
export const TagIdPattern = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
