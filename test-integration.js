/**
 * Integration Test Suite for Shadow AI v3
 * Tests critical autonomous features via JSON-RPC API
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3456/api';

// Color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testMethod(name, method, params = []) {
    try {
        log(`\n🧪 Testing: ${name}`, 'cyan');
        const response = await axios.post(API_BASE, {
            method,
            params
        }, {
            timeout: 10000
        });

        if (response.data.success !== false) {
            log(`✅ PASS: ${name}`, 'green');
            if (response.data.result && typeof response.data.result === 'object') {
                log(`   Result: ${JSON.stringify(response.data.result).substring(0, 100)}...`, 'blue');
            }
            return { success: true, data: response.data.result };
        } else {
            log(`❌ FAIL: ${name}`, 'red');
            log(`   Error: ${response.data.error}`, 'yellow');
            return { success: false, error: response.data.error };
        }
    } catch (error) {
        log(`❌ FAIL: ${name}`, 'red');
        log(`   Error: ${error.message}`, 'yellow');
        if (error.response?.data) {
            log(`   Response: ${JSON.stringify(error.response.data)}`, 'yellow');
        }
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('═══════════════════════════════════════════════════', 'magenta');
    log('     SHADOW AI v3 - INTENSIVE INTEGRATION TEST', 'magenta');
    log('═══════════════════════════════════════════════════', 'magenta');

    const results = [];

    // Test 1: Model Status  
    results.push(await testMethod(
        'Diagnostic: Model Status',
        'diagnostic:modelStatus'
    ));

    // Test 2: Safety - Mode Manager
    results.push(await testMethod(
        'Safety: Get Current Mode',
        'mode:getMode'
    ));

    // Test 3: Safety - Policies
    results.push(await testMethod(
        'Safety: Get All Policies',
        'safety:getAllPolicies'
    ));

    // Test 4: Safety - Violation Stats
    results.push(await testMethod(
        'Safety: Get Violation Stats',
        'safety:getViolationStats'
    ));

    // Test 5: Agent Queue Stats
    results.push(await testMethod(
        'Agent: Get Queue Stats',
        'agent:getQueueStats'
    ));

    // Test 6: Metrics Summary
    results.push(await testMethod(
        'Metrics: Get Summary',
        'metrics:getSummary'
    ));

    // Test 7: ALOps Health
    results.push(await testMethod(
        'ALOps: Get Health Status',
        'alops:getHealthStatus'
    ));

    // Test 8: ALOps Metrics
    results.push(await testMethod(
        'ALOps: Get Metrics',
        'alops:getMetrics'
    ));

    // Test 9: Chat Capability (simple test)
    results.push(await testMethod(
        'Chat: Simple Message',
        'chat:send',
        [[{ role: 'user', content: 'Say "test successful" only', timestamp: new Date() }]]
    ));

    // Summary
    log('\n═══════════════════════════════════════════════════', 'magenta');
    log('                   TEST SUMMARY', 'magenta');
    log('═══════════════════════════════════════════════════', 'magenta');

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log(`\nTotal Tests: ${results.length}`, 'blue');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, 'red');

    const successRate = ((passed / results.length) * 100).toFixed(1);
    log(`Success Rate: ${successRate}%`, successRate >= 70 ? 'green' : 'yellow');

    if (successRate < 70) {
        log('\n⚠️  SYSTEM STATUS: DEGRADED', 'yellow');
        process.exit(1);
    } else if (successRate < 100) {
        log('\n⚡ SYSTEM STATUS: PARTIAL OPERATION', 'yellow');
        process.exit(0);
    } else {
        log('\n✅ SYSTEM STATUS: FULLY OPERATIONAL', 'green');
        process.exit(0);
    }
}

// Run tests
runTests().catch(error => {
    log(`\n💥 CRITICAL FAILURE: ${error.message}`, 'red');
    process.exit(1);
});
