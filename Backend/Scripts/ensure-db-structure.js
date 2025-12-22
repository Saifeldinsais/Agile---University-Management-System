const { execSync } = require('child_process');
const path = require('path');

const scripts = [
    'setup_database.js',
    'setup-course-tables.js',
    'setup-classroom-tables.js',
    'setup-enrollment-tables.js',
    'setup-staff-tables.js',
    'setup-advisor-tables.js'
];

console.log('🚀 Starting Database Structure Check/Creation...\n');

for (const script of scripts) {
    try {
        console.log(`\n--------------------------------------------------`);
        console.log(`▶️  Running ${script}...`);
        console.log(`--------------------------------------------------`);
        
        const scriptPath = path.join(__dirname, script);
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
        
        console.log(`✅ ${script} completed.`);
    } catch (error) {
        console.error(`❌ Error running ${script}:`, error.message);
        // We continue even if one fails, as tables might already exist
    }
}

console.log('\n✨ Database structure check complete!');
