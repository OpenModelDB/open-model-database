import { handleJsonApi } from '../../lib/server/api-impl';
import { fileApi } from '../../lib/server/file-data';

export default handleJsonApi(fileApi.architectures);
