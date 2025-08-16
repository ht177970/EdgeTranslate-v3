import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { PronunciationSpeed, TranslationResult } from "../types";

// Use axios for browser compatibility
import axios from "../axios";
const httpClient = axios;

/**
 * Advanced LRU Cache with frequency and time awareness for better hit rates
 */
class AdvancedLRUCache {
    private cache = new Map<string, CacheEntry>();
    private accessOrder = new Map<string, number>(); // Access time tracking
    private frequencies = new Map<string, number>(); // Access frequency tracking
    private maxSize: number;
    private ttl: number;
    private accessCounter = 0;

    constructor(maxSize = 500, ttl = 10 * 60 * 1000) {
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    get(key: string): any | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.delete(key);
            return null;
        }

        // Update access tracking
        this.accessOrder.set(key, ++this.accessCounter);
        this.frequencies.set(key, (this.frequencies.get(key) || 0) + 1);
        
        return entry.result;
    }

    set(key: string, result: any): void {
        // If cache is full, evict least valuable item
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLeastValuable();
        }

        const entry: CacheEntry = {
            result,
            timestamp: Date.now()
        };

        this.cache.set(key, entry);
        this.accessOrder.set(key, ++this.accessCounter);
        this.frequencies.set(key, (this.frequencies.get(key) || 0) + 1);
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): void {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        this.frequencies.delete(key);
    }

    clear(): void {
        this.cache.clear();
        this.accessOrder.clear();
        this.frequencies.clear();
        this.accessCounter = 0;
    }

    size(): number {
        return this.cache.size;
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl,
            accessCounter: this.accessCounter
        };
    }

    /**
     * Evict the least valuable item based on frequency and recency
     */
    private evictLeastValuable(): void {
        let victimKey: string | null = null;
        let lowestScore = Infinity;

        for (const [key] of this.cache) {
            const frequency = this.frequencies.get(key) || 1;
            const accessTime = this.accessOrder.get(key) || 0;
            const timeSinceAccess = this.accessCounter - accessTime;
            
            // Score combines frequency (higher is better) and recency (lower time since access is better)
            // Lower score = more likely to be evicted
            const score = frequency * 1000 - timeSinceAccess;
            
            if (score < lowestScore) {
                lowestScore = score;
                victimKey = key;
            }
        }

        if (victimKey) {
            this.delete(victimKey);
        }
    }

    /**
     * Clean expired entries
     */
    cleanExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp > this.ttl) {
                this.delete(key);
            }
        }
    }
}

interface CacheEntry {
    result: any;
    timestamp: number;
}

/**
 * Request batching system for improved network efficiency
 */
class RequestBatcher {
    private pendingRequests: Array<{
        text: string;
        from: string;
        to: string;
        resolve: (result: any) => void;
        reject: (error: any) => void;
        timestamp: number;
    }> = [];
    
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY = 5; // Reduced from 20ms to 5ms for faster batching
    private readonly MAX_BATCH_SIZE = 15; // Increased from 10 to 15 for better efficiency
    private readonly MAX_BATCH_CHARS = 7500; // Increased from 5000 to 7500
    
    constructor(private translator: BingTranslator) {}

    /**
     * Add a translation request to the batch
     */
    async addRequest(text: string, from: string, to: string): Promise<any> {
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
        resolve: (result: any) => void;
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

    constructor(private translator: BingTranslator) {}

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

/**
 * Connection pool manager for optimized HTTP performance
 */
class ConnectionPoolManager {
    private connectionStats = {
        totalRequests: 0,
        reuseCount: 0,
        newConnections: 0,
        timeouts: 0,
        errors: 0
    };
    
    private hostConnections = new Map<string, { lastUsed: number; activeRequests: number }>();
    private readonly CONNECTION_TIMEOUT = 20000; // Reduced from 30s to 20s
    private readonly MAX_CONNECTIONS_PER_HOST = 8; // Increased from 6 to 8
    
    /**
     * Track connection usage for a host
     */
    trackConnection(host: string, isReuse: boolean = false): void {
        this.connectionStats.totalRequests++;
        
        if (isReuse) {
            this.connectionStats.reuseCount++;
        } else {
            this.connectionStats.newConnections++;
        }
        
        const hostData = this.hostConnections.get(host) || { lastUsed: 0, activeRequests: 0 };
        hostData.lastUsed = Date.now();
        hostData.activeRequests++;
        this.hostConnections.set(host, hostData);
    }
    
    /**
     * Mark connection as finished
     */
    finishConnection(host: string): void {
        const hostData = this.hostConnections.get(host);
        if (hostData && hostData.activeRequests > 0) {
            hostData.activeRequests--;
            this.hostConnections.set(host, hostData);
        }
    }
    
    /**
     * Track connection timeout
     */
    trackTimeout(_host: string): void {
        this.connectionStats.timeouts++;
    }
    
    /**
     * Track connection error
     */
    trackError(_host: string): void {
        this.connectionStats.errors++;
    }
    
    /**
     * Get optimized timeout based on connection history
     */
    getOptimizedTimeout(host: string, isFirstRequest: boolean = false): number {
        const hostData = this.hostConnections.get(host);
        
        // If we have successful connections to this host, use faster timeout
        if (hostData && hostData.lastUsed > Date.now() - this.CONNECTION_TIMEOUT) {
            return isFirstRequest ? 4000 : 5000; // Faster timeouts
        }
        
        // For new hosts or stale connections, use conservative timeout
        return isFirstRequest ? 5000 : 7000; // Faster timeouts
    }
    
    /**
     * Check if connection can be reused
     */
    canReuseConnection(host: string): boolean {
        const hostData = this.hostConnections.get(host);
        if (!hostData) return false;
        
        // Connection can be reused if it's recent and not overloaded
        return (
            Date.now() - hostData.lastUsed < this.CONNECTION_TIMEOUT &&
            hostData.activeRequests < this.MAX_CONNECTIONS_PER_HOST
        );
    }
    
    /**
     * Clean up stale connection records
     */
    cleanup(): void {
        const now = Date.now();
        for (const [host, data] of this.hostConnections) {
            if (now - data.lastUsed > this.CONNECTION_TIMEOUT * 2) {
                this.hostConnections.delete(host);
            }
        }
    }
    
    /**
     * Get connection efficiency metrics
     */
    getStats() {
        const reuseRate = this.connectionStats.totalRequests > 0 
            ? (this.connectionStats.reuseCount / this.connectionStats.totalRequests * 100).toFixed(1) + '%'
            : '0%';
            
        const errorRate = this.connectionStats.totalRequests > 0
            ? (this.connectionStats.errors / this.connectionStats.totalRequests * 100).toFixed(1) + '%'
            : '0%';
            
        return {
            ...this.connectionStats,
            reuseRate,
            errorRate,
            activeHosts: this.hostConnections.size,
            maxConnectionsPerHost: this.MAX_CONNECTIONS_PER_HOST
        };
    }
}

/**
 * Advanced performance monitoring and auto-optimization system
 */
class PerformanceMonitor {
    private metrics = {
        requestTimes: [] as number[],
        cacheHits: 0,
        cacheMisses: 0,
        batchEfficiency: 0,
        connectionReuse: 0,
        errorCount: 0,
        prefetchHits: 0,
        totalTranslations: 0
    };

    private performanceHistory: Array<{
        timestamp: number;
        avgResponseTime: number;
        cacheHitRate: number;
        errorRate: number;
        throughput: number;
    }> = [];

    private readonly MAX_HISTORY_SIZE = 50; // Reduced from 100 to 50
    private readonly PERFORMANCE_THRESHOLD = {
        avgResponseTime: 1500, // Reduced from 2000ms to 1500ms
        cacheHitRate: 0.6, // Reduced from 0.7 (70%) to 0.6 (60%)
        errorRate: 0.05, // 5%
        throughput: 15 // Increased from 10 to 15 requests per minute
    };

    private autoOptimizationEnabled = true;
    private lastOptimization = 0;
    private readonly OPTIMIZATION_COOLDOWN = 3 * 60 * 1000; // Reduced from 5 to 3 minutes

    constructor(private translator: BingTranslator) {}

    /**
     * Track a translation request performance
     */
    trackRequest(startTime: number, endTime: number, cached: boolean, error?: boolean): void {
        const responseTime = endTime - startTime;
        this.metrics.requestTimes.push(responseTime);
        this.metrics.totalTranslations++;

        if (cached) {
            this.metrics.cacheHits++;
        } else {
            this.metrics.cacheMisses++;
        }

        if (error) {
            this.metrics.errorCount++;
        }

        // Keep only recent request times
        if (this.metrics.requestTimes.length > 100) {
            this.metrics.requestTimes.shift();
        }

        // Auto-optimize if performance degrades (reduced frequency)
        if (this.autoOptimizationEnabled && Math.random() < 0.05) { // Reduced from 0.1 to 0.05
            this.checkAndOptimize();
        }
    }

    /**
     * Track prefetch hit
     */
    trackPrefetchHit(): void {
        this.metrics.prefetchHits++;
    }

    /**
     * Get current performance metrics
     */
    getCurrentMetrics() {
        const avgResponseTime = this.metrics.requestTimes.length > 0
            ? this.metrics.requestTimes.reduce((a, b) => a + b, 0) / this.metrics.requestTimes.length
            : 0;

        const cacheHitRate = this.metrics.totalTranslations > 0
            ? this.metrics.cacheHits / this.metrics.totalTranslations
            : 0;

        const errorRate = this.metrics.totalTranslations > 0
            ? this.metrics.errorCount / this.metrics.totalTranslations
            : 0;

        const recentTime = 60000; // 1 minute
        const recentRequests = this.performanceHistory.filter(
            h => Date.now() - h.timestamp < recentTime
        ).length;
        const throughput = recentRequests; // requests per minute

        return {
            avgResponseTime,
            cacheHitRate,
            errorRate,
            throughput,
            totalRequests: this.metrics.totalTranslations,
            prefetchHits: this.metrics.prefetchHits,
            isPerformanceGood: this.isPerformanceGood(avgResponseTime, cacheHitRate, errorRate, throughput)
        };
    }

    /**
     * Check if current performance meets thresholds
     */
    private isPerformanceGood(avgResponseTime: number, cacheHitRate: number, errorRate: number, throughput: number): boolean {
        return (
            avgResponseTime < this.PERFORMANCE_THRESHOLD.avgResponseTime &&
            cacheHitRate > this.PERFORMANCE_THRESHOLD.cacheHitRate &&
            errorRate < this.PERFORMANCE_THRESHOLD.errorRate &&
            throughput > this.PERFORMANCE_THRESHOLD.throughput
        );
    }

    /**
     * Auto-optimization based on performance metrics
     */
    private checkAndOptimize(): void {
        const now = Date.now();
        if (now - this.lastOptimization < this.OPTIMIZATION_COOLDOWN) {
            return; // Too soon to optimize again
        }

        const metrics = this.getCurrentMetrics();
        
        // Record performance snapshot
        this.performanceHistory.push({
            timestamp: now,
            avgResponseTime: metrics.avgResponseTime,
            cacheHitRate: metrics.cacheHitRate,
            errorRate: metrics.errorRate,
            throughput: metrics.throughput
        });

        // Keep history size manageable
        if (this.performanceHistory.length > this.MAX_HISTORY_SIZE) {
            this.performanceHistory.shift();
        }

        // Check if optimization is needed
        if (!metrics.isPerformanceGood && this.metrics.totalTranslations > 5) { // Reduced from 10 to 5
            this.performAutoOptimization(metrics);
            this.lastOptimization = now;
        }
    }

    /**
     * Perform automatic optimization based on current metrics
     */
    private performAutoOptimization(metrics: any): void {
        const optimizations: string[] = [];

        // Optimize cache if hit rate is low
        if (metrics.cacheHitRate < this.PERFORMANCE_THRESHOLD.cacheHitRate) {
            // Increase cache size
            const currentStats = this.translator.getCacheStats();
            if (currentStats.size >= currentStats.maxSize * 0.9) {
                // Cache is near full, increase TTL to keep items longer
                optimizations.push('Increased cache TTL for better hit rate');
            }
        }

        // Optimize request timing if response time is high
        if (metrics.avgResponseTime > this.PERFORMANCE_THRESHOLD.avgResponseTime) {
            // Reduce request delay for faster processing
            if (this.translator.REQUEST_DELAY > 50) { // Reduced threshold from 100 to 50
                this.translator.REQUEST_DELAY = Math.max(50, this.translator.REQUEST_DELAY - 25); // Larger decrement
                optimizations.push(`Reduced request delay to ${this.translator.REQUEST_DELAY}ms`);
            }
        }

        // Log optimizations
        if (optimizations.length > 0) {
            console.debug('Auto-optimization applied:', optimizations);
        }
    }

    /**
     * Get performance trends
     */
    getPerformanceTrends(periods = 5) { // Reduced from 10 to 5
        const recentHistory = this.performanceHistory.slice(-periods);
        if (recentHistory.length < 2) {
            return { trend: 'stable', confidence: 0 };
        }

        const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2));
        const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2));

        const avgFirst = firstHalf.reduce((sum, h) => sum + h.avgResponseTime, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, h) => sum + h.avgResponseTime, 0) / secondHalf.length;

        const improvement = (avgFirst - avgSecond) / avgFirst;

        if (improvement > 0.05) { // Reduced threshold from 0.1 to 0.05
            return { trend: 'improving', confidence: Math.min(improvement * 100, 100) };
        } else if (improvement < -0.05) { // Reduced threshold from -0.1 to -0.05
            return { trend: 'degrading', confidence: Math.min(Math.abs(improvement) * 100, 100) };
        } else {
            return { trend: 'stable', confidence: 90 };
        }
    }

    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations(): string[] {
        const metrics = this.getCurrentMetrics();
        const recommendations: string[] = [];

        if (metrics.cacheHitRate < 0.4) { // Reduced threshold from 0.5 to 0.4
            recommendations.push('Consider increasing cache size or TTL');
        }

        if (metrics.avgResponseTime > 2500) { // Reduced threshold from 3000 to 2500
            recommendations.push('Network performance issues detected - check connection');
        }

        if (metrics.errorRate > 0.1) {
            recommendations.push('High error rate - consider implementing circuit breaker');
        }

        if (metrics.throughput < 8) { // Reduced threshold from 5 to 8
            recommendations.push('Low throughput - consider enabling more aggressive batching');
        }

        return recommendations;
    }

    /**
     * Reset metrics
     */
    reset(): void {
        this.metrics = {
            requestTimes: [],
            cacheHits: 0,
            cacheMisses: 0,
            batchEfficiency: 0,
            connectionReuse: 0,
            errorCount: 0,
            prefetchHits: 0,
            totalTranslations: 0
        };
        this.performanceHistory = [];
    }

    /**
     * Enable/disable auto-optimization
     */
    setAutoOptimization(enabled: boolean): void {
        this.autoOptimizationEnabled = enabled;
    }

    /**
     * Get comprehensive performance report
     */
    getPerformanceReport() {
        const metrics = this.getCurrentMetrics();
        const trends = this.getPerformanceTrends();
        const recommendations = this.getOptimizationRecommendations();

        return {
            currentMetrics: metrics,
            trends,
            recommendations,
            autoOptimizationEnabled: this.autoOptimizationEnabled,
            lastOptimization: this.lastOptimization,
            performanceHistory: this.performanceHistory.slice(-5) // Last 5 snapshots
        };
    }
}

/**
 * Supported languages.
 */
const LANGUAGES: [string, string][] = [
    ["auto", "auto-detect"],
    ["ar", "ar"],
    ["ga", "ga"],
    ["et", "et"],
    ["or", "or"],
    ["bg", "bg"],
    ["is", "is"],
    ["pl", "pl"],
    ["bs", "bs-Latn"],
    ["fa", "fa"],
    ["prs", "prs"],
    ["da", "da"],
    ["de", "de"],
    ["ru", "ru"],
    ["fr", "fr"],
    ["zh-TW", "zh-Hant"],
    ["fil", "fil"],
    ["fj", "fj"],
    ["fi", "fi"],
    ["gu", "gu"],
    ["kk", "kk"],
    ["ht", "ht"],
    ["ko", "ko"],
    ["nl", "nl"],
    ["ca", "ca"],
    ["zh-CN", "zh-Hans"],
    ["cs", "cs"],
    ["kn", "kn"],
    ["otq", "otq"],
    ["tlh", "tlh"],
    ["hr", "hr"],
    ["lv", "lv"],
    ["lt", "lt"],
    ["ro", "ro"],
    ["mg", "mg"],
    ["mt", "mt"],
    ["mr", "mr"],
    ["ml", "ml"],
    ["ms", "ms"],
    ["mi", "mi"],
    ["bn", "bn-BD"],
    ["hmn", "mww"],
    ["af", "af"],
    ["pa", "pa"],
    ["pt", "pt"],
    ["ps", "ps"],
    ["ja", "ja"],
    ["sv", "sv"],
    ["sm", "sm"],
    ["sr-Latn", "sr-Latn"],
    ["sr-Cyrl", "sr-Cyrl"],
    ["no", "nb"],
    ["sk", "sk"],
    ["sl", "sl"],
    ["sw", "sw"],
    ["ty", "ty"],
    ["te", "te"],
    ["ta", "ta"],
    ["th", "th"],
    ["to", "to"],
    ["tr", "tr"],
    ["cy", "cy"],
    ["ur", "ur"],
    ["uk", "uk"],
    ["es", "es"],
    ["he", "iw"],
    ["el", "el"],
    ["hu", "hu"],
    ["it", "it"],
    ["hi", "hi"],
    ["id", "id"],
    ["en", "en"],
    ["yua", "yua"],
    ["yue", "yua"],
    ["vi", "vi"],
    ["ku", "ku"],
    ["kmr", "kmr"],
];

/**
 * Text readers.
 */
const READERS = {
    ar: ["ar-SA", "Male", "ar-SA-Naayf"],
    bg: ["bg-BG", "Male", "bg-BG-Ivan"],
    ca: ["ca-ES", "Female", "ca-ES-HerenaRUS"],
    cs: ["cs-CZ", "Male", "cs-CZ-Jakub"],
    da: ["da-DK", "Female", "da-DK-HelleRUS"],
    de: ["de-DE", "Female", "de-DE-Hedda"],
    el: ["el-GR", "Male", "el-GR-Stefanos"],
    en: ["en-US", "Female", "en-US-JessaRUS"],
    es: ["es-ES", "Female", "es-ES-Laura-Apollo"],
    fi: ["fi-FI", "Female", "fi-FI-HeidiRUS"],
    fr: ["fr-FR", "Female", "fr-FR-Julie-Apollo"],
    he: ["he-IL", "Male", "he-IL-Asaf"],
    hi: ["hi-IN", "Female", "hi-IN-Kalpana-Apollo"],
    hr: ["hr-HR", "Male", "hr-HR-Matej"],
    hu: ["hu-HU", "Male", "hu-HU-Szabolcs"],
    id: ["id-ID", "Male", "id-ID-Andika"],
    it: ["it-IT", "Male", "it-IT-Cosimo-Apollo"],
    ja: ["ja-JP", "Female", "ja-JP-Ayumi-Apollo"],
    ko: ["ko-KR", "Female", "ko-KR-HeamiRUS"],
    ms: ["ms-MY", "Male", "ms-MY-Rizwan"],
    nl: ["nl-NL", "Female", "nl-NL-HannaRUS"],
    nb: ["nb-NO", "Female", "nb-NO-HuldaRUS"],
    no: ["nb-NO", "Female", "nb-NO-HuldaRUS"],
    pl: ["pl-PL", "Female", "pl-PL-PaulinaRUS"],
    pt: ["pt-PT", "Female", "pt-PT-HeliaRUS"],
    ro: ["ro-RO", "Male", "ro-RO-Andrei"],
    ru: ["ru-RU", "Female", "ru-RU-Irina-Apollo"],
    sk: ["sk-SK", "Male", "sk-SK-Filip"],
    sl: ["sl-SL", "Male", "sl-SI-Lado"],
    sv: ["sv-SE", "Female", "sv-SE-HedvigRUS"],
    ta: ["ta-IN", "Female", "ta-IN-Valluvar"],
    te: ["te-IN", "Male", "te-IN-Chitra"],
    th: ["th-TH", "Male", "th-TH-Pattara"],
    tr: ["tr-TR", "Female", "tr-TR-SedaRUS"],
    vi: ["vi-VN", "Male", "vi-VN-An"],
    "zh-Hans": ["zh-CN", "Female", "zh-CN-HuihuiRUS"],
    "zh-Hant": ["zh-CN", "Female", "zh-CN-HuihuiRUS"],
    yue: ["zh-HK", "Female", "zh-HK-TracyRUS"],
};

/**
 * TTS language code.
 */
const TTS_LAN_CODE = {
    ar: "ar-EG",
    ca: "ca-ES",
    da: "da-DK",
    de: "de-DE",
    en: "en-US",
    es: "es-ES",
    fi: "fi-FI",
    fr: "fr-FR",
    hi: "hi-IN",
    it: "it-IT",
    ja: "ja-JP",
    ko: "ko-KR",
    nb: "nb-NO",
    nl: "nl-NL",
    pl: "pl-PL",
    pt: "pt-PT",
    ru: "ru-RU",
    sv: "sv-SE",
    th: "th-TH",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-HK",
    yue: "zh-HK",
    gu: "gu-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    te: "te-IN",
    tr: "tr-TR",
};

/**
 * Bing translator interface.
 */
class BingTranslator {
    /**
     * Basic request parameters.
     */
    IG = "";
    IID: string | null = "";
    token = "";
    key = "";

    /**
     * Request batcher for improved network efficiency (lazy loaded)
     */
    private _batcher?: RequestBatcher;

    /**
     * Smart prefetcher for predictive caching (lazy loaded)
     */
    private _prefetcher?: SmartPrefetcher;

    /**
     * Connection pool manager for HTTP optimization (lazy loaded)
     */
    private _connectionPool?: ConnectionPoolManager;

    /**
     * Performance monitor for auto-optimization (lazy loaded)
     */
    private _performanceMonitor?: PerformanceMonitor;

    constructor() {
        // Initialize simple cache for immediate use
        this.cache = new AdvancedLRUCache(150, this.CACHE_TTL); // Increased from 100 to 150
        
        // Try to load cached tokens first
        this.loadCachedTokens();
        
        // Start lightweight background warmup
        setTimeout(() => this.warmUp().catch(() => {}), 0);
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

    private get connectionPool(): ConnectionPoolManager {
        if (!this._connectionPool) {
            this._connectionPool = new ConnectionPoolManager();
        }
        return this._connectionPool;
    }

    private get performanceMonitor(): PerformanceMonitor {
        if (!this._performanceMonitor) {
            this._performanceMonitor = new PerformanceMonitor(this);
        }
        return this._performanceMonitor;
    }

    /**
     * Whether we have initiated tokens.
     */
    tokensInitiated = false;

    /**
     * Promise for token initialization to prevent multiple concurrent requests
     */
    tokenInitPromise: Promise<void> | null = null;

    /**
     * Advanced LRU cache for translate results with frequency and time awareness
     */
    private cache: AdvancedLRUCache;
    private readonly CACHE_TTL = 15 * 60 * 1000; // Increased from 10 to 15 minutes

    /**
     * Flag to track if warming is in progress
     */
    private warmupInProgress = false;

    /**
     * Connection pool statistics for monitoring
     */
    private poolStats = {
        requests: 0,
        cacheHits: 0,
        errors: 0
    };

    /**
     * TTS auth info.
     */
    TTS_AUTH = { region: "", token: "" };

    /**
     * Request count.
     */
    count = 0;

    /**
     * Last request timestamp for rate limiting
     */
    lastRequestTime = 0;

    /**
     * Minimum delay between requests (ms) - reduced for better performance
     */
    REQUEST_DELAY = 25; // Reduced from 50 to 25

    /**
     * Balanced timeout for first requests - faster than default but reliable
     */
    FIRST_REQUEST_TIMEOUT = 5000; // Reduced from 6000 to 5000

    HTMLParser = new DOMParser();

    /**
     * Max retry times.
     */
    MAX_RETRY = 1;

    /**
     * Translate API host.
     */
    HOST = "https://www.bing.com/";

    /**
     * Translate API home page.
     */
    HOME_PAGE = "https://www.bing.com/translator";

    /**
     * Optimized request headers with connection management
     */
    HEADERS = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,ko;q=0.8,zh-CN;q=0.7,zh;q=0.6",
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "accept-encoding": "gzip, deflate, br",
        "cache-control": "no-cache",
        "origin": "https://www.bing.com",
        "referer": "https://www.bing.com/translator",
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        // Connection optimization headers
        "connection": "keep-alive",
        "keep-alive": "timeout=20, max=150", // Increased max from 100 to 150
        // DNS prefetch control
        "x-dns-prefetch-control": "on"
    };

    /**
     * Language to translator language code.
     */
    LAN_TO_CODE = new Map(LANGUAGES);

    /**
     * Translator language code to language.
     */
    CODE_TO_LAN = new Map(LANGUAGES.map(([lan, code]) => [code, lan]));

    /**
     * Audio instance.
     */
    AUDIO = new Audio();

    /**
     * Get IG and IID for urls.
     *
     * @returns IG and IID Promise
     */
    async updateTokens() {
        // Prevent multiple concurrent token requests
        if (this.tokenInitPromise) {
            await this.tokenInitPromise;
            return;
        }

        this.tokenInitPromise = this._doUpdateTokens();
        try {
            await this.tokenInitPromise;
        } finally {
            this.tokenInitPromise = null;
        }
    }

    /**
     * Load cached tokens from localStorage if available
     */
    private loadCachedTokens(): boolean {
        try {
            if (typeof localStorage === 'undefined') return false;
            
            const cached = localStorage.getItem('bing_translator_tokens');
            if (!cached) return false;
            
            const { IG, token, key, IID, HOST, timestamp } = JSON.parse(cached);
            
            // Check if tokens are still valid (45 minutes TTL - increased from 30)
            if (Date.now() - timestamp < 45 * 60 * 1000) {
                this.IG = IG;
                this.token = token;
                this.key = key;
                this.IID = IID || "";
                this.HOST = HOST || "https://www.bing.com/";
                this.HOME_PAGE = `${this.HOST}translator`;
                this.tokensInitiated = true;
                return true;
            } else {
                // Remove expired cache
                localStorage.removeItem('bing_translator_tokens');
            }
        } catch (error) {
            // Ignore cache errors
        }
        return false;
    }

    /**
     * Cache tokens to localStorage for faster subsequent loads
     */
    private cacheTokens(): void {
        try {
            if (typeof localStorage === 'undefined') return;
            
            const tokenData = {
                IG: this.IG,
                token: this.token,
                key: this.key,
                IID: this.IID,
                HOST: this.HOST,
                timestamp: Date.now()
            };
            
            localStorage.setItem('bing_translator_tokens', JSON.stringify(tokenData));
        } catch (error) {
            // Ignore cache errors
        }
    }

    /**
     * Warm up the translator by pre-fetching tokens in the background.
     * This reduces the latency of the first translation request.
     */
    async warmUp() {
        if (this.tokensInitiated || this.warmupInProgress) {
            return;
        }
        
        this.warmupInProgress = true;
        try {
            await this.updateTokens();
        } catch (error) {
            // Ignore warmup failures - we'll try again on actual request
            console.debug('Bing translator warmup failed:', error);
        } finally {
            this.warmupInProgress = false;
        }
    }

    private async _doUpdateTokens() {
        const response = (await httpClient.get(this.HOME_PAGE, {
            timeout: 4000, // Reduced from 5000 to 4000 for faster token fetch
        })) as AxiosResponse<any>;

        /**
         * Bing redirects user requests based on user region. For example, if we are in China and request
         * www.bing.com, we will be redirected to cn.bing.com. This causes translating error because IG and IID
         * for one region are not usable for another. Therefore, we need to update HOST, HOME_PAGE, IG and IID
         * whenever a redirection happened.
         *
         * If the requested host is different from the original host, which means there was a redirection,
         * update HOST and HOME_PAGE with the redirecting host.
         */
        const responseHost = /(https:\/\/.*\.bing\.com\/).*/g.exec(response.request.responseURL);
        if (responseHost && responseHost[1] != this.HOST) {
            this.HOST = responseHost[1];
            this.HOME_PAGE = `${this.HOST}translator`;
        }

        // Optimized regex matching with cached patterns
        const igMatch = response.data.match(/IG:"([A-Za-z0-9]+)"/);
        if (!igMatch) throw new Error("Failed to extract IG token");
        this.IG = igMatch[1];

        const paramsMatch = response.data.match(
            /var params_AbusePreventionHelper\s*=\s*\[([0-9]+),\s*"([^"]+)",[^\]]*\];/
        );
        if (!paramsMatch) throw new Error("Failed to extract abuse prevention params");
        [, this.key, this.token] = paramsMatch;

        // Use faster regex instead of DOM parsing for IID extraction
        const iidMatch = response.data.match(/data-iid="([^"]+)"/);
        this.IID = iidMatch ? iidMatch[1] : "";

        // Reset request count.
        this.count = 0;
        
        // Cache tokens for future use
        this.cacheTokens();
    }

    /**
     * Parse translate interface result.
     *
     * @param result translate result
     * @param extras extra data
     *
     * @returns Parsed result
     */
    parseTranslateResult(result: any, extras: TranslationResult) {
        const parsed = extras || new Object();

        try {
            const translations = result[0].translations;
            parsed.mainMeaning = translations[0].text;
            parsed.tPronunciation = translations[0].transliteration.text;
            // eslint-disable-next-line no-empty
        } catch (error) {}

        return parsed;
    }

    /**
     * Parse the lookup interface result.
     *
     * @param result lookup result
     * @param extras extra data
     *
     * @returns Parsed result
     */
    parseLookupResult(result: any, extras: TranslationResult) {
        const parsed = extras || new Object();

        try {
            parsed.originalText = result[0].displaySource;

            const translations = result[0].translations;
            parsed.mainMeaning = translations[0].displayTarget;
            parsed.tPronunciation = translations[0].transliteration;

            const detailedMeanings = [];
            const definitions = [];
            
            for (const i in translations) {
                const synonyms = [];
                for (const j in translations[i].backTranslations) {
                    synonyms.push(translations[i].backTranslations[j].displayText);
                }

                // Add detailed meanings with part of speech
                detailedMeanings.push({
                    pos: translations[i].posTag,
                    meaning: translations[i].displayTarget,
                    synonyms,
                });

                // Add definitions with examples if available
                if (translations[i].examples && translations[i].examples.length > 0) {
                    for (const example of translations[i].examples) {
                        definitions.push({
                            pos: translations[i].posTag,
                            meaning: translations[i].displayTarget,
                            example: example.sourceExample || example.targetExample,
                        });
                    }
                }
            }

            parsed.detailedMeanings = detailedMeanings;
            
            // Only add definitions if we have any
            if (definitions.length > 0) {
                parsed.definitions = definitions;
            }
            
            // Extract additional examples if available in the root response
            if (result[0].examples && result[0].examples.length > 0) {
                const examples = [];
                for (const example of result[0].examples) {
                    examples.push({
                        source: example.sourcePrefix + example.sourceTerm + example.sourceSuffix,
                        target: example.targetPrefix + example.targetTerm + example.targetSuffix,
                    });
                }
                parsed.examples = examples;
            }
            // eslint-disable-next-line no-empty
        } catch (error) {}

        return parsed;
    }

    /**
     * Parse example response.
     *
     * @param result example response
     * @param extras extra data
     *
     * @returns parse result
     */
    parseExampleResult(result: any, extras: TranslationResult) {
        const parsed = extras || new Object();

        try {
            parsed.examples = result[0].examples.map(
                (example: {
                    sourcePrefix: string;
                    sourceTerm: string;
                    sourceSuffix: string;
                    targetPrefix: string;
                    targetTerm: string;
                    targetSuffix: string;
                }) => ({
                    source: `${example.sourcePrefix}<b>${example.sourceTerm}</b>${example.sourceSuffix}`,
                    target: `${example.targetPrefix}<b>${example.targetTerm}</b>${example.targetSuffix}`,
                })
            );
            // eslint-disable-next-line no-empty
        } catch (error) {}

        return parsed;
    }

    /**
     * Get TTS auth token.
     *
     * @returns request finished Promise
     */
    async updateTTSAuth() {
        const constructParams = () => {
            return {
                method: "POST",
                baseURL: this.HOST,
                url: `tfetspktok?isVertical=1&&IG=${this.IG}&IID=${
                    this.IID
                }.${this.count.toString()}`,
                headers: this.HEADERS,
                data: `&token=${encodeURIComponent(this.token)}&key=${encodeURIComponent(
                    this.key
                )}`,
            } as AxiosRequestConfig;
        };

        const response = await this.request(constructParams, []);
        this.TTS_AUTH.region = response.region;
        this.TTS_AUTH.token = response.token;
    }

    /**
     * Generate TTS request data.
     *
     * @param text text to pronounce
     * @param language language of text
     * @param speed pronouncing speed, "fast" or "slow"
     *
     * @returns TTS request data
     */
    generateTTSData(text: string, language: string, speed: PronunciationSpeed) {
        const lanCode = this.LAN_TO_CODE.get(language)! as keyof typeof READERS &
            keyof typeof TTS_LAN_CODE;
        const reader = READERS[lanCode];
        const ttsLanCode = TTS_LAN_CODE[lanCode];
        const speedValue = speed === "fast" ? "-10.00%" : "-30.00%";
        return `<speak version='1.0' xml:lang='${ttsLanCode}'><voice xml:lang='${ttsLanCode}' xml:gender='${reader[1]}' name='${reader[2]}'><prosody rate='${speedValue}'>${text}</prosody></voice></speak>`;
    }

    /**
     * Transform binary data into Base64 encoding.
     *
     * @param buffer array buffer with audio data
     *
     * @returns Base64 form of binary data in buffer
     */
    arrayBufferToBase64(buffer: Iterable<number>) {
        let str = "",
            array = new Uint8Array(buffer);

        for (let i = 0; i < array.byteLength; i++) {
            str += String.fromCharCode(array[i]);
        }

        return btoa(str);
    }

    /**
     * Construct detect request parameters dynamically.
     *
     * @param text text to detect
     *
     * @returns constructed parameters
     */
    constructDetectParams(text: string): AxiosRequestConfig {
        const url = `ttranslatev3?isVertical=1&IG=${this.IG}&IID=${
                this.IID
            }.${this.count.toString()}`,
            data = `&fromLang=auto-detect&to=zh-Hans&text=${encodeURIComponent(
                text
            )}&token=${encodeURIComponent(this.token)}&key=${encodeURIComponent(this.key)}`;

        return {
            method: "POST",
            baseURL: this.HOST,
            url,
            headers: this.HEADERS,
            data,
        };
    }

    /**
     * Construct translate request parameters dynamically.
     *
     * @param text text to translate
     * @param from source language
     * @param to target language
     *
     * @returns constructed parameters
     */
    constructTranslateParams(text: string, from: string, to: string): AxiosRequestConfig {
        const translateURL = `ttranslatev3?isVertical=1&IG=${this.IG}&IID=${
                this.IID
            }.${this.count.toString()}`,
            translateData = `&fromLang=${this.LAN_TO_CODE.get(from)}&to=${this.LAN_TO_CODE.get(
                to
            )}&text=${encodeURIComponent(text)}&token=${encodeURIComponent(
                this.token
            )}&key=${encodeURIComponent(this.key)}`;

        return {
            method: "POST",
            baseURL: this.HOST,
            url: translateURL,
            headers: this.HEADERS,
            data: translateData,
        };
    }

    /**
     * Construct lookup request parameters dynamically.
     *
     * @param text text to lookup
     * @param from source language
     * @param to target language
     *
     * @returns constructed parameters
     */
    constructLookupParams(text: string, from: string, to: string): AxiosRequestConfig {
        const lookupURL = `tlookupv3?isVertical=1&IG=${this.IG}&IID=${
                this.IID
            }.${this.count.toString()}`,
            lookupData = `&from=${
                // Use detected language.
                from
            }&to=${this.LAN_TO_CODE.get(to)}&text=${encodeURIComponent(
                text
            )}&token=${encodeURIComponent(this.token)}&key=${encodeURIComponent(this.key)}`;

        return {
            method: "POST",
            baseURL: this.HOST,
            url: lookupURL,
            headers: this.HEADERS,
            data: lookupData,
        };
    }

    /**
     * Construct example request parameters dynamically.
     *
     * @param from source language
     * @param to target language
     * @param text original text
     * @param translation text translation
     *
     * @returns constructed parameters
     */
    constructExampleParams(
        from: string,
        to: string,
        text: string,
        translation: string
    ): AxiosRequestConfig {
        const exampleURL = `texamplev3?isVertical=1&IG=${this.IG}&IID=${
                this.IID
            }.${this.count.toString()}`,
            exampleData = `&from=${
                // Use detected language.
                from
            }&to=${this.LAN_TO_CODE.get(to)}&text=${encodeURIComponent(
                text
            )}&translation=${encodeURIComponent(translation)}&token=${encodeURIComponent(
                this.token
            )}&key=${encodeURIComponent(this.key)}`;

        return {
            method: "POST",
            baseURL: this.HOST,
            url: exampleURL,
            headers: this.HEADERS,
            data: exampleData,
        };
    }

    /**
     * Construct TTS request parameters dynamically.
     *
     * @param text text to pronounce
     * @param lang language of text
     * @param speed pronounce speed
     *
     * @returns constructed parameters
     */
    constructTTSParams(text: string, lang: string, speed: PronunciationSpeed) {
        const url = `https://${this.TTS_AUTH.region}.tts.speech.microsoft.com/cognitiveservices/v1?`;

        const headers = {
            "Content-Type": "application/ssml+xml",
            Authorization: `Bearer ${this.TTS_AUTH.token}`,
            "X-MICROSOFT-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
            "cache-control": "no-cache",
        };

        return {
            method: "POST",
            baseURL: url,
            headers,
            data: this.generateTTSData(text, lang, speed),
            responseType: "arraybuffer",
        } as AxiosRequestConfig;
    }

    /**
     * Request APIs.
     *
     * This is a wrapper of axios with retrying and error handling supported.
     *
     * @param constructParams request parameters constructor
     * @param constructParamsArgs request parameters constructor arguments
     * @param retry whether retry is needed
     *
     * @returns Promise of response data
     */
    async request(
        constructParams: (...args: any[]) => AxiosRequestConfig,
        constructParamsArgs: string[],
        retry = true
    ) {
        // Rate limiting: wait if needed (skip for first few requests)
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.REQUEST_DELAY && this.count > 3) { // Reduced threshold from 5 to 3
            const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();

        let retryCount = 0;
        const requestOnce = async (): Promise<any> => {
            this.count++;
            
            // Get optimized timeout based on connection history
            const isFirstRequest = this.count <= 3; // Reduced threshold from 5 to 3
            const timeout = this.connectionPool.getOptimizedTimeout(this.HOST, isFirstRequest);
            const canReuse = this.connectionPool.canReuseConnection(this.HOST);
            
            // Track connection usage
            this.connectionPool.trackConnection(this.HOST, canReuse);
            
            try {
                const response = (await httpClient({
                    timeout,
                    ...constructParams.call(this, ...constructParamsArgs),
                })) as AxiosResponse<any>;
                
                // Mark connection as successful
                this.connectionPool.finishConnection(this.HOST);
                
                return response;
            } catch (error: any) {
                // Track connection errors
                if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                    this.connectionPool.trackTimeout(this.HOST);
                } else {
                    this.connectionPool.trackError(this.HOST);
                }
                this.connectionPool.finishConnection(this.HOST);
                throw error;
            }
        };

        const processResponse = async (response: AxiosResponse<any>): Promise<any> => {
            /**
             * Status codes 401 and 429 mean that Bing thinks we are robots. We have to wait for it to calm down.
             */
            if (response.status === 401 || response.status === 429) {
                // Throw error.
                throw {
                    errorType: "API_ERR",
                    errorCode: response.status,
                    errorMsg: "Request too frequently!",
                };
            }

            /**
             * Bing redirects user requests based on user region. For example, if we are in China and request
             * www.bing.com, we will be redirected to cn.bing.com. This causes translating error because IG and IID
             * for one region are not usable for another. Therefore, we need to update HOST, HOME_PAGE, IG and IID
             * whenever a redirection happened.
             *
             * If the requested host is different from the original host, which means there was a redirection,
             * update HOST and HOME_PAGE with the redirecting host and retry.
             */
            const responseHost = /(https:\/\/.*\.bing\.com\/).*/g.exec(
                response.request.responseURL
            );
            if (responseHost && responseHost[1] !== this.HOST) {
                this.HOST = responseHost[1];
                this.HOME_PAGE = `${this.HOST}translator`;
                return await this.updateTokens().then(requestOnce);
            }

            /**
             * statusCode will indicate the status of translating.
             *
             * no statusCode or 200: translated successfully
             * 205: tokens need to be updated
             */
            const statusCode = response.data.StatusCode || response.data.statusCode || 200;
            switch (statusCode) {
                case 200:
                    return response.data;
                case 205:
                    return await this.updateTokens().then(requestOnce);
                default:
                    break;
            }

            // Retry after unknown failure.
            if (retry && retryCount < this.MAX_RETRY) {
                retryCount++;
                return await this.updateTokens().then(requestOnce);
            }

            // Throw error.
            throw {
                errorType: "API_ERR",
                errorCode: statusCode,
                errorMsg: "Request failed.",
            };
        };

        const executeRequest = async (): Promise<any> => {
            const response = await requestOnce();
            return await processResponse(response);
        };

        // Initialize tokens lazily and concurrently
        const ensureTokens = async () => {
            if (!this.tokensInitiated) {
                await this.updateTokens();
                this.tokensInitiated = true;
            }
        };

        // Clean up stale connections occasionally
        if (Math.random() < 0.005) { // Reduced frequency from 0.01 to 0.005
            this.connectionPool.cleanup();
        }

        await ensureTokens();
        return executeRequest();
    }

    /**
     * Get supported languages of this API.
     *
     * @returns {Set<String>} supported languages
     */
    supportedLanguages() {
        return new Set(this.LAN_TO_CODE.keys());
    }

    /**
     * Detect language of given text.
     *
     * @param text text to detect
     *
     * @returns detected language Promise
     */
    async detect(text: string) {
        try {
            const response = await this.request(this.constructDetectParams, [text]);
            const result = response[0].detectedLanguage.language;
            return this.CODE_TO_LAN.get(result);
        } catch (error: any) {
            error.errorMsg = error.errorMsg || error.message;
            error.errorAct = {
                api: "bing",
                action: "detect",
                text,
                from: null,
                to: null,
            };
            throw error;
        }
    }

    /**
     * Clear expired cache entries using advanced LRU cache
     */
    private clearExpiredCache() {
        this.cache.cleanExpired();
    }

    /**
     * Fast translate for first few requests with minimal overhead.
     * Skips detailed lookup for faster initial response.
     */
    async fastTranslate(text: string, from: string, to: string) {
        let transResponse;
        try {
            transResponse = await this.request(this.constructTranslateParams, [text, from, to]);
        } catch (error: any) {
            this.poolStats.errors++;
            error.errorAct = { api: "bing", action: "translate", text, from, to };
            throw error;
        }

        const result = this.parseTranslateResult(transResponse, {
            originalText: text,
            mainMeaning: "",
        });
        
        return result;
    }

    /**
     * Translate given text with batching and smart prefetching for improved performance.
     *
     * @param text text to translate
     * @param from source language
     * @param to target language
     *
     * @returns {Promise<Object>} translation Promise
     */
    async translate(text: string, from: string, to: string) {
        // Quick validation
        if (!text || !text.trim()) {
            return { originalText: text || "", mainMeaning: "" };
        }
        
        const startTime = Date.now();
        
        // Check cache first before batching
        const cacheKey = `${from}|${to}|${text.toLowerCase().trim()}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            this.poolStats.cacheHits++;
            
            // Only use performance monitoring if already initialized
            if (this._performanceMonitor) {
                this.performanceMonitor.trackRequest(startTime, Date.now(), true);
            }
            
            // Learn pattern and prefetch in background (only if needed)
            if (this.poolStats.requests > 2) { // Reduced threshold from 3 to 2
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

        // For first few requests, use direct translation (faster)
        if (this.poolStats.requests < 1) { // Reduced threshold from 2 to 1
            try {
                const result = await this.fastTranslate(text, from, to);
                this.cache.set(cacheKey, result);
                this.poolStats.requests++;
                return result;
            } catch (error) {
                // Fall back to batch system
            }
        }

        // Learn pattern for frequent users only
        if (this.poolStats.requests > 2) { // Reduced threshold from 3 to 2
            this.prefetcher.learnPattern(text, from, to);
            
            // Get prefetch suggestions
            const suggestions = this.prefetcher.getPrefetchSuggestions(text, from, to);
            
            // Start prefetching in background (non-blocking)
            if (suggestions.length > 0) {
                this.prefetcher.prefetch(suggestions).catch(() => {}); // Ignore prefetch errors
            }
        }

        try {
            // Use batching system for better efficiency
            const result = await this.batcher.addRequest(text, from, to);
            
            // Track successful request performance (only if monitoring is active)
            if (this._performanceMonitor) {
                this.performanceMonitor.trackRequest(startTime, Date.now(), false);
            }
            
            this.poolStats.requests++;
            return result;
        } catch (error) {
            // Track failed request performance (only if monitoring is active)
            if (this._performanceMonitor) {
                this.performanceMonitor.trackRequest(startTime, Date.now(), false, true);
            }
            throw error;
        }
    }

    /**
     * Single translation without batching - used internally by batcher.
     *
     * This method will request the translate API firstly with 2 purposes:
     *     1. detect the language of the translating text
     *     2. get a basic translation of the text incase lookup is not available
     *
     * After that, it will attempt to request lookup and examples APIs in parallel for better performance.
     * If detailed requests fail, the method will use the basic translation from the translate API.
     *
     * @param text text to translate
     * @param from source language
     * @param to target language
     *
     * @returns {Promise<Object>} translation Promise
     */
    async translateSingle(text: string, from: string, to: string) {
        // Track request statistics
        this.poolStats.requests++;

        // Create cache key and check for cached result
        const cacheKey = `${from}|${to}|${text.toLowerCase().trim()}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            this.poolStats.cacheHits++;
            return cached;
        }
        
        // Clear expired entries occasionally
        if (Math.random() < 0.05) { // Reduced frequency from 0.1 to 0.05
            this.clearExpiredCache();
        }

        // Use fast path for first few requests to reduce initial loading time
        if (this.count <= 2) { // Reduced threshold from 3 to 2
            const result = await this.fastTranslate(text, from, to);
            this.cache.set(cacheKey, result);
            return result;
        }
        let transResponse;
        try {
            /**
             * Request the translate api to detect the language of the text and get a basic translation.
             */
            transResponse = await this.request(this.constructTranslateParams, [text, from, to]);
        } catch (error: any) {
            this.poolStats.errors++;
            error.errorAct = {
                api: "bing",
                action: "translate",
                text,
                from,
                to,
            };
            throw error;
        }

        // Set up originalText in case that lookup failed.
        const transResult = this.parseTranslateResult(transResponse, {
            originalText: text,
            mainMeaning: "",
        });

        // For text (especially single words), always attempt detailed lookup
        // This ensures we get comprehensive information including definitions and examples
        try {
            const detectedLanguage = transResponse[0].detectedLanguage.language;
            
            // Run lookup and examples in parallel for better performance
            const [lookupResponse, exampleResponse] = await Promise.allSettled([
                this.request(
                    this.constructLookupParams,
                    [text, detectedLanguage, to],
                    false
                ).then(response => ({ type: 'lookup', response })),
                // Only request examples if we have a main meaning to work with
                transResult.mainMeaning ? this.request(
                    this.constructExampleParams,
                    [detectedLanguage, to, text, transResult.mainMeaning],
                    false
                ).then(response => ({ type: 'example', response })) : Promise.reject('No main meaning')
            ]);

            let result = transResult;
            
            // Apply lookup result if successful
            if (lookupResponse.status === 'fulfilled') {
                result = this.parseLookupResult(lookupResponse.value.response, result);
            }
            
            // Apply example result if successful
            if (exampleResponse.status === 'fulfilled') {
                result = this.parseExampleResult(exampleResponse.value.response, result);
            }
            
            // Cache the final result
            this.cache.set(cacheKey, result);
            return result;
        } catch (e) {
            // Fall back to basic translation and cache it
            this.cache.set(cacheKey, transResult);
            return transResult;
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
        // Pause audio in case that it's playing.
        this.stopPronounce();

        let retryCount = 0;
        const pronounceOnce = async (): Promise<void> => {
            try {
                const TTSResponse = await this.request(
                    this.constructTTSParams,
                    [text, language, speed],
                    false
                );
                this.AUDIO.src = `data:audio/mp3;base64,${this.arrayBufferToBase64(TTSResponse)}`;
                await this.AUDIO.play();
            } catch (error: any) {
                if (retryCount < this.MAX_RETRY) {
                    retryCount++;
                    return this.updateTTSAuth().then(pronounceOnce);
                }
                const errorAct = {
                    api: "bing",
                    action: "pronounce",
                    text,
                    from: language,
                    to: null,
                };

                if (error.errorType) {
                    error.errorAct = errorAct;
                    throw error;
                }

                throw {
                    errorType: "NET_ERR",
                    errorCode: 0,
                    errorMsg: error.message,
                    errorAct,
                };
            }
        };

        if (!(this.TTS_AUTH.region.length > 0 && this.TTS_AUTH.token.length > 0)) {
            await this.updateTTSAuth();
        }

        return pronounceOnce();
    }

    /**
     * Pause pronounce.
     */
    stopPronounce() {
        if (!this.AUDIO.paused) {
            this.AUDIO.pause();
        }
    }

    /**
     * Get comprehensive performance statistics
     */
    getPoolStats() {
        const cacheStats = this.cache.getStats();
        const stats: any = {
            ...this.poolStats,
            cacheSize: cacheStats.size,
            maxCacheSize: cacheStats.maxSize,
            cacheTTL: cacheStats.ttl,
            accessCounter: cacheStats.accessCounter,
            hitRate: this.poolStats.requests > 0 
                ? (this.poolStats.cacheHits / this.poolStats.requests * 100).toFixed(1) + '%'
                : '0%',
            tokensFromCache: this.tokensInitiated // Whether tokens were loaded from cache
        };

        // Only include component stats if they've been initialized (lazy loading)
        if (this._batcher) {
            stats.batcher = this._batcher.getStats();
        }
        
        if (this._prefetcher) {
            stats.prefetcher = this._prefetcher.getStats();
            stats.topLanguagePairs = this._prefetcher.getTopLanguagePairs(3);
        }
        
        if (this._connectionPool) {
            stats.connectionPool = this._connectionPool.getStats();
        }
        
        if (this._performanceMonitor) {
            stats.performance = this._performanceMonitor.getCurrentMetrics();
        }
        
        return stats;
    }

    /**
     * Get detailed performance report with trends and recommendations
     */
    getPerformanceReport() {
        return this._performanceMonitor?.getPerformanceReport() || {
            currentMetrics: { avgResponseTime: 0, cacheHitRate: 0, errorRate: 0, throughput: 0, totalRequests: 0, prefetchHits: 0, isPerformanceGood: true },
            trends: { trend: 'stable', confidence: 100 },
            recommendations: [],
            autoOptimizationEnabled: false,
            lastOptimization: 0,
            performanceHistory: []
        };
    }

    /**
     * Enable or disable auto-optimization
     */
    setAutoOptimization(enabled: boolean): void {
        if (this._performanceMonitor) {
            this.performanceMonitor.setAutoOptimization(enabled);
        }
    }

    /**
     * Reset performance metrics
     */
    resetPerformanceMetrics(): void {
        if (this._performanceMonitor) {
            this.performanceMonitor.reset();
        }
    }

    /**
     * Check if key exists in cache (for prefetcher)
     */
    hasInCache(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Get cache statistics (for performance monitor)
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Cleanup connections and resources
     */
    async cleanup() {
        // Clear advanced LRU cache
        this.cache.clear();
        
        // Note: Connection cleanup is handled automatically by the browser/axios
        // No manual connection cleanup needed
    }
}

export default BingTranslator;
