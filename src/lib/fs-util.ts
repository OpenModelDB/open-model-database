import { constants } from 'fs';
import fs from 'fs/promises';

export function fileExists(file: string): Promise<boolean> {
    return fs.access(file, constants.F_OK).then(
        () => true,
        () => false
    );
}
