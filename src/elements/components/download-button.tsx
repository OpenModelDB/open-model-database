import { FiExternalLink } from 'react-icons/fi';
import { Resource } from '../../lib/schema';

type DownloadButtonProps = {
    url: string;
    resource: Resource;
};

const getHostFromUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url);
        const domainParts = parsedUrl.hostname.split('.');
        const domainAndTld = domainParts.slice(domainParts.length - 2).join('.');

        if (domainAndTld === 'github.com') {
            return 'GitHub';
        }
        if (parsedUrl.hostname === 'drive.google.com') {
            return 'Google Drive';
        }
        if (domainAndTld === 'mega.nz') {
            return 'Mega';
        }
        if (domainAndTld === 'pcloud.link') {
            return 'pCloud';
        }
        if (domainAndTld === 'icedrive.net') {
            return 'Icedrive';
        }
        return parsedUrl.hostname;
    } catch (e) {
        console.error(e);
        return 'unknown';
    }
};

export const DownloadButton = ({ url, resource }: DownloadButtonProps) => {
    const isExternal = !url.includes('oracle');
    const host = getHostFromUrl(url);

    return (
        <div key={resource.sha256}>
            <a
                className="mr-2 mb-2 inline-flex w-full cursor-pointer items-center rounded-lg border-0 border-accent-700 bg-accent-600 px-5 py-2.5 text-center text-lg font-medium text-white transition duration-100 ease-in-out hover:bg-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-700 dark:bg-accent-500 dark:hover:bg-accent-600 dark:focus:ring-accent-500"
                href={url}
                rel="noreferrer"
                target="_blank"
                type="button"
            >
                <div className="w-full">
                    {isExternal ? (
                        <FiExternalLink
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 22 22"
                        />
                    ) : (
                        <svg
                            className="mr-2 h-4 w-4 fill-current"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                        </svg>
                    )}
                    Download {resource.size ? `(${(resource.size / 1024 / 1024).toFixed(1)} MB)` : ''}
                </div>
            </a>
            <div className="w-full text-center">
                {isExternal ? `Hosted offsite by ${host}` : 'Hosted by OpenModelDB'}
            </div>
        </div>
    );
};
