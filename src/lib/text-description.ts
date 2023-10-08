import { Model } from './schema';

/**
 * Returns a text description of the model, without any formatting elements.
 */
export function getTextDescription(model: Model): string {
    const { scale, description } = model;

    const lines = description.trim().split('\n');
    const descLines: string[] = [];
    let purpose = '',
        pretrained = '';
    lines.forEach((line) => {
        if (line.startsWith('Category: ')) {
            // ignore category
        } else if (line.startsWith('Purpose: ')) {
            purpose = line.replace('Purpose: ', '');
        } else if (line.startsWith('Pretrained: ')) {
            pretrained = line.replace(/Pretrained: (?:Trained on )?/i, '');
        } else if (line !== '') {
            descLines.push(line.trim());
        }
    });
    if (!purpose && !pretrained && descLines.length > 0) {
        return descLines.join('\n');
    }
    const purposeSentence = purpose ? `A ${scale}x model for ${purpose}.` : `A ${scale}x model.`;
    const pretrainedSentence = pretrained ? `Pretrained using ${pretrained}.` : '';
    const actualDescription = `${purposeSentence} ${pretrainedSentence}\n${descLines.join('\n')}`.trim();
    return actualDescription;
}
