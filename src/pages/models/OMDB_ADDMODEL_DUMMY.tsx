import { GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { useEffect, useState } from 'react';
import { Model, ModelId } from '../../lib/schema';

import ModelsPage from './[id]';

type Params = ParsedUrlQuery;
interface Props {
    modelId: ModelId;
}

export default function Page({ modelId }: Props) {
    const [model, setModel] = useState<Model | null>(null);

    useEffect(() => {
        const model = JSON.parse(sessionStorage.getItem('dummy-model') ?? '{}') as Model;
        setModel(model);
    }, []);

    if (!model) return null;

    return (
        <div>
            <ModelsPage
                editModeOverride={true}
                modelData={{ [modelId]: model }}
                modelId={modelId}
                similar={[]}
            />
        </div>
    );
}

export const getStaticProps: GetStaticProps<Props, Params> = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return {
        props: { modelId: 'OMDB_ADDMODEL_DUMMY' as ModelId },
    };
};
