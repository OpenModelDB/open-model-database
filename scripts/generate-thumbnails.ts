import { execSync } from 'child_process';

function getPythonCommand() {
    if (process.platform === 'win32') {
        return 'python';
    }
    return 'python3';
}

// we'll just run the python script
execSync(`${getPythonCommand()} scripts/thumbnails.py`, { stdio: 'inherit' });
