import React from 'react';
import { useTags } from '../../lib/hooks/use-tags';
import { useUsers } from '../../lib/hooks/use-users';
import { joinList } from '../../lib/react-util';
import { Model, ModelId } from '../../lib/schema';
import { asArray } from '../../lib/util';
import { Link } from './link';

type ModelCardProps = {
    id: ModelId;
    model: Model;
};

export const ModelCard = ({ id, model }: ModelCardProps) => {
    const { tagData } = useTags();
    const { userData } = useUsers();

    const description = fixDescription(model.description, model.scale);

    return (
        <div
            // eslint-disable-next-line tailwindcss/no-arbitrary-value
            className="group relative h-[350px] overflow-hidden rounded-lg border border-solid border-gray-300 shadow-lg hover:shadow-xl dark:border-gray-700 "
        >
            <div className="relative flex h-full w-full flex-col transition-all ease-in-out">
                {/* Arch tag on image */}
                <div className="absolute top-0 right-0 m-2">
                    <div className="flex flex-row flex-wrap place-content-center justify-items-center gap-x-2 align-middle">
                        <div className="rounded-lg bg-accent-500 px-2 py-1 text-sm font-medium text-gray-100 transition-colors ease-in-out dark:bg-accent-600 dark:text-gray-100 ">
                            {model.architecture}
                        </div>
                        <div className="rounded-lg bg-accent-500 px-2 py-1 text-sm font-medium text-gray-100 transition-colors ease-in-out dark:bg-accent-600 dark:text-gray-100 ">
                            {model.scale}x
                        </div>
                    </div>
                </div>

                <Link
                    // eslint-disable-next-line tailwindcss/no-arbitrary-value
                    className="h-auto w-full flex-1  bg-[url(https://picsum.photos/512/312)] bg-cover bg-center transition-all duration-500 ease-in-out group-hover:h-full"
                    href={`/models/${id}`}
                />

                <div className="relative inset-x-0 bottom-0 bg-white p-3 pt-2 dark:bg-fade-900">
                    <Link href={`/models/${id}`}>
                        <div className="block text-xl font-bold text-gray-800 dark:text-gray-100">{model.name}</div>
                    </Link>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <span>by </span>
                            {joinList(
                                asArray(model.author).map((userId) => (
                                    <Link
                                        className="font-bold text-accent-500"
                                        href={`/users/${userId}`}
                                        key={userId}
                                    >
                                        {userData.get(userId)?.name ?? `unknown user:${userId}`}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-1 flex flex-col justify-between py-1 text-sm">
                        <div className="text-gray-500 line-clamp-3 dark:text-gray-400">{description}</div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-row flex-wrap gap-1">
                        {model.tags.map((tagId) => (
                            <div
                                className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                                key={tagId}
                            >
                                {tagData.get(tagId)?.name ?? `unknown tag:${tagId}`}
                            </div>
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
