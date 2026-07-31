import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { TextLink } from '../elements/components/link';
import { HeadCommon } from '../elements/head-common';
import { PageContainer } from '../elements/page';
import { useArchitectures } from '../lib/hooks/use-architectures';
import { useDatasets } from '../lib/hooks/use-datasets';
import { useModels } from '../lib/hooks/use-models';
import { useTags } from '../lib/hooks/use-tags';
import { useWebApi } from '../lib/hooks/use-web-api';
import { withImpliedTags } from '../lib/implied-tags';
import { ParseResult, parseDiscordMessage } from '../lib/parse-discord-message';
import { Dataset, DatasetId, Tag, TagId } from '../lib/schema';
import { canonicalizeDatasetId } from '../lib/schema-util';
import { IS_DEPLOYED } from '../lib/site-data';

function guessDatasetTags(name: string, description: string, tagData: ReadonlyMap<TagId, Tag>): TagId[] {
    const tags = new Set<TagId>();

    if (/\b(?:realistic|photo|photography|real)\b/i.test(`${name} ${description}`)) {
        tags.add('dataset:realistic' as TagId);
    }
    if (/\b(?:anime|cartoon)\b/i.test(`${name} ${description}`)) {
        tags.add('dataset:anime' as TagId);
    }
    if (/\b(?:manga)\b/i.test(`${name} ${description}`)) {
        tags.add('dataset:manga' as TagId);
    }
    if (/\b(?:game[- ]textures?|textures?)\b/i.test(`${name} ${description}`)) {
        tags.add('dataset:game-textures' as TagId);
    }

    return withImpliedTags(tags, tagData);
}

const EMPTY_PARSE_RESULT: ParseResult = { failed: [], parsed: {} };

const discordMessageTemplate = `
**Name:** DatasetNameThatIsCreative
**License:** GNU GPL3 for example
**Link:** <Link.to.the.dataset.com>
**Description:** Your Description
`.trim();

function PageContent() {
    const { datasetData } = useDatasets();
    const { modelData } = useModels();
    const { archData } = useArchitectures();
    const { tagData } = useTags();
    const router = useRouter();
    const { webApi, editMode } = useWebApi(IS_DEPLOYED);

    const [processing, setProcessing] = useState(false);
    const [name, setName] = useState('Unknown');
    const [partialId, setPartialId] = useState<string>();
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');

    let fullId = canonicalizeDatasetId(partialId ?? name);
    const partialIdFromFull = fullId;

    const [parseMessageTemplate, setParseMessageTemplate] = useState(false);
    const [messageTemplate, setMessageTemplate] = useState('');
    const parsedMessage = useMemo((): ParseResult => {
        if (!parseMessageTemplate) {
            return EMPTY_PARSE_RESULT;
        }
        return parseDiscordMessage(messageTemplate, modelData, archData);
    }, [parseMessageTemplate, messageTemplate, modelData, archData]);

    useEffect(() => {
        if (parsedMessage.parsed.name) {
            setName(parsedMessage.parsed.name.replace(/[\s_\-]+/g, ' '));
            setPartialId(undefined);
        }
    }, [parsedMessage.parsed.name]);

    useEffect(() => {
        if (parsedMessage.parsed.link) {
            setUrl(parsedMessage.parsed.link);
        }
    }, [parsedMessage.parsed.link]);

    useEffect(() => {
        if (parsedMessage.parsed.description) {
            setDescription(parsedMessage.parsed.description);
        }
    }, [parsedMessage.parsed.description]);

    if (!editMode) return null;

    const addDataset = async () => {
        if (datasetData.has(fullId)) {
            alert(`Dataset ${fullId} already exists`);
            return;
        }

        const combinedDescription = [
            parsedMessage.parsed.purpose ? `Purpose: ${parsedMessage.parsed.purpose}` : '',
            description || parsedMessage.parsed.description || '',
        ]
            .join('\n\n')
            .trim();

        const dataset: Dataset = {
            name,
            author: [],
            license: parsedMessage.parsed.license ?? null,
            tags: guessDatasetTags(name, combinedDescription, tagData),
            description: combinedDescription,
            date: new Date().toISOString().split('T')[0],
            url,
            images: [],
        };

        setProcessing(true);

        if (IS_DEPLOYED) {
            sessionStorage.setItem('dummy-datasetId', fullId);
            sessionStorage.setItem('dummy-dataset', JSON.stringify(dataset));
            fullId = 'OMDB_ADDDATASET_DUMMY' as DatasetId;
        }

        await webApi.datasets.update([[fullId, dataset]]);

        // fetch before navigating to ensure the dataset page is available
        const page = `/datasets/${fullId}`;
        await fetch(page);
        await router.push(`/datasets/${fullId}`);
    };

    let inputError;
    if (name.trim() === '') {
        inputError = 'Name cannot be empty';
    } else if (fullId.trim() === '') {
        inputError = 'ID cannot be empty';
    }

    const canAddDataset = !inputError && !processing;

    return (
        <>
            <h1>Add Dataset</h1>
            <div className="pb-4">
                <input
                    checked={parseMessageTemplate}
                    className="mr-2"
                    id="parse-message-template"
                    type="checkbox"
                    onChange={(e) => {
                        setParseMessageTemplate(e.target.checked);
                    }}
                />
                <label htmlFor="parse-message-template">Parse Discord Message Template?</label>

                {parseMessageTemplate && (
                    <div className="pt-2">
                        <p className="mt-0">
                            How to use: Paste a message from the{' '}
                            <TextLink
                                external
                                href="https://discord.com/channels/547949405949657098/579685650824036387"
                            >
                                model-releases
                            </TextLink>{' '}
                            channel (or any message following the message template). <br />
                            To copy a message: Move your mouse over the message &gt; click on the three dots
                            (&#x22;More&#x22;) &gt; Copy Text.
                        </p>
                        <textarea
                            className="box-border w-full text-sm"
                            placeholder={discordMessageTemplate}
                            style={{ resize: 'vertical', minHeight: '24em' }}
                            value={messageTemplate}
                            onChange={(e) => setMessageTemplate(e.target.value)}
                        />
                        {parsedMessage.failed.length > 0 && (
                            <pre className="whitespace-pre-wrap text-red-800 dark:text-red-300">
                                <code>
                                    <span className="italic">Unable to parse the following parts of the message:</span>
                                    {'\n\n'}
                                    {parsedMessage.failed.join('\n')}
                                </code>
                            </pre>
                        )}
                        <pre className="hidden whitespace-pre-wrap">
                            <code>Parsed: {JSON.stringify(parsedMessage.parsed, undefined, 4)}</code>
                        </pre>
                        <hr />
                    </div>
                )}
            </div>
            <div className="grid grid-cols-4 gap-2">
                <div>Name:</div>
                <div className="col-span-3">
                    <input
                        className="box-border w-full text-sm"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>Id:</div>
                <div className="col-span-3">
                    <div className="relative">
                        <input
                            className="box-border w-full font-mono text-sm"
                            type="text"
                            value={partialId ?? partialIdFromFull}
                            onBlur={(e) => {
                                const newPartialId = canonicalizeDatasetId(e.target.value);
                                setPartialId((prev) => {
                                    if (prev === undefined && newPartialId === partialIdFromFull) {
                                        return undefined;
                                    }
                                    return String(newPartialId) ? newPartialId : undefined;
                                });
                            }}
                            onChange={(e) => setPartialId(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement;
                                    const newPartialId = canonicalizeDatasetId(String(target.value));
                                    setPartialId(String(newPartialId) ? newPartialId : undefined);
                                }
                            }}
                        />
                    </div>
                </div>

                <div>Homepage/URL:</div>
                <div className="col-span-3">
                    <input
                        className="box-border w-full text-sm"
                        placeholder="https://example.com/dataset"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>

                <div>Description:</div>
                <div className="col-span-3">
                    <textarea
                        className="box-border w-full text-sm"
                        placeholder="Markdown supported description of the dataset..."
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            <p>
                <button
                    className={!canAddDataset ? 'cursor-not-allowed' : 'cursor-pointer'}
                    disabled={!canAddDataset}
                    onClick={() => {
                        addDataset().catch((e) => console.error(e));
                    }}
                >
                    {processing ? 'Currently adding dataset' : 'Add Dataset'}
                </button>
                <span className="pl-4 text-red-300">{inputError}</span>
            </p>
        </>
    );
}

export default function Page() {
    return (
        <>
            <HeadCommon title="Add dataset" />
            <PageContainer wrapper>
                <PageContent />
            </PageContainer>
        </>
    );
}
