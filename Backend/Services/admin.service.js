const ClassroomValue = require("../EAV models/classroom_value");
const ClassroomAttribute = require("../EAV models/classroom_attribute");
const ClassroomEntity = require("../EAV models/classroom_entity");

let attributesInitialized = false;

const initializeAttributes = async () => {
  if (attributesInitialized) return; 
    try {
        const roomName = await ClassroomAttribute.getAttributeByName("roomName");
        if (!roomName) {
            await ClassroomAttribute.createClassroomAttribute("roomName", "string");
            console.log("Created roomName attribute");
        }
        const capacity = await ClassroomAttribute.getAttributeByName("capacity");
        if (!capacity) {
            await ClassroomAttribute.createClassroomAttribute("capacity", "decimal");
            console.log("Created capacity attribute");
        }   
        const type = await ClassroomAttribute.getAttributeByName("type");
        if (!type) {
            await ClassroomAttribute.createClassroomAttribute("type", "string");
            console.log("Created type attribute");
        }
        const bookedSchedule = await ClassroomAttribute.getAttributeByName("bookedSchedule");
        if (!bookedSchedule) {
            await ClassroomAttribute.createClassroomAttribute("bookedSchedule", "string");
            console.log("Created bookedSchedule attribute");
        }
        attributesInitialized = true;
        console.log("Classroom attributes initialized");
    } catch (error) {
        console.error("Error initializing classroom attributes:", error.message);
    }   
};


const adminService = {  
    // Create Classroom
    createClassroom: async (classroomData) => {
        try {
            await initializeAttributes();
            const { roomName, capacity, type, bookedSchedule } = classroomData; 
            
            // Validate
            if (!roomName || capacity == null || !type) {
                throw new Error("All fields required");
            }   
            
            // Create classroom entity using ClassroomEntity
            const classroomEntityId = await ClassroomEntity.createClassroom("classroom", roomName);

            // Get attribute IDs
            const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
            const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
            const typeAttr = await ClassroomAttribute.getAttributeByName("type");
            const bookedAttr = await ClassroomAttribute.getAttributeByName("bookedSchedule");

            // Store values with correct field mapping
            await ClassroomValue.createClassroomValue(classroomEntityId, roomNameAttr.attribute_id, { value_string: roomName });
            await ClassroomValue.createClassroomValue(classroomEntityId, capacityAttr.attribute_id, { value_number: capacity });
            await ClassroomValue.createClassroomValue(classroomEntityId, typeAttr.attribute_id, { value_string: type });

            if (bookedSchedule) {
                // Store array as JSON string
                await ClassroomValue.createClassroomValue(classroomEntityId, bookedAttr.attribute_id, { value_string: JSON.stringify(bookedSchedule) });
            }

            return { success: true, id: classroomEntityId, message: "Classroom created successfully" };
        } catch (error) {
            return { success: false, message: "Error creating classroom: " + error.message };
        }
    },
};
module.exports = adminService;