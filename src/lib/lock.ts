class Mutex {
    private locked = false;
    private pending: (() => void)[] = [];
    lock(): Promise<void> {
        if (this.locked) {
            return new Promise((resolve) => {
                this.pending.push(resolve);
            });
        } else {
            this.locked = true;
            return Promise.resolve();
        }
    }
    unlock(): void {
        const next = this.pending.shift();
        if (next) {
            next();
        } else {
            this.locked = false;
        }
    }
}

export class RWLock {
    private b = 0;
    private r = new Mutex();
    private g = new Mutex();

    private async lockRead() {
        await this.r.lock();
        this.b++;
        if (this.b === 1) {
            await this.g.lock();
        }
        this.r.unlock();
    }
    private async unlockRead() {
        await this.r.lock();
        this.b--;
        if (this.b === 0) {
            this.g.unlock();
        }
        this.r.unlock();
    }
    private async lockWrite() {
        await this.g.lock();
    }
    private unlockWrite() {
        this.g.unlock();
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
