require('dotenv').config();
const assignmentService = require('./Services/assignment.service');
const pool = require('./Db_config/DB');

(async () => {
    try {
        console.log('Testing getAllAssignments...');
        const result = await assignmentService.getAllAssignments({});
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('CRASH:', err);
    } finally {
        process.exit();
    }
})();
