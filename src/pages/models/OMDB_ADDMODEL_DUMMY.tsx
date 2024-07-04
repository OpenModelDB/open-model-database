import { GetStaticProps } from 'next';
import { useEffect, useState } from 'react';
import { Model, ModelId } from '../../lib/schema';
import ModelsPage from './[id]';

const modelId = 'OMDB_ADDMODEL_DUMMY' as ModelId;

export default function Page() {
    const [model, setModel] = useState<Model | null>(null);

    useEffect(() => {
        const model = JSON.parse(sessionStorage.getItem('dummy-model') ?? '{}') as Model;
        setModel(model);
    }, []);

    if (!model) return null;

    return (
        <div>
            <ModelsPage
                editModeOverride
                modelId={modelId}
                staticCollectionData={{}}
                staticModelData={{ [modelId]: model }}
                staticSimilar={[]}
            />
        </div>
    );
}

export const getStaticProps: GetStaticProps = () => {
    return { props: {} };
};
