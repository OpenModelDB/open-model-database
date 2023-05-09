import { Arch, ArchId, Model, ModelId, TagId } from './schema';
import { asArray } from './util';

export interface SimilarModel {
    readonly id: ModelId;
    readonly score: number;
}

export function getSimilarModels(
    refId: ModelId,
    models: ReadonlyMap<ModelId, Model>,
    architectures: ReadonlyMap<ArchId, Arch>
): SimilarModel[] {
    const simScorer = createSimilarityScorer(models, architectures);
    const ref = models.get(refId);
    if (!ref) return [];

    const ids: SimilarModel[] = [];
    for (const [id, model] of models) {
        if (id === refId) continue;

        let score = simScorer(ref, model);
        if (score <= 0) continue;

        // punish missing data
        if (!model.license) score -= 0.1;
        if (!model.images.length) score -= 0.15;

        ids.push({ id, score });
    }

    // sort by score (and id for stability)
    ids.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

    return ids;
}

export function createSimilarityScorer(
    models: ReadonlyMap<ModelId, Model>,
    architectures: ReadonlyMap<ArchId, Arch>
): (ref: Model, other: Model) => number {
    const tagUsage = new Map<TagId, number>();
    for (const model of models.values()) {
        for (const tag of model.tags) {
            tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
        }
    }
    const colorModeUsage = new Map<string, number>();
    for (const model of models.values()) {
        const colorMode = getColorModel(model);
        colorModeUsage.set(colorMode, (colorModeUsage.get(colorMode) || 0) + 1);
    }

    return (ref, other) => {
        // same input type is required
        const refArch = architectures.get(ref.architecture);
        const otherArch = architectures.get(other.architecture);
        if (!refArch || !otherArch || refArch.input !== otherArch.input) {
            return 0;
        }

        let score = 0;

        // similar tags are important
        // we want to punish models with a lot more tags than the reference
        const tagPunish = 1 / (Math.max(0, other.tags.length - Math.max(4, ref.tags.length + 1)) + 1) ** 0.5;
        for (const tag of ref.tags) {
            if (other.tags.includes(tag)) {
                score += (tagPunish * 10) / (tagUsage.get(tag) ?? 1) ** 0.5;
            }
        }
        // no tags in common is a deal breaker
        if (score === 0) return 0;

        // same scale is a bit important
        if (ref.scale === other.scale) {
            score += 1;
        }
        // 1x models typically have a different function than >=2x models
        if ((ref.scale === 1) === (other.scale === 1)) {
            score += 1;
        }

        // same color mode is very important
        const colorModel = getColorModel(ref);
        if (colorModel === getColorModel(other)) {
            score += 2 / (colorModeUsage.get(colorModel) ?? 1) ** 0.5;
        }

        // same author indicates model families
        if (asArray(ref.author).some((a) => asArray(other.author).includes(a))) {
            score += 0.2;
        }

        return score;
    };
}

function getColorModel(m: Model): string {
    return `${m.inputChannels}-${m.outputChannels}`;
}
