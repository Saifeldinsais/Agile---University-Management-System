const entity = require("../EAV models/Entity");
const attribute = require("../EAV models/Attribute");
const value = require("../EAV models/Value");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
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

        const isworking = await ClassroomAttribute.getAttributeByName("isworking");
        if(!isworking){
            await ClassroomAttribute.createClassroomAttribute("isworking","string");
            console.log("Created isworking attribute");        }
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
        const { roomName, capacity, type, isworking } = classroomData;

        if (!roomName || capacity == null || !type) {
            throw new Error("All fields required");
        }

        const classroomEntityId = await ClassroomEntity.createClassroom("classroom", roomName);

        const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
        const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
        const typeAttr = await ClassroomAttribute.getAttributeByName("type");
        const isworkingAttr = await ClassroomAttribute.getAttributeByName("isworking");

        await ClassroomValue.createClassroomValue(classroomEntityId, roomNameAttr.attribute_id, { value_string: roomName });
        await ClassroomValue.createClassroomValue(classroomEntityId, capacityAttr.attribute_id, { value_number: capacity });
        await ClassroomValue.createClassroomValue(classroomEntityId, typeAttr.attribute_id, { value_string: type });
        await ClassroomValue.createClassroomValue(classroomEntityId, isworkingAttr.attribute_id, { value_string: isworking });

    
        return { success: true, id: classroomEntityId, message: "Classroom created successfully" };
    } catch (error) {
        return { success: false, message: "Error creating classroom: " + error.message };
    }
},


    getClassroom: async () =>{
        try{
            const classrooms = await ClassroomEntity.getAllClassrooms();
            return {success : true , classrooms};
        }catch(error){
            return {success : false , message : "Error getting classrooms: "+ error.message};
        }
    },
    updateClassroom: async (id, classroomData) => {
        try {
            await initializeAttributes();
            // FIX 1: Added `isworking` to destructure the value from the request data.
            const { roomName, capacity, type, bookedSchedule, isworking } = classroomData; 
            
            // Validate
            if (!roomName || capacity == null || !type) {
                throw new Error("All fields required");
            }
            // Update classroom entity name
            await ClassroomEntity.updateClassroom(id, roomName);
            // Get attribute IDs
            const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
            const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
            const typeAttr = await ClassroomAttribute.getAttributeByName("type");
            const isworkingAttr = await ClassroomAttribute.getAttributeByName("isworking");
            
            // FIX 2: Removed erroneous line that incorrectly fetched attribute metadata.
            // const isworking = await ClassroomAttribute.getClassroomAttributeById("isworking"); // REMOVED

            // Update values
            const roomNameValue = await ClassroomValue.getClassroomValue(id, roomNameAttr.attribute_id);
            if (roomNameValue) {
                await ClassroomValue.updateClassroomValue(roomNameValue.value_id, { value_string: roomName });
            } else {
                await ClassroomValue.createClassroomValue(id, roomNameAttr.attribute_id, { value_string: roomName });
            }
            const capacityValue = await ClassroomValue.getClassroomValue(id, capacityAttr.attribute_id);
            if (capacityValue) {
                await ClassroomValue.updateClassroomValue(capacityValue.value_id, { value_number: capacity });
            } else {
                await ClassroomValue.createClassroomValue(id, capacityAttr.attribute_id, { value_number: capacity });
            }
            const typeValue = await ClassroomValue.getClassroomValue(id, typeAttr.attribute_id);
            if (typeValue) {
                await ClassroomValue.updateClassroomValue(typeValue.value_id, { value_string: type });
            } else {
                await ClassroomValue.createClassroomValue(id, typeAttr.attribute_id, { value_string: type });
            }
            
            // FIX 3: Corrected the logic for updating/creating the `isworking` value.
            // It now correctly checks for the existing value row using `isworkingAttr.attribute_id`.
            const isworkingValue = await ClassroomValue.getClassroomValue(id, isworkingAttr.attribute_id);
            if(isworkingValue){
                // Update existing value using the correct value_id
                await ClassroomValue.updateClassroomValue(isworkingValue.value_id, { value_string: isworking });
            }else if (isworking !== undefined && isworking !== null) {
                // Create new value if one wasn't found
                await ClassroomValue.createClassroomValue(id, isworkingAttr.attribute_id, { value_string: isworking });
            }


            return { success: true, message: "Classroom updated successfully" };
        } catch (error) {
            return { success: false, message: "Error updating classroom: " + error.message };
        }
    },
  getClassroomByName: async (roomName) => {
    try {
        await initializeAttributes();
        // FIX 4: Changed the call to the correct model function: 
        // Searching for an entity by attribute requires `ClassroomEntity.findByAttribute`, not `ClassroomAttribute.getAttributeByName`.
        const classroom = await ClassroomEntity.findByAttribute("roomName", roomName); 
        if (!classroom) {
            return null;
        }
        return classroom;
    } catch (error) {
        console.error("Error getting classroom by name:", error);
        return null;
    }
},
getClassroomById: async (id) => {
    try {
        await initializeAttributes();
        const classroom = await ClassroomEntity.getClassroomById(id);
        if (!classroom) {
            return null;
        }
        return classroom;
    } catch (error) {
        console.error("Error getting classroom by ID:", error);
        return null;
    }
},
deleteClassroom: async (id) => {
    try {
        // Get all attributes
        const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
        const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
        const typeAttr = await ClassroomAttribute.getAttributeByName("type");
        const isworkingAttr = await ClassroomAttribute.getAttributeByName("isworking");
        // Delete all attribute values
        await ClassroomValue.deleteClassroomAttributeValues(id, roomNameAttr.attribute_id);
        await ClassroomValue.deleteClassroomAttributeValues(id, capacityAttr.attribute_id);
        await ClassroomValue.deleteClassroomAttributeValues(id, typeAttr.attribute_id);
        await ClassroomValue.deleteClassroomAttributeValues(id, isworkingAttr.attribute_id);
        // Delete classroom entity
        const result = await ClassroomEntity.deleteClassroom(id);
        if (!result) {
            throw new Error("Classroom not found");
        }

        return { success: true, message: "Classroom deleted successfully" };
    } catch (error) {
        return { success: false, message: "Error deleting classroom: " + error.message };
    }

}

};
module.exports = adminService;