// Simple test to verify Undici connection pooling is working
const { BingTranslator } = require('./dist/translators.umd.js');

async function testUndici() {
    console.log('Testing Undici connection pooling implementation...\n');
    
    const translator = new BingTranslator();
    
    // Test warmup
    console.log('⏳ Warming up translator...');
    await translator.warmUp();
    console.log('✅ Warmup completed\n');
    
    // Test multiple quick translations to see connection reuse
    console.log('🚀 Testing connection reuse with multiple requests...');
    const start = Date.now();
    
    try {
        // Multiple parallel requests to test connection pooling
        const promises = [
            translator.translate('Hello', 'en', 'ko'),
            translator.translate('World', 'en', 'ko'),
            translator.translate('Test', 'en', 'ko')
        ];
        
        const results = await Promise.all(promises);
        const end = Date.now();
        
        console.log('✅ All translations completed');
        console.log(`⚡ Total time: ${end - start}ms`);
        console.log(`📊 Results:`, results.map(r => r.mainMeaning));
        
        // Show pool statistics
        const stats = translator.getPoolStats();
        console.log('\n📈 Connection Pool Statistics:');
        console.log(`   Requests: ${stats.requests}`);
        console.log(`   Cache hits: ${stats.cacheHits}`);
        console.log(`   Hit rate: ${stats.hitRate}`);
        console.log(`   Cache size: ${stats.cacheSize}`);
        console.log(`   Errors: ${stats.errors}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await translator.cleanup();
        console.log('\n🧹 Cleanup completed');
    }
}

testUndici().catch(console.error);