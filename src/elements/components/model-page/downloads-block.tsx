import { AiFillEdit } from 'react-icons/ai';
import { BsFillTrashFill } from 'react-icons/bs';
import { ModelId, Resource } from '../../../lib/schema';
import { DownloadButton } from '../download-button';
import { EditResourceButton } from '../download-button-edit-popover';

interface DownloadsBlockProps {
    resources: readonly Resource[];
    modelId: ModelId;
    editMode: boolean;
    onChange: (resources: Resource[]) => void;
    /** Resources already shown in the identity strip; skipped here in read mode. */
    skip: number;
}

/**
 * Only 9% of models have more than one resource, so in read mode this renders
 * for that minority alone. In edit mode it always renders, so resource
 * management has one unambiguous home rather than being split with the strip.
 */
export function DownloadsBlock({ resources, modelId, editMode, onChange, skip }: DownloadsBlockProps) {
    const shown = editMode ? resources : resources.slice(skip);
    if (shown.length === 0) return null;

    const replaceResource = (original: Resource, next: Resource) =>
        onChange(resources.map((r) => (r.sha256 === original.sha256 ? next : r)).filter((r) => r.urls.length > 0));

    return (
        <section>
            <h2 className="mt-0 mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                {editMode ? 'Downloads' : 'Other downloads'}
            </h2>
            <div className="flex w-full flex-col gap-2">
                {shown.map((resource) => (
                    <div
                        className="flex w-full flex-row gap-2"
                        key={resource.sha256}
                    >
                        <DownloadButton
                            readonly={!editMode}
                            resource={resource}
                            onChange={(newResource: Resource) => replaceResource(resource, newResource)}
                        />
                        {editMode && (
                            <>
                                <button
                                    aria-label="Delete resource"
                                    className="cursor-pointer bg-transparent"
                                    type="button"
                                    onClick={() => onChange(resources.filter((r) => r.sha256 !== resource.sha256))}
                                >
                                    <BsFillTrashFill />
                                </button>
                                <EditResourceButton
                                    modelId={modelId}
                                    resource={resource}
                                    onChange={(newResource) => replaceResource(resource, newResource)}
                                >
                                    <AiFillEdit />
                                </EditResourceButton>
                            </>
                        )}
                    </div>
                ))}
                {editMode && (
                    <EditResourceButton
                        modelId={modelId}
                        onChange={(newResource) => onChange([...resources, newResource])}
                    >
                        Add Resource
                    </EditResourceButton>
                )}
            </div>
        </section>
    );
}
