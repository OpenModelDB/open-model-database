import { Arch, ArchId } from '../schema';
import { STATIC_ARCH_DATA } from '../static-data';

export interface UseArchitectures {
    readonly archData: ReadonlyMap<ArchId, Arch>;
}

const result: UseArchitectures = {
    archData: STATIC_ARCH_DATA,
};

export function useArchitectures(): UseArchitectures {
    return result;
}
