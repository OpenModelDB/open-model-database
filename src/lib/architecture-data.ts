import { Resource } from './schema';

export type Platform = 'pytorch' | 'onnx' | 'ncnn';

export const PLATFORM_FILE_TYPES = {
    pth: 'pytorch',
    onnx: 'onnx',
} as const satisfies Record<Resource['type'], Platform>;

export interface ArchitectureInfo {
    readonly compatiblePlatforms: readonly Platform[];
}

export const ARCHITECTURES: Readonly<Partial<Record<string, ArchitectureInfo>>> = {
    ESRGAN: {
        compatiblePlatforms: ['pytorch', 'onnx', 'ncnn'],
    },
    Compact: {
        compatiblePlatforms: ['pytorch', 'onnx', 'ncnn'],
    },
    CAIN: {
        compatiblePlatforms: ['pytorch'],
    },
    SwinIR: {
        compatiblePlatforms: ['pytorch', 'onnx'],
    },
    'CAIN YUV': {
        compatiblePlatforms: ['pytorch'],
    },
    SPSR: {
        compatiblePlatforms: ['pytorch'],
    },
    'ESRGAN+': {
        compatiblePlatforms: ['pytorch'],
    },
    SOFVSR: {
        compatiblePlatforms: ['pytorch'],
    },
    RIFE: {
        compatiblePlatforms: ['pytorch'],
    },
    'EDSR (SRResNet)': {
        compatiblePlatforms: ['pytorch'],
    },
    '2C2-ESRGAN': {
        compatiblePlatforms: ['pytorch'],
    },
};
