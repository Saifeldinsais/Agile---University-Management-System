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
            console.log("Created isworking attribute"); 
           }

        const timeslot = await ClassroomAttribute.getAttributeByName("timeslot");
        if(!timeslot){
            await ClassroomAttribute.createClassroomAttribute("timeslot","string")
        }   
        attributesInitialized = true;
        console.log("Classroom attributes initialized");
    } catch (error) {
        console.error("Error initializing classroom attributes:", error.message);
    }
};


const adminService = {
  createClassroom: async (classroomData) => {
    try {
      await initializeAttributes();
      const { roomName, capacity, type, isworking, timeslots } = classroomData;

      if (!roomName || capacity == null || !type) {
        throw new Error("Important fields are required");
      }

      // Create classroom entity
      const classroomEntityId = await ClassroomEntity.createClassroom("classroom", roomName);

      // Get attribute IDs
      const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
      const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
      const typeAttr = await ClassroomAttribute.getAttributeByName("type");
      const isworkingAttr = await ClassroomAttribute.getAttributeByName("isworking");
      const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");

      // Store values
      await ClassroomValue.createClassroomValue(classroomEntityId, roomNameAttr.attribute_id, { value_string: roomName });
      await ClassroomValue.createClassroomValue(classroomEntityId, capacityAttr.attribute_id, { value_number: capacity });
      await ClassroomValue.createClassroomValue(classroomEntityId, typeAttr.attribute_id, { value_string: type });
      await ClassroomValue.createClassroomValue(classroomEntityId, isworkingAttr.attribute_id, { value_string: isworking });

      // Store each timeslot as a separate row
      if (Array.isArray(timeslots)) {
        for (let i = 1; i < timeslots.length; i++) {
          await ClassroomValue.createClassroomValue(
            classroomEntityId,
            timeslotAttr.attribute_id,
            { value_string: timeslots[i], array_index: i }
          );
        }
      }

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
        const { roomName, capacity, type, bookedSchedule, isworking, timeslots } = classroomData; 
        
        if (!roomName || capacity == null || !type) {
            throw new Error("All fields required");
        }

        await ClassroomEntity.updateClassroom(id, roomName);

        const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
        const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
        const typeAttr = await ClassroomAttribute.getAttributeByName("type");
        const isworkingAttr = await ClassroomAttribute.getAttributeByName("isworking");
        const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");

        // Helper to update/create single values
        const upsertValue = async (attr, value, isNumber = false) => {
            const existing = await ClassroomValue.getClassroomValue(id, attr.attribute_id);
            if (existing) {
                await ClassroomValue.updateClassroomValue(existing.value_id, isNumber ? { value_number: value } : { value_string: value });
            } else {
                await ClassroomValue.createClassroomValue(id, attr.attribute_id, isNumber ? { value_number: value } : { value_string: value });
            }
        };

        await upsertValue(roomNameAttr, roomName);
        await upsertValue(capacityAttr, capacity, true);
        await upsertValue(typeAttr, type);
        if (isworking !== undefined && isworking !== null) {
            await upsertValue(isworkingAttr, isworking);
        }

        // Timeslots: remove existing timeslots first
        if (Array.isArray(timeslots)) {
            await ClassroomValue.deleteClassroomAttributeValues(id, timeslotAttr.attribute_id);

            // Store each timeslot with array_index starting from 1
            for (let i = 1; i < timeslots.length; i++) {
                await ClassroomValue.createClassroomValue(
                    id,
                    timeslotAttr.attribute_id,
                    { value_string: timeslots[i], array_index: i } 
                );
            }
        }

        return { success: true, message: "Classroom updated successfully" };
    } catch (error) {
        return { success: false, message: "Error updating classroom: " + error.message };
    }
},
  getClassroomByName: async (roomName) => {
    try {
        await initializeAttributes();
        
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
        const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");
        // Delete all attribute values
        await ClassroomValue.deleteClassroomAttributeValues(id, roomNameAttr.attribute_id);
        await ClassroomValue.deleteClassroomAttributeValues(id, capacityAttr.attribute_id);
        await ClassroomValue.deleteClassroomAttributeValues(id, typeAttr.attribute_id);
        await ClassroomValue.deleteClassroomAttributeValues(id, isworkingAttr.attribute_id);
        await ClassroomValue.deleteClassroomAttributeValues(id, timeslotAttr.attribute_id);
        // Delete classroom entity
        const result = await ClassroomEntity.deleteClassroom(id);
        if (!result) {
            throw new Error("Classroom not found");
        }

        return { success: true, message: "Classroom deleted successfully" };
    } catch (error) {
        return { success: false, message: "Error deleting classroom: " + error.message };
    }

},
getallStudents: async ()=>{
    try{
        const students = await entity.getallStudents();
        return {success : true , students};
    }catch(error){
        return {success : false , message : "Error getting students: "+ error.message};
    }
}

};
module.exports = adminService;