import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { EditableIntegerLabel } from '../elements/components/editable-label';
import { HeadCommon } from '../elements/head-common';
import { PageContainer } from '../elements/page';
import { useModels } from '../lib/hooks/use-models';
import { useWebApi } from '../lib/hooks/use-web-api';
import { ArchId, Model, ModelId } from '../lib/schema';
import { canonicalizeModelId } from '../lib/schema-util';

function PageContent() {
    const { modelData } = useModels();
    const router = useRouter();
    const { webApi, editMode } = useWebApi();

    const [processing, setProcessing] = useState(false);

    const [pretrained, setPretrained] = useState<ModelId | ''>('');
    const [idName, setIdName] = useState('Unknown');
    const [scale, setScale] = useState(1);
    const fullId = canonicalizeModelId(`${scale}x-${idName}`);

    if (!editMode || !modelData.size) return null;

    const addModel = async () => {
        if (modelData.has(fullId)) {
            alert(`Model ${fullId} already exists`);
            return;
        }

        const model: Model = {
            name: idName,
            author: [],
            license: null,
            tags: [],
            description: '',
            date: new Date().toISOString().split('T')[0],
            architecture: 'esrgan' as ArchId,
            size: null,
            scale,
            inputChannels: 3,
            outputChannels: 3,
            resources: [],
            images: [],
        };

        const pre = pretrained ? modelData.get(pretrained) : undefined;
        if (pre && pretrained) {
            model.architecture = pre.architecture;
            model.inputChannels = pre.inputChannels;
            model.outputChannels = pre.outputChannels;
            model.size = pre.size;
            model.pretrainedModelG = pretrained;
        }

        setProcessing(true);
        await webApi.models.update([[fullId, model]]);

        // fetch before navigating to ensure the model page is available
        const page = `/models/${fullId}`;
        await fetch(page);
        await router.push(`/models/${fullId}`);
    };

    return (
        <>
            <h1>Add Model</h1>
            <div className="grid grid-cols-4">
                <div>Pretrained model:</div>
                <div className="col-span-3">
                    <select
                        className="w-full"
                        value={pretrained}
                        onChange={(e) => {
                            const value = e.target.value as ModelId | '';
                            setPretrained(value);
                            if (value) {
                                const model = modelData.get(value);
                                if (model) {
                                    setScale(model.scale);
                                }
                            }
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
                </div>

                <div>Id:</div>
                <div className="col-span-3">
                    <input
                        className="box-border w-full"
                        type="text"
                        value={idName}
                        onChange={(e) => setIdName(e.target.value)}
                    />
                </div>

                <div>Scale:</div>
                <div className="col-span-3">
                    <EditableIntegerLabel
                        readonly={!!pretrained}
                        value={scale}
                        onChange={setScale}
                    />
                </div>
            </div>
            <p>
                Full id: <code>{fullId}</code>
            </p>
            <p>
                <button
                    className={processing ? 'cursor-not-allowed' : 'cursor-pointer'}
                    disabled={processing}
                    onClick={() => {
                        addModel().catch((e) => console.error(e));
                    }}
                >
                    {processing ? 'Currently adding model' : 'Add Model'}
                </button>
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
