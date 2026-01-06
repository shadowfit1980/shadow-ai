/**
 * Run automated testing demo
 */

// Import and run the test demo
import { main as testAutomated } from './tests/testAutomatedTesting';

console.log('Starting Automated Testing Framework Demo...\n');

testAutomated()
    .then(() => {
        console.log('\n✅ Demo completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Demo failed:', error);
        process.exit(1);
    });
