
import fs from 'fs';
import https from 'https';
import path from 'path';

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('No .env.local found');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    // Simple parse for GEMINI_API_KEY
    const match = envContent.match(/GEMINI_API_KEY=["']?([^"'\s]+)["']?/);

    if (!match) {
        console.error('GEMINI_API_KEY not found in .env.local');
        // Try API_KEY
        const match2 = envContent.match(/API_KEY=["']?([^"'\s]+)["']?/);
        if (!match2) process.exit(1);
        var key = match2[1];
    } else {
        var key = match[1];
    }

    console.log('Using API Key:', key.substring(0, 8) + '...');

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.error('API Error:', json.error);
                } else {
                    console.log('Available Models:');
                    json.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
                }
            } catch (e) {
                console.error('Parse error:', e);
                console.log('Raw:', data);
            }
        });
    }).on('error', err => {
        console.error('Request error:', err);
    });

} catch (err) {
    console.error('Script error:', err);
}
