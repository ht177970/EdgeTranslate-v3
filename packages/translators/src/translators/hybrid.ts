import {
    Definition,
    DetailedMeaning,
    Example,
    PronunciationSpeed,
    TranslationResult,
} from "../types";
import BingTranslator from "./bing";
import DeepLTranslator from "./deepl";
import GoogleTranslator from "./google";
import { LRUCache } from "../utils/lru";
import { fnv1a32 } from "../utils/hash";

export type HybridSupportedTranslators =
    | "BingTranslate"
    | "DeepLTranslate"
    | "GoogleTranslate";

export type HybridConfig = {
    selections: Selections;
    translators: HybridSupportedTranslators[]; // a collection of used translators which is generated based on selections. The generating process is in options.js.
};
export type Selections = Record<keyof TranslationResult, HybridSupportedTranslators>;

/**
 * Request batching system for improved network efficiency
 */
class RequestBatcher {
    private pendingRequests: Array<{
        text: string;
        from: string;
        to: string;
        resolve: (result: TranslationResult) => void;
        reject: (error: any) => void;
        timestamp: number;
    }> = [];
    
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY = 5; // Reduced from 20ms to 5ms for faster batching
    private readonly MAX_BATCH_SIZE = 15; // Increased from 10 to 15 for better efficiency
    private readonly MAX_BATCH_CHARS = 7500; // Increased from 5000 to 7500
    
    constructor(private translator: HybridTranslator) {}

    /**
     * Add a translation request to the batch
     */
    async addRequest(text: string, from: string, to: string): Promise<TranslationResult> {
        return new Promise((resolve, reject) => {
            this.pendingRequests.push({
                text,
                from,
                to,
                resolve,
                reject,
                timestamp: Date.now()
            });

            // If batch is full or we've reached character limit, process immediately
            const totalChars = this.pendingRequests.reduce((sum, req) => sum + req.text.length, 0);
            if (this.pendingRequests.length >= this.MAX_BATCH_SIZE || totalChars >= this.MAX_BATCH_CHARS) {
                this.processBatch();
            } else {
                // Otherwise, set a timer to process the batch
                this.scheduleBatchProcessing();
            }
        });
    }

    /**
     * Schedule batch processing with a delay
     */
    private scheduleBatchProcessing(): void {
        if (this.batchTimeout) {
            return; // Already scheduled
        }

        this.batchTimeout = setTimeout(() => {
            this.processBatch();
        }, this.BATCH_DELAY);
    }

    /**
     * Process the current batch of requests
     */
    private async processBatch(): Promise<void> {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        if (this.pendingRequests.length === 0) {
            return;
        }

        const requests = [...this.pendingRequests];
        this.pendingRequests = [];

        try {
            await this.processBatchedRequests(requests);
        } catch (error) {
            // If batch processing fails, fall back to individual requests
            for (const request of requests) {
                try {
                    const result = await this.translator.translateSingle(request.text, request.from, request.to);
                    request.resolve(result);
                } catch (err) {
                    request.reject(err);
                }
            }
        }
    }

    /**
     * Process multiple requests efficiently
     */
    private async processBatchedRequests(requests: Array<{
        text: string;
        from: string;
        to: string;
        resolve: (result: TranslationResult) => void;
        reject: (error: any) => void;
        timestamp: number;
    }>): Promise<void> {
        // Group requests by language pair for better efficiency
        const grouped = this.groupByLanguagePair(requests);

        // Process each language pair group in parallel
        const promises = Object.entries(grouped).map(async ([langPair, groupRequests]) => {
            const [from, to] = langPair.split('|');
            return this.processLanguageGroup(groupRequests, from, to);
        });

        await Promise.allSettled(promises);
    }

    /**
     * Group requests by language pair
     */
    private groupByLanguagePair(requests: any[]): { [key: string]: any[] } {
        return requests.reduce((groups, request) => {
            const key = `${request.from}|${request.to}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(request);
            return groups;
        }, {});
    }

    /**
     * Process a group of requests with the same language pair
     */
    private async processLanguageGroup(requests: any[], _from: string, _to: string): Promise<void> {
        // For small groups, process in parallel
        if (requests.length <= 5) { // Increased from 3 to 5
            const promises = requests.map(async (request) => {
                try {
                    const result = await this.translator.translateSingle(request.text, request.from, request.to);
                    request.resolve(result);
                } catch (error) {
                    request.reject(error);
                }
            });
            await Promise.allSettled(promises);
            return;
        }

        // For larger groups, process with controlled concurrency
        const concurrencyLimit = 5; // Increased from 3 to 5
        for (let i = 0; i < requests.length; i += concurrencyLimit) {
            const batch = requests.slice(i, i + concurrencyLimit);
            const promises = batch.map(async (request) => {
                try {
                    const result = await this.translator.translateSingle(request.text, request.from, request.to);
                    request.resolve(result);
                } catch (error) {
                    request.reject(error);
                }
            });
            await Promise.allSettled(promises);
        }
    }

    /**
     * Get batching statistics
     */
    getStats() {
        return {
            pendingRequests: this.pendingRequests.length,
            batchDelay: this.BATCH_DELAY,
            maxBatchSize: this.MAX_BATCH_SIZE,
            maxBatchChars: this.MAX_BATCH_CHARS
        };
    }
}

/**
 * Smart prefetching system that learns user patterns
 */
class SmartPrefetcher {
    private languagePairFrequency = new Map<string, number>();
    private textPatterns = new Map<string, { frequency: number; lastUsed: number; predictions: string[] }>();
    private prefetchQueue = new Set<string>();
    private readonly MAX_PREFETCH_QUEUE = 15; // Reduced from 20 to 15
    private readonly PATTERN_DECAY_TIME = 20 * 60 * 1000; // Reduced from 30 to 20 minutes
    private readonly MIN_FREQUENCY_FOR_PREFETCH = 1; // Reduced from 2 to 1

    constructor(private translator: HybridTranslator) {}

    /**
     * Learn from user translation patterns
     */
    learnPattern(text: string, from: string, to: string): void {
        const langPair = `${from}|${to}`;
        
        // Track language pair frequency
        this.languagePairFrequency.set(langPair, (this.languagePairFrequency.get(langPair) || 0) + 1);
        
        // Track text patterns (first 3 words)
        const words = text.toLowerCase().trim().split(/\s+/).slice(0, 3);
        if (words.length >= 2) {
            const pattern = words.join(' ');
            const existing = this.textPatterns.get(pattern) || { frequency: 0, lastUsed: 0, predictions: [] };
            
            existing.frequency++;
            existing.lastUsed = Date.now();
            
            // Add full text as prediction if it's not already there
            if (!existing.predictions.includes(text) && existing.predictions.length < 3) { // Reduced from 5 to 3
                existing.predictions.push(text);
            }
            
            this.textPatterns.set(pattern, existing);
        }

        // Clean old patterns occasionally
        if (Math.random() < 0.05) { // Reduced from 0.1 to 0.05
            this.cleanOldPatterns();
        }
    }

    /**
     * Get prefetch suggestions based on current text
     */
    getPrefetchSuggestions(text: string, from: string, to: string): Array<{ text: string; from: string; to: string; confidence: number }> {
        const suggestions: Array<{ text: string; from: string; to: string; confidence: number }> = [];
        const words = text.toLowerCase().trim().split(/\s+/).slice(0, 3);
        
        if (words.length < 2) return suggestions;

        const pattern = words.join(' ');
        const patternData = this.textPatterns.get(pattern);
        
        if (patternData && patternData.frequency >= this.MIN_FREQUENCY_FOR_PREFETCH) {
            // Suggest related texts based on pattern
            for (const prediction of patternData.predictions) {
                if (prediction !== text) {
                    const confidence = Math.min(patternData.frequency / 5, 0.9); // Reduced denominator from 10 to 5
                    suggestions.push({ text: prediction, from, to, confidence });
                }
            }
        }

        // Also suggest common language pairs
        const reverseLangPair = `${to}|${from}`;
        
        if (this.languagePairFrequency.get(reverseLangPair) && this.languagePairFrequency.get(reverseLangPair)! >= 2) { // Reduced from 3 to 2
            suggestions.push({ text, from: to, to: from, confidence: 0.7 }); // Increased from 0.6 to 0.7
        }

        return suggestions.slice(0, 2); // Reduced from 3 to 2 suggestions
    }

    /**
     * Execute prefetching in background
     */
    async prefetch(suggestions: Array<{ text: string; from: string; to: string; confidence: number }>): Promise<void> {
        for (const suggestion of suggestions) {
            if (this.prefetchQueue.size >= this.MAX_PREFETCH_QUEUE) {
                break;
            }

            const cacheKey = `${suggestion.from}|${suggestion.to}|${suggestion.text.toLowerCase().trim()}`;
            
            // Skip if already in queue or cache
            if (this.prefetchQueue.has(cacheKey) || this.translator.hasInCache(cacheKey)) {
                continue;
            }

            this.prefetchQueue.add(cacheKey);

            // Prefetch with low priority (add small delay)
            setTimeout(async () => {
                try {
                    await this.translator.translateSingle(suggestion.text, suggestion.from, suggestion.to);
                } catch (error) {
                    // Ignore prefetch errors
                    console.debug('Prefetch failed:', error);
                } finally {
                    this.prefetchQueue.delete(cacheKey);
                }
            }, suggestion.confidence > 0.8 ? 50 : 150); // Faster prefetch times
        }
    }

    /**
     * Clean old patterns to prevent memory bloat
     */
    private cleanOldPatterns(): void {
        const now = Date.now();
        for (const [pattern, data] of this.textPatterns) {
            if (now - data.lastUsed > this.PATTERN_DECAY_TIME) {
                this.textPatterns.delete(pattern);
            }
        }
    }

    /**
     * Get most common language pairs
     */
    getTopLanguagePairs(limit = 3): Array<{ pair: string; frequency: number }> { // Reduced from 5 to 3
        return Array.from(this.languagePairFrequency.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([pair, frequency]) => ({ pair, frequency }));
    }

    /**
     * Get prefetching statistics
     */
    getStats() {
        return {
            languagePairs: this.languagePairFrequency.size,
            textPatterns: this.textPatterns.size,
            prefetchQueueSize: this.prefetchQueue.size,
            maxPrefetchQueue: this.MAX_PREFETCH_QUEUE,
            patternDecayTime: this.PATTERN_DECAY_TIME,
            minFrequencyForPrefetch: this.MIN_FREQUENCY_FOR_PREFETCH
        };
    }
}

class HybridTranslator {
    channel: any; // communication channel.
    /**
     * Hybrid translator config.
     */
    CONFIG: HybridConfig = {
        selections: {} as Selections,
        translators: [],
    };
    REAL_TRANSLATORS: {
        BingTranslate: BingTranslator;
        GoogleTranslate: GoogleTranslator;
        DeepLTranslate: DeepLTranslator;
    };
    MAIN_TRANSLATOR: HybridSupportedTranslators = "GoogleTranslate";

    /**
     * Request batcher for improved network efficiency (lazy loaded)
     */
    private _batcher?: RequestBatcher;

    /**
     * Smart prefetcher for predictive caching (lazy loaded)
     */
    private _prefetcher?: SmartPrefetcher;

    // Cache: translation results by (text,from,to) hash
    private cache = new LRUCache<string, TranslationResult>({ max: 250, ttl: 15 * 60 * 1000 }); // Increased cache size and TTL
    // In-flight requests to dedupe concurrent calls
    private inflight = new Map<string, Promise<TranslationResult>>();

    // Statistics
    private stats = {
        requests: 0,
        cacheHits: 0,
        errors: 0
    };

    constructor(config: HybridConfig, channel: any) {
        this.channel = channel;

        /**
         * Real supported translators.
         */
        this.REAL_TRANSLATORS = {
            BingTranslate: new BingTranslator(),
            GoogleTranslate: new GoogleTranslator(),
            DeepLTranslate: null as unknown as DeepLTranslator,
        };

        /**
         * DeepL translator needs help from other translators and we choose Google for now.
         */
        this.REAL_TRANSLATORS.DeepLTranslate = new DeepLTranslator(
            this.REAL_TRANSLATORS.BingTranslate,
            this.REAL_TRANSLATORS.BingTranslate
        );

        this.useConfig(config);

        // Warm up translators proactively to reduce first translation latency
        this.warmUpTranslators();
    }

    /**
     * Lazy getters for performance components
     */
    private get batcher(): RequestBatcher {
        if (!this._batcher) {
            this._batcher = new RequestBatcher(this);
        }
        return this._batcher;
    }

    private get prefetcher(): SmartPrefetcher {
        if (!this._prefetcher) {
            this._prefetcher = new SmartPrefetcher(this);
        }
        return this._prefetcher;
    }

    /**
     * Warm up translators in the background to reduce cold start latency
     */
    private async warmUpTranslators() {
        // Start warming up translators immediately
        setTimeout(() => {
            // Warm up Bing translator
            this.REAL_TRANSLATORS.BingTranslate.warmUp().catch(() => {
                // Ignore warmup failures
            });
            
            // Google translator doesn't have a warmUp method, so we skip it
        }, 100); // Small delay to not block constructor
    }

    /**
     * Update config.
     *
     * @param {Object} config to use.
     */
    useConfig(config: HybridConfig) {
        /**
         * Validate config.
         */
        if (!config || !config.translators || !config.selections) {
            console.error("Invalid config for HybridTranslator!");
            return;
        }

        this.CONFIG = config;
        this.MAIN_TRANSLATOR = config.selections.mainMeaning;
    }

    /**
     * Get translators that support given source language and target language.
     *
     * @param from source language
     * @param to target language
     *
     * @returns available translators
     */
    getAvailableTranslatorsFor(from: string, to: string) {
        const translators: HybridSupportedTranslators[] = [];
        for (const translator of Object.keys(this.REAL_TRANSLATORS) as HybridSupportedTranslators[]) {
            const languages = this.REAL_TRANSLATORS[translator].supportedLanguages();
            if (languages.has(from) && languages.has(to)) {
                translators.push(translator);
            }
        }
        // Sort with Google Translate as the first preference
        return translators.sort((a, b) => {
            if (a === "GoogleTranslate") return -1;
            if (b === "GoogleTranslate") return 1;
            return a.localeCompare(b);
        });
    }

    /**
     * Update hybrid translator config when language setting changed.
     *
     * @param from source language
     * @param to target language
     *
     * @returns new config
     */
    updateConfigFor(from: string, to: string) {
        const newConfig: HybridConfig = { translators: [], selections: {} as Selections };
        const translatorsSet = new Set<HybridSupportedTranslators>();

        // Get translators that support new language setting.
        const availableTranslators = this.getAvailableTranslatorsFor(from, to);

        // Replace translators that don't support new language setting with a default translator.
        const defaultTranslator = availableTranslators[0];

        // Use this set to check if a translator in the old config should be replaced.
        const availableTranslatorSet = new Set(availableTranslators);

        let item: keyof Selections;
        for (item in this.CONFIG.selections) {
            let newTranslator,
                oldTranslator = this.CONFIG.selections[item];

            if (availableTranslatorSet.has(oldTranslator)) {
                newConfig.selections[item] = oldTranslator;
                newTranslator = oldTranslator;
            } else {
                newConfig.selections[item] = defaultTranslator;
                newTranslator = defaultTranslator;
            }

            translatorsSet.add(newTranslator);
        }

        // Update used translator set.
        newConfig.translators = Array.from(translatorsSet);

        // Provide new config.
        return newConfig;
    }

    /**
     * Detect language of given text.
     *
     * @param text text
     *
     * @returns Promise of language of given text
     */
    async detect(text: string) {
        return this.REAL_TRANSLATORS[this.MAIN_TRANSLATOR].detect(text);
    }

    /**
     * Check if key exists in cache
     */
    hasInCache(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Single translation without batching - used internally by batcher.
     *
     * @param text text to translate
     * @param from source language
     * @param to target language
     *
     * @returns {Promise<Object>} translation Promise
     */
    async translateSingle(text: string, from: string, to: string) {
        // Track request statistics
        this.stats.requests++;

        // Create cache key and check for cached result
        const cacheKey = `${from}|${to}|${text.toLowerCase().trim()}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            this.stats.cacheHits++;
            return cached;
        }

        // Initiate translation requests.
        let requests: Promise<[HybridSupportedTranslators, TranslationResult]>[] = [];
        for (let translator of this.CONFIG.translators) {
            // Translate with a translator.
            requests.push(
                this.REAL_TRANSLATORS[translator]
                    .translate(text, from, to)
                    .then((result) => [translator, result] as [HybridSupportedTranslators, TranslationResult])
            );
        }

        // Combine all results.
        const translation: TranslationResult = {
            originalText: "",
            mainMeaning: "",
        };
        const results = new Map(await Promise.all(requests));
        
        // Process each component with fallback support
        let item: keyof Selections;
        for (item in this.CONFIG.selections) {
            try {
                const selectedTranslator = this.CONFIG.selections[item];
                const selectedResult = results.get(selectedTranslator)!;
                
                // Check if the selected translator provided the component
                if (selectedResult[item] && this.hasValue(selectedResult[item])) {
                    // Use the value from the selected translator
                    translation[item] = selectedResult[item] as string &
                        DetailedMeaning[] &
                        Definition[] &
                        Example[];
                } else {
                    // Fallback: Try to get the component from Google Translate if available
                    const googleResult = results.get("GoogleTranslate");
                    if (googleResult && googleResult[item] && this.hasValue(googleResult[item])) {
                        translation[item] = googleResult[item] as string &
                            DetailedMeaning[] &
                            Definition[] &
                            Example[];
                    } else if (selectedResult[item]) {
                        // Fallback to selected translator's value even if it's empty/undefined
                        // to avoid missing components
                        translation[item] = selectedResult[item] as string &
                            DetailedMeaning[] &
                            Definition[] &
                            Example[];
                    }
                }
            } catch (error) {
                console.log(`${item} ${this.CONFIG.selections[item]}`);
                console.log(error);
            }
        }
        
        // Fill passthrough originalText if empty
        if (!translation.originalText) translation.originalText = text;
        
        // Cache the final result
        this.cache.set(cacheKey, translation);
        return translation;
    }

    /**
     * Hybrid translate with batching and smart prefetching for improved performance.
     *
     * @param text text to translate
     * @param from source language
     * @param to target language
     *
     * @returns result Promise
     */
    async translate(text: string, from: string, to: string) {
        // Fast paths: ignore empty/whitespace
        if (!text || !text.trim()) {
            return { originalText: text || "", mainMeaning: "" } as TranslationResult;
        }

        // Normalize inputs to keep key stable
        const key = `H|${from}|${to}|${fnv1a32(text)}`;

        // Cache hit
        const cached = this.cache.get(key);
        if (cached) {
            this.stats.cacheHits++;
            
            // Learn pattern and prefetch in background (only if needed)
            if (this.stats.requests > 2) { // Reduced threshold from 3 to 2
                setTimeout(() => {
                    this.prefetcher.learnPattern(text, from, to);
                    const suggestions = this.prefetcher.getPrefetchSuggestions(text, from, to);
                    if (suggestions.length > 0) {
                        this.prefetcher.prefetch(suggestions).catch(() => {});
                    }
                }, 0);
            }
            
            return cached;
        }

        // In-flight dedupe
        const existing = this.inflight.get(key);
        if (existing) return existing;

        // For first few requests, use direct translation (faster)
        if (this.stats.requests < 1) { // Reduced threshold from 2 to 1
            try {
                const result = await this.translateSingle(text, from, to);
                this.stats.requests++;
                return result;
            } catch (error) {
                // Fall back to batch system
            }
        }

        // Learn pattern for frequent users only
        if (this.stats.requests > 2) { // Reduced threshold from 3 to 2
            this.prefetcher.learnPattern(text, from, to);
            
            // Get prefetch suggestions
            const suggestions = this.prefetcher.getPrefetchSuggestions(text, from, to);
            
            // Start prefetching in background (non-blocking)
            if (suggestions.length > 0) {
                this.prefetcher.prefetch(suggestions).catch(() => {}); // Ignore prefetch errors
            }
        }

        const exec = (async (): Promise<TranslationResult> => {
            try {
                // Use batching system for better efficiency
                const result = await this.batcher.addRequest(text, from, to);
                this.stats.requests++;
                return result;
            } catch (error) {
                this.stats.errors++;
                throw error;
            }
        })();

        this.inflight.set(key, exec);
        try {
            const res = await exec;
            return res;
        } finally {
            this.inflight.delete(key);
        }
    }

    /**
     * Pronounce given text.
     *
     * @param text text to pronounce
     * @param language language of text
     * @param speed "fast" or "slow"
     *
     * @returns pronounce finished
     */
    async pronounce(text: string, language: string, speed: PronunciationSpeed) {
        return this.REAL_TRANSLATORS[this.MAIN_TRANSLATOR].pronounce(text, language, speed);
    }

    /**
     * Pause pronounce.
     */
    async stopPronounce() {
        this.REAL_TRANSLATORS[this.MAIN_TRANSLATOR].stopPronounce();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size(),
            maxSize: 250,
            ttl: 15 * 60 * 1000,
        };
    }

    /**
     * Get performance statistics from all translators
     */
    getPerformanceStats() {
        const cacheStats = this.getCacheStats();
        const stats: any = {
            ...this.stats,
            cacheSize: cacheStats.size,
            maxCacheSize: cacheStats.maxSize,
            cacheTTL: cacheStats.ttl,
            hitRate: this.stats.requests > 0 
                ? (this.stats.cacheHits / this.stats.requests * 100).toFixed(1) + '%'
                : '0%',
            inflight: this.inflight.size
        };

        // Only include component stats if they've been initialized (lazy loading)
        if (this._batcher) {
            stats.batcher = this._batcher.getStats();
        }
        
        if (this._prefetcher) {
            stats.prefetcher = this._prefetcher.getStats();
            stats.topLanguagePairs = this._prefetcher.getTopLanguagePairs(3);
        }

        // Get Bing translator stats if available
        if (this.REAL_TRANSLATORS.BingTranslate?.getPoolStats) {
            stats.bing = this.REAL_TRANSLATORS.BingTranslate.getPoolStats();
        }

        return stats;
    }

    /**
     * Cleanup all translator resources
     */
    async cleanup() {
        // Clear hybrid cache
        this.cache.clear();
        this.inflight.clear();

        // Cleanup individual translators
        if (this.REAL_TRANSLATORS.BingTranslate?.cleanup) {
            await this.REAL_TRANSLATORS.BingTranslate.cleanup();
        }
    }

    /**
     * Check if a value has meaningful content.
     * 
     * @param value The value to check
     * @returns true if the value has meaningful content, false otherwise
     */
    private hasValue(value: any): boolean {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') {
            // For objects, check if they have any enumerable properties
            return Object.keys(value).length > 0;
        }
        return true; // For other types (boolean, number, etc.)
    }
}

export default HybridTranslator;
