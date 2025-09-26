type Clock = () => number;

export interface LRUOptions {
    max: number; // max entries
    ttl?: number; // time-to-live in ms
    now?: Clock; // for tests
}

interface Entry<V> {
    value: V;
    expiresAt: number | null;
}

/**
 * Minimal LRU with optional TTL. O(1) get/set, prunes on set when over capacity.
 */
export class LRUCache<K, V> {
    private map: Map<K, Entry<V>>;
    private max: number;
    private ttl: number | undefined;
    private now: Clock;

    constructor(opts: LRUOptions) {
        this.max = Math.max(1, opts.max | 0);
        this.ttl = opts.ttl;
        this.now = opts.now || Date.now;
        this.map = new Map();
    }

    get(key: K): V | undefined {
        const e = this.map.get(key);
        if (!e) return undefined;
        if (e.expiresAt != null && e.expiresAt <= this.now()) {
            this.map.delete(key);
            return undefined;
        }
        // refresh recency
        this.map.delete(key);
        this.map.set(key, e);
        return e.value;
    }

    set(key: K, value: V): void {
        const expiresAt = this.ttl ? this.now() + this.ttl : null;
        if (this.map.has(key)) this.map.delete(key);
        this.map.set(key, { value, expiresAt });
        if (this.map.size > this.max) {
            // delete oldest
            const oldest = this.map.keys().next();
            if (!oldest.done) this.map.delete(oldest.value);
        }
    }

    has(key: K): boolean {
        return this.get(key) !== undefined;
    }

    size(): number {
        return this.map.size;
    }

    clear(): void {
        this.map.clear();
    }
}
