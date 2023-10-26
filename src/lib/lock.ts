import { Mutex } from 'async-mutex';

export class RWLock {
    private b = 0;
    private r = new Mutex();
    private g = new Mutex();

    private async lockRead() {
        const release = await this.r.acquire();
        try {
            this.b++;
            if (this.b === 1) {
                await this.g.acquire();
            }
        } finally {
            release();
        }
    }
    private async unlockRead() {
        const release = await this.r.acquire();
        try {
            this.b--;
            if (this.b === 0) {
                this.g.release();
            }
        } finally {
            release();
        }
    }
    private async lockWrite() {
        await this.g.acquire();
    }
    private unlockWrite() {
        this.g.release();
    }

    async read<T>(operation: () => Promise<T>): Promise<T> {
        await this.lockRead();
        try {
            return operation();
        } finally {
            await this.unlockRead();
        }
    }
    async write<T>(operation: () => Promise<T>): Promise<T> {
        await this.lockWrite();
        try {
            return operation();
        } finally {
            this.unlockWrite();
        }
    }
}
