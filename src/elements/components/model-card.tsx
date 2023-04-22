import React, { memo } from 'react';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useUpdateModel } from '../../lib/hooks/use-update-model';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { joinList } from '../../lib/react-util';
import { Model, ModelId } from '../../lib/schema';
import { asArray, getPreviewImage, joinClasses } from '../../lib/util';
import { EditableTags } from './editable-tags';
import { Link } from './link';
import style from './model-card.module.scss';

interface ModelCardProps {
    id: ModelId;
    model: Model;
}

// eslint-disable-next-line react/display-name
export const ModelCard = memo(({ id, model }: ModelCardProps) => {
    const { userData } = useUsers();
    const { archData } = useArchitectures();

    const { webApi, editMode } = useWebApi();
    const { updateModelProperty } = useUpdateModel(webApi, id);

    const description = fixDescription(model.description, model.scale);

    return (
        <div
            className={`${style.modelCard} border-gray-300 bg-white shadow-lg hover:shadow-xl dark:border-gray-700 dark:bg-fade-900`}
        >
            <div className={style.inner}>
                {/* Arch tag on image */}
                <div className={style.topTags}>
                    <AccentTag>{archData.get(model.architecture)?.name ?? 'Unknown'}</AccentTag>
                    <AccentTag>{model.scale}x</AccentTag>
                </div>

                <Link
                    className={joinClasses(
                        style.thumbnail,
                        'relative flex h-full w-full items-center justify-items-center overflow-hidden bg-fade-300 align-middle dark:bg-fade-700 '
                    )}
                    href={`/models/${id}`}
                    tabIndex={-1}
                >
                    {model.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            alt={model.name}
                            className="margin-auto z-0 h-full w-full object-cover"
                            loading="lazy"
                            src={getPreviewImage(model.images[0])}
                        />
                    ) : (
                        <div className="margin-auto z-0 w-full text-center">No Image</div>
                    )}
                </Link>

                <div className={style.details}>
                    <Link
                        className={`${style.name} block text-xl font-bold text-gray-800 dark:text-gray-100`}
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
                    <div className="flex flex-row flex-wrap gap-1 text-xs">
                        <EditableTags
                            readonly={!editMode}
                            tags={model.tags}
                            onChange={(tags) => updateModelProperty('tags', tags)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

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
