import { useEffect, useState } from 'react';
import { Model, ModelId } from '../../lib/schema';

import ModelsPage from './[id]';

export default function Page() {
    const [model, setModel] = useState<Model | null>(null);
    const id = 'OMDB_ADDMODEL_DUMMY' as ModelId;

    useEffect(() => {
        const model = JSON.parse(sessionStorage.getItem('dummy-model') ?? '{}') as Model;
        setModel(model);
    }, []);

    if (!model) return null;

    return (
        <ModelsPage
            modelData={{ [id]: model }}
            modelId={id}
            similar={[]}
        />
    );
}
