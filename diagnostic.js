// Quick diagnostic for API key issues
console.log('=== Shadow AI Diagnostic ===');
console.log('1. Checking window.shadowAPI:', typeof window.shadowAPI);
console.log('2. Available methods:', window.shadowAPI ? Object.keys(window.shadowAPI) : 'N/A');
console.log('3. updateApiKeys available:', window.shadowAPI?.updateApiKeys ? 'YES' : 'NO');

// Check localStorage
console.log('4. Stored API keys:');
console.log('   - OpenAI:', localStorage.getItem('api_key_openai') ? 'SET' : 'NOT SET');
console.log('   - Anthropic:', localStorage.getItem('api_key_anthropic') ? 'SET' : 'NOT SET');
console.log('   - Mistral:', localStorage.getItem('api_key_mistral') ? 'SET' : 'NOT SET');

// Test if we can call the API
if (window.shadowAPI?.listModels) {
    window.shadowAPI.listModels()
        .then(models => {
            console.log('5. Available models:', models.length);
            models.forEach(m => console.log(`   - ${m.name} (${m.provider})`));
        })
        .catch(err => console.error('Error listing models:', err));
} else {
    console.error('5. Cannot list models - shadowAPI not available');
}

console.log('=== End Diagnostic ===');
