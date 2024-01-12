export const toDirectDownloadLink = (url: string): string => {
    // convert google drive file links
    // https://drive.google.com/file/d/1DbbM4saRpJu0dmgvccQFwfF4zI2rjiQ_
    const googleDriveFileId = /^https:\/\/drive.google.com\/file\/d\/([a-zA-Z0-9_\-]+)(?:\/view(?:\?.*)?)?$/.exec(url);
    if (googleDriveFileId) {
        const fileId = googleDriveFileId[1];
        return `https://drive.google.com/uc?export=download&confirm=1&id=${fileId}`;
    }

    try {
        // https://drive.google.com/u/1/uc?id=10h8YXKKOQ61ANnwLjjHqXJdn4SbBuUku&export=download
        // https://drive.google.com/open?id=1geNLDAnQzLadMvvoRLhVy4MXhQf5t8JP
        if (/^https:\/\/drive.google.com\/(?:u\/1\/uc|open)(?=\?)(?=.*?[?&]id=)/.test(url)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const fileId = new URL(url).searchParams.get('id')!;
            return `https://drive.google.com/uc?export=download&confirm=1&id=${fileId}`;
        }
    } catch {
        // ignore
    }

    return url;
};

export const isSelfHosted = (url: string): boolean => {
    return url.startsWith('https://objectstorage.us-phoenix-1.oraclecloud.com/n/ax6ygfvpvzka/b/open-modeldb-files/');
};
