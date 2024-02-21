import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { TextLink } from '../elements/components/link';
import { HeadCommon } from '../elements/head-common';
import { PageContainer } from '../elements/page';
import { useArchitectures } from '../lib/hooks/use-architectures';
import { useModels } from '../lib/hooks/use-models';
import { useTags } from '../lib/hooks/use-tags';
import { useWebApi } from '../lib/hooks/use-web-api';
import { withImpliedTags } from '../lib/implied-tags';
import { hashSha256 } from '../lib/model-files';
import { ParseResult, parseDiscordMessage } from '../lib/parse-discord-message';
import { Arch, ArchId, Model, ModelId, Tag, TagId } from '../lib/schema';
import { canonicalizeModelId } from '../lib/schema-util';
import type { ResponseJson } from './api/pth-metadata';

function getCommonPretrained(modelData: ReadonlyMap<ModelId, Model>): ModelId[] {
    const isPretrained = (id: ModelId) => {
        const model = modelData.get(id);
        if (!model) return false;
        return model.tags.includes('pretrained' as TagId) || model.tags.includes('research' as TagId);
    };

    const usage = new Map<ModelId, number>();
    const increment = (id: ModelId) => {
        const count = usage.get(id) ?? 0;
        usage.set(id, count + 1);
    };

    for (const [, model] of modelData) {
        if (model.pretrainedModelG && isPretrained(model.pretrainedModelG)) {
            increment(model.pretrainedModelG);
        }
    }

    return [...usage.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
}

function findArch(architectures: ReadonlyMap<ArchId, Arch>, search: string): ArchId | undefined {
    const passes: ((archId: ArchId, arch: Arch) => boolean)[] = [
        // exact match
        (archId, { name }) =>
            archId.toLowerCase() === search.toLowerCase() || name.toLowerCase() === search.toLowerCase(),
        // ignore punctuation
        (_, { name }) => name.replace(/[\s\-]/g, '').toLowerCase() === search.replace(/[\s\-]/g, '').toLowerCase(),
    ];

    for (const pass of passes) {
        for (const [archId, arch] of architectures) {
            if (pass(archId, arch)) {
                return archId;
            }
        }
    }
}

function guessTags(model: Model, tagData: ReadonlyMap<TagId, Tag>): TagId[] {
    const tags = new Set<TagId>();

    if (model.trainingOTF) {
        tags.add('restoration' as TagId);
    }
    if (/\bjpe?g\b/i.test(`${model.name} ${model.description}`)) {
        tags.add('jpeg' as TagId);
    }
    if (/\b(?:dds|dxt[1-5]?|bc[1-7])\b/i.test(`${model.name} ${model.description}`)) {
        tags.add('dds' as TagId);
    }

    if (/\b(?:anime|cartoon)\b/i.test(`${model.name} ${model.description}`)) {
        tags.add('anime' as TagId);
        tags.add('cartoon' as TagId);
    }
    if (/\b(?:manga)\b/i.test(`${model.name} ${model.description}`)) {
        tags.add('manga' as TagId);
    }

    return withImpliedTags(tags, tagData);
}

const EMPTY_PARSE_RESULT: ParseResult = { failed: [], parsed: {} };

const discordMessageTemplate = `
**Name:** ModelNameThatIsCreative
**License:** GNU GPL3 for example
**Link:** <Link.to.the.model.com>
**Model Architecture:** ESRGAN / PPON / PSNR / SR / ...
**Scale:** 1, 2, 3, 4, 8 or 16
**Purpose:** The kind of images the model is intended to process.

**Iterations:** Your Iterations
**batch_size:** Your batch_size
**HR_size:** Probably either 128 or 192
**Epoch:** The amounts of Epochs you trained your model for.
**Dataset:** What source images you trained you model on. Feel free to use links.
**Dataset_size:** How many images were in your training HR folder
**OTF Training** Yes / No
**Pretrained_Model_G:** What model did you use as a base

**Description:** Your Description
`.trim();

interface PthInfo {
    arch?: ArchId;
    size?: string[];
    scale?: number;
    inputChannels?: number;
    outputChannels?: number;
    fileSize: number;
    sha256: string;
}

function PageContent() {
    const { modelData } = useModels();
    const { archData } = useArchitectures();
    const { tagData } = useTags();
    const router = useRouter();
    const { webApi, editMode } = useWebApi();

    const [processing, setProcessing] = useState(false);

    const [pretrained, setPretrained] = useState<ModelId | ''>('');
    const [name, setName] = useState('Unknown');
    const [partialId, setPartialId] = useState<string>();
    const [scale, setScale] = useState(1);
    const [scaleDefinedBy, setScaleDefinedBy] = useState<string>();
    const fullId = canonicalizeModelId(`${scale}x-${partialId ?? name}`);
    const partialIdFromFull = fullId.slice(`${scale}x-`.length);

    const [hasMainPth, setHasMainPth] = useState(false);
    const [mainPthInfo, setMainPthInfo] = useState<PthInfo>();
    const [mainPthSpandrelError, setMainPthSpandrelError] = useState<string>();
    const [mainPthUrl, setMainPthUrl] = useState<string>();
    const [loadingMainPth, setLoadingMainPth] = useState(false);

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
        if (hasMainPth && mainPthInfo?.scale) {
            setScale(mainPthInfo.scale);
            setScaleDefinedBy('PTH file');
            return;
        }
        if (pretrained) {
            const model = modelData.get(pretrained);
            if (model) {
                setScale(model.scale);
                setScaleDefinedBy('pretrained model');
                return;
            }
        }
        if (parsedMessage.parsed.scale) {
            setScale(parsedMessage.parsed.scale);
            setScaleDefinedBy('discord message');
            return;
        }
        setScaleDefinedBy(undefined);
    }, [parsedMessage, hasMainPth, mainPthInfo, pretrained, modelData]);
    useEffect(() => {
        if (parsedMessage.parsed.link) {
            setHasMainPth(true);
            setMainPthUrl(parsedMessage.parsed.link);
            setMainPthInfo(undefined);
            setMainPthSpandrelError(undefined);
        } else {
            setHasMainPth(false);
        }
    }, [parsedMessage.parsed.link]);
    useEffect(() => {
        setPretrained(parsedMessage.parsed.pretrained ?? '');
    }, [parsedMessage.parsed.pretrained]);

    useEffect(() => {
        if (!hasMainPth) {
            setMainPthInfo(undefined);
        }
    }, [hasMainPth]);

    if (!editMode || !modelData.size) return null;

    const addModel = async () => {
        if (modelData.has(fullId)) {
            alert(`Model ${fullId} already exists`);
            return;
        }

        const description = [
            parsedMessage.parsed.purpose ? `Purpose: ${parsedMessage.parsed.purpose}` : '',
            parsedMessage.parsed.description ?? '',
        ]
            .join('\n\n')
            .trim();

        const model: Model = {
            name,
            author: [],
            license: parsedMessage.parsed.license ?? null,
            tags: [],
            description,
            date: new Date().toISOString().split('T')[0],
            architecture: parsedMessage.parsed.architecture ?? ('esrgan' as ArchId),
            size: null,
            scale,
            inputChannels: 3,
            outputChannels: 3,
            resources: [],
            images: [],
            dataset: parsedMessage.parsed.dataset,
            datasetSize: parsedMessage.parsed.datasetSize,
            trainingIterations: parsedMessage.parsed.trainingIterations,
            trainingBatchSize: parsedMessage.parsed.batchSize,
            trainingEpochs: parsedMessage.parsed.epoch,
            trainingHRSize: parsedMessage.parsed.hrSize,
            trainingOTF: parsedMessage.parsed.otf,
            pretrainedModelG: parsedMessage.parsed.pretrained,
        };

        const pre = pretrained ? modelData.get(pretrained) : undefined;
        if (pre && pretrained) {
            model.architecture = pre.architecture;
            model.inputChannels = pre.inputChannels;
            model.outputChannels = pre.outputChannels;
            model.size = pre.size;
            model.pretrainedModelG = pretrained;
        }

        if (hasMainPth && mainPthInfo && mainPthUrl) {
            if (mainPthInfo.inputChannels) model.inputChannels = mainPthInfo.inputChannels;
            if (mainPthInfo.outputChannels) model.outputChannels = mainPthInfo.outputChannels;
            if (mainPthInfo.size && mainPthInfo.size.length > 0) model.size = mainPthInfo.size;
            if (mainPthInfo.arch) model.architecture = mainPthInfo.arch;

            model.resources.push({
                platform: 'pytorch',
                type: 'pth',
                size: mainPthInfo.fileSize,
                sha256: mainPthInfo.sha256,
                urls: [mainPthUrl],
            });
        }

        model.tags = guessTags(model, tagData);

        setProcessing(true);
        await webApi.models.update([[fullId, model]]);

        // fetch before navigating to ensure the model page is available
        const page = `/models/${fullId}`;
        await fetch(page);
        await router.push(`/models/${fullId}`);
    };

    const onMainPthChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setMainPthSpandrelError(undefined);

        const file = e.target.files?.[0];
        if (!file) return;

        setLoadingMainPth(true);
        file.arrayBuffer()
            .then((data) => {
                const sha256 = hashSha256(data);
                const fileSize = data.byteLength;
                const metadata = fetch(`/api/pth-metadata`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: data,
                }).then((res) => res.json() as Promise<ResponseJson>);
                return Promise.all([fileSize, sha256, metadata]);
            })
            .then(([fileSize, sha256, metadata]) => {
                const info: PthInfo = {
                    fileSize,
                    sha256,
                };

                if (metadata.status === 'ok') {
                    info.arch = findArch(archData, metadata.data.architecture);
                    info.size = metadata.data.tags;
                    info.inputChannels = metadata.data.inputChannels;
                    info.outputChannels = metadata.data.outputChannels;
                    info.scale = metadata.data.scale;
                } else {
                    setMainPthSpandrelError(metadata.error);
                }

                setMainPthInfo(info);
            })
            .catch((e) => {
                setMainPthInfo(undefined);
                alert(`Error: ${String(e)}`);
            })
            .finally(() => {
                setLoadingMainPth(false);
            });
    };

    let inputError;
    if (name.trim() === '') {
        inputError = 'Name cannot be empty';
    } else if (hasMainPth && !mainPthInfo) {
        inputError = 'Select a valid .pth file';
    } else if (hasMainPth && !mainPthUrl) {
        inputError = 'Main .pth file URL is empty';
    }

    const canAddModel: boolean = !inputError && !processing && (!hasMainPth || !loadingMainPth);

    return (
        <>
            <h1>Add Model</h1>
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
                <div>Pretrained model:</div>
                <div className="col-span-3">
                    <select
                        className="w-full text-sm"
                        value={pretrained}
                        onChange={(e) => {
                            setPretrained(e.target.value as ModelId | '');
                        }}
                    >
                        <option value="">None</option>
                        {[...modelData.keys()].map((id) => (
                            <option
                                key={id}
                                value={id}
                            >
                                {id}
                            </option>
                        ))}
                    </select>
                    <div className="pb-2">
                        Common pretrained models:{' '}
                        {getCommonPretrained(modelData)
                            .slice(0, 40)
                            .map((id) => {
                                return (
                                    <>
                                        <span
                                            className={`${
                                                id === pretrained ? 'font-medium ' : ''
                                            }cursor-pointer whitespace-nowrap pr-1 hover:underline`}
                                            key={id}
                                            onClick={() => {
                                                setPretrained(id);
                                            }}
                                        >
                                            {id}
                                        </span>{' '}
                                    </>
                                );
                            })}
                    </div>
                </div>

                <div>Name:</div>
                <div className="col-span-3">
                    <input
                        className="box-border w-full text-sm"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>Scale:</div>
                <div className="col-span-3">
                    <input
                        className="text-sm"
                        max={32}
                        min={1}
                        readOnly={!!scaleDefinedBy}
                        type="number"
                        value={scale}
                        onChange={(e) =>
                            setScale((scale) => {
                                const n = Number(e.target.value) || scale;
                                return Math.max(1, Math.min(n, 32));
                            })
                        }
                    />
                    {!!scaleDefinedBy && <span className="ml-3 opacity-75">(Defined by {scaleDefinedBy})</span>}
                </div>

                <div>Id:</div>
                <div className="col-span-3">
                    <div className="relative">
                        <span
                            className="pointer-events-none absolute select-none font-mono text-sm"
                            style={{ top: '4.82px', left: '4px' }}
                        >
                            {scale}x-
                        </span>
                        <input
                            className="box-border w-full font-mono text-sm"
                            style={{ paddingLeft: `calc(3px + 0.55 * ${`${scale}x-`.length}em)` }}
                            type="text"
                            value={partialId ?? partialIdFromFull}
                            onBlur={(e) => {
                                const prefix = `${scale}x-`;
                                const newPartialId = canonicalizeModelId(prefix + e.target.value).slice(prefix.length);
                                setPartialId((prev) => {
                                    if (prev === undefined && newPartialId === partialIdFromFull) {
                                        return undefined;
                                    }
                                    return newPartialId || undefined;
                                });
                            }}
                            onChange={(e) => setPartialId(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const prefix = `${scale}x-`;
                                    const target = e.target as HTMLInputElement;
                                    const newPartialId = canonicalizeModelId(prefix + String(target.value)).slice(
                                        prefix.length
                                    );
                                    setPartialId(newPartialId || undefined);
                                }
                            }}
                        />
                    </div>
                </div>

                <div>Pth:</div>
                <div className="col-span-3">
                    <div>
                        <input
                            checked={hasMainPth}
                            className="mr-2"
                            id="main-pth"
                            type="checkbox"
                            onChange={(e) => {
                                setHasMainPth(e.target.checked);
                            }}
                        />
                        <label htmlFor="main-pth">
                            Has <code>.pth</code> file?
                        </label>
                    </div>
                    {hasMainPth && (
                        <>
                            <div>
                                {/* file input for .pth file */}
                                <input
                                    accept=".pth"
                                    className="box-border w-full text-sm"
                                    type="file"
                                    onChange={onMainPthChange}
                                />
                                {loadingMainPth && <span className="pl-4">Loading...</span>}
                                <span className="pl-4 text-red-300">{mainPthSpandrelError}</span>
                            </div>
                            <div>
                                {/* url input */}
                                <input
                                    className="box-border w-full text-sm"
                                    placeholder="Download URL for .pth file"
                                    type="text"
                                    value={mainPthUrl}
                                    onChange={(e) => setMainPthUrl(e.target.value)}
                                />
                                <TextLink
                                    external
                                    className={!mainPthUrl ? 'pointer-events-none opacity-0' : ''}
                                    href={mainPthUrl || ''}
                                >
                                    Visit link
                                </TextLink>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <p>
                <button
                    className={!canAddModel ? 'cursor-not-allowed' : 'cursor-pointer'}
                    disabled={!canAddModel}
                    onClick={() => {
                        addModel().catch((e) => console.error(e));
                    }}
                >
                    {processing ? 'Currently adding model' : 'Add Model'}
                </button>
                <span className="pl-4 text-red-300">{inputError}</span>
            </p>
        </>
    );
}

export default function Page() {
    return (
        <>
            <HeadCommon title="Add model" />
            <PageContainer wrapper>
                <PageContent />
            </PageContainer>
        </>
    );
}
