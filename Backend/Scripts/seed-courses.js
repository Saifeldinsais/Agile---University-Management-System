require('dotenv').config();
const CourseService = require('../Services/course.service');
const pool = require('../Db_config/DB');

const courses = [
    { code: 'ASU311', title: 'Human Resourse Management', credits: 3, department: 'ASU' },
    { code: 'ASUx12', title: 'Selected topic In Contemporary Issues', credits: 3, department: 'ASU' },
    { code: 'CSE233', title: 'Agile Software', credits: 3, department: 'CSE' },
    { code: 'CSE322', title: 'Introduction to Emebedded', credits: 3, department: 'CSE' },
    { code: 'CSE355', title: 'Parallel and Distributed Algorithms', credits: 3, department: 'CSE' },
    { code: 'CSE361', title: 'Computer Networking', credits: 3, department: 'CSE' },
    { code: 'EPM119', title: 'Enginnering Economy', credits: 3, department: 'EPM' }
];

async function seedCourses() {
    console.log('🌱 Seeding Courses...\n');
    
    for (const course of courses) {
        try {
            console.log(`Processing ${course.code}: ${course.title}...`);
            const result = await CourseService.createCourse(course);
            
            if (result.success) {
                console.log(`   ✅ Created successfully (ID: ${result.id})`);
            } else {
                console.log(`   ℹ️  ${result.message}`);
            }
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n✨ Course seeding complete!');
    process.exit(0);
}

seedCourses();
