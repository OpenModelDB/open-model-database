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
    images: Image[];
    thumbnail?: Thumbnail;
}
interface ExtraModelProperties {
    trainingIterations: number;
    trainingEpochs: number;
    trainingBatchSize: number | string;
    trainingHRSize: number;
    trainingOTF: boolean;
    dataset: MarkDownString;
    datasetSize: number;
    pretrainedModelG: ModelId;
    pretrainedModelD: ModelId;
}

export type Resource = PthFile | OnnxFile;

interface SingleFile {
    size: number;
    sha256: string;
    urls: string[];
    platform: Platform;
}
export interface PthFile extends SingleFile {
    type: 'pth';
    platform: 'pytorch';
}
export interface OnnxFile extends SingleFile {
    type: 'onnx';
    platform: 'onnx';
}

export type Image = PairedImage | StandaloneImage;

export interface PairedImage {
    type: 'paired';
    caption?: string;
    LR: string;
    SR: string;
    thumbnail?: string;
}

export interface StandaloneImage {
    type: 'standalone';
    caption?: string;
    url: string;
    thumbnail?: string;
}

export type Thumbnail = PairedThumbnail | StandaloneThumbnail;
export interface PairedThumbnail {
    type: 'paired';
    LR: string;
    SR: string;
    LRSize?: ImageSize;
    SRSize?: ImageSize;
}
export interface StandaloneThumbnail {
    type: 'standalone';
    url: string;
}

export interface ImageSize {
    readonly width: number;
    readonly height: number;
}

export interface User {
    name: string;
}

export interface Tag {
    name: string;
    description: MarkDownString;
    implies?: TagId[];
    hidden?: true;
}

export interface TagCategory {
    name: string;
    description: MarkDownString;
    order: number;
    /** Whether the tags of this category are part of the simple tag selector. */
    simple: boolean;
    /**
     * Whether this category is only to be displayed in edit mode.
     *
     * @default false
     */
    editOnly?: boolean;
    tags: TagId[];
}

export type Platform = 'pytorch' | 'onnx' | 'ncnn';
export type InputType = 'image' | 'video' | 'audio';

export interface Arch {
    name: string;
    input: InputType;
    compatiblePlatforms: Platform[];
}
