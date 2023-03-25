import React from 'react';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useTags } from '../../lib/hooks/use-tags';
import { useUsers } from '../../lib/hooks/use-users';
import { joinList } from '../../lib/react-util';
import { Model, ModelId } from '../../lib/schema';
import { asArray } from '../../lib/util';
import { Link } from './link';
import style from './model-card.module.scss';

interface ModelCardProps {
    id: ModelId;
    model: Model;
}

export const ModelCard = ({ id, model }: ModelCardProps) => {
    const { tagData } = useTags();
    const { userData } = useUsers();
    const { archData } = useArchitectures();

    const description = fixDescription(model.description, model.scale);

    return (
        <div className={`${style.modelCard} border-gray-300 shadow-lg hover:shadow-xl dark:border-gray-700 `}>
            <div className={style.inner}>
                {/* Arch tag on image */}
                <div className={style.topTags}>
                    <AccentTag>{archData.get(model.architecture)?.name ?? 'Unknown'}</AccentTag>
                    <AccentTag>{model.scale}x</AccentTag>
                </div>

                <Link
                    className={style.thumbnail}
                    href={`/models/${id}`}
                    tabIndex={-1}
                />

                <div className="relative inset-x-0 bottom-0 bg-white p-3 pt-2 dark:bg-fade-900">
                    <Link
                        className="block text-xl font-bold text-gray-800 dark:text-gray-100"
                        href={`/models/${id}`}
                    >
                        {model.name}
                    </Link>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {'by '}
                        {joinList(
                            asArray(model.author).map((userId) => (
                                <Link
                                    className="font-bold text-accent-600 dark:text-accent-400"
                                    href={`/users/${userId}`}
                                    key={userId}
                                >
                                    {userData.get(userId)?.name ?? `unknown user:${userId}`}
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-1 py-1 text-sm text-gray-600 line-clamp-3 dark:text-gray-400">{description}</div>

                    {/* Tags */}
                    <div className="flex flex-row flex-wrap gap-1">
                        {model.tags.map((tagId) => (
                            <RegularTag key={tagId}>{tagData.get(tagId)?.name ?? `unknown tag:${tagId}`}</RegularTag>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

function fixDescription(description: string, scale: number): string {
    const lines = description.split('\n');
    const descLines: string[] = [];
    let category = '',
        purpose = '',
        pretrained = '',
        dataset = '';
    lines.forEach((line) => {
        if (line.startsWith('Category: ')) {
            category = String(line).replace('Category: ', '');
        } else if (line.startsWith('Purpose: ')) {
            purpose = String(line).replace('Purpose: ', '');
        } else if (line.startsWith('Pretrained: ')) {
            pretrained = String(line).replace('Pretrained: ', '');
        } else if (line.startsWith('Dataset: ')) {
            dataset = String(line).replace('Dataset: ', '');
        } else if (line !== '') {
            descLines.push(line.trim());
        }
    });
    const purposeSentence = category ? `A ${scale}x model for ${purpose}.` : `A ${scale}x model.`;
    const datasetSentence = dataset ? `Trained on ${dataset}.` : 'Unknown training dataset.';
    const pretrainedSentence = pretrained ? `Pretrained using ${pretrained}.` : 'Unknown pretrained model.';
    const actualDescription =
        descLines.length > 0
            ? descLines.join('\n').trim()
            : `${purposeSentence} ${datasetSentence} ${pretrainedSentence}`;
    return actualDescription;
}

function AccentTag({ children }: React.PropsWithChildren<unknown>) {
    return <div className={`${style.tagBase} bg-accent-600 text-sm text-gray-100`}>{children}</div>;
}

function RegularTag({ children }: React.PropsWithChildren<unknown>) {
    return (
        <div className={`${style.tagBase} bg-gray-200 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-100`}>
            {children}
        </div>
    );
}
