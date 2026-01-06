/**
 * Quick memory test - run from compiled JS
 */

const { getMemoryEngine } = require('./ai/memory/MemoryEngine');
const path = require('path');

async function quickTest() {
    console.log('\n🧠 Shadow Memory Engine - Quick Test\n');

    try {
        // Initialize
        console.log('1. Initializing...');
        const memory = getMemoryEngine();
        await memory.initialize();
        console.log('   ✓ Initialized\n');

        // Store a memory
        console.log('2. Storing test memory...');
        const id = await memory.remember({
            type: 'code',
            content: 'function hello() { return "world"; }',
            metadata: { file: 'test.ts', language: 'typescript' }
        });
        console.log(`   ✓ Stored with ID: ${id.substring(0, 8)}...\n`);

        // Recall
        console.log('3. Recalling memories...');
        const results = await memory.recall('hello function', 5);
        console.log(`   ✓ Found ${results.length} memories\n`);

        // Stats
        console.log('4. Getting stats...');
        const stats = await memory.getStats();
        console.log(`   ✓ Total memories: ${stats.totalMemories}\n`);

        console.log('✅ All basic tests passed!\n');
        console.log('Memory system is operational! 🎉\n');

        return true;
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

quickTest().then(success => {
    process.exit(success ? 0 : 1);
});
