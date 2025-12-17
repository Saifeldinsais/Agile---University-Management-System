const entity = require("../EAV models/Entity");
const attribute = require("../EAV models/Attribute");
const value = require("../EAV models/Value");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const ClassroomValue = require("../EAV models/classroom_value");
const ClassroomAttribute = require("../EAV models/classroom_attribute");
const ClassroomEntity = require("../EAV models/classroom_entity");
const pool = require("../Db_config/DB");

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
            await ClassroomAttribute.createClassroomAttribute("timeslot","string");
            console.log("Created timeslot attribute");
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

      const classroomEntityId = await ClassroomEntity.createClassroom("classroom", roomName);

      const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
      const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
      const typeAttr = await ClassroomAttribute.getAttributeByName("type");
      const isworkingAttr = await ClassroomAttribute.getAttributeByName("isworking");
      const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");

      // Basic Attributes
      await ClassroomValue.createClassroomValue(classroomEntityId, roomNameAttr.attribute_id, { value_string: roomName });
      await ClassroomValue.createClassroomValue(classroomEntityId, capacityAttr.attribute_id, { value_number: capacity });
      await ClassroomValue.createClassroomValue(classroomEntityId, typeAttr.attribute_id, { value_string: type });
      await ClassroomValue.createClassroomValue(classroomEntityId, isworkingAttr.attribute_id, { value_string: isworking });

      // Store Timeslots (Corrected loop and stringify)
      if (Array.isArray(timeslots)) {
        for (let i = 1; i < timeslots.length; i++) {
          await ClassroomValue.createClassroomValue(
            classroomEntityId,
            timeslotAttr.attribute_id,
            {
              value_string: JSON.stringify(timeslots[i]),
              array_index: i
            }
          );
        }
      }

      return { success: true, id: classroomEntityId, message: "Classroom created successfully" };
    } catch (error) {
      return { success: false, message: error.message };
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
        await initializeAttributes(); // Ensure attributes exist in the DB first
        const classroom = await ClassroomEntity.findByAttribute("roomName", roomName);
        return classroom || null;
    } catch (error) {
        console.error("Error checking classroom existence:", error);
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
},
addTimeSlot: async (roomId, timeSlot) => {
    try {
      await initializeAttributes();
      const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");

      // Find next index
      const [rows] = await pool.query(
        "SELECT MAX(array_index) AS maxIndex FROM classroom_entity_attribute WHERE entity_id = ? AND attribute_id = ?",
        [roomId, timeslotAttr.attribute_id]
      );

      const nextIndex = (rows[0].maxIndex !== null) ? rows[0].maxIndex + 1 : 0;

      await ClassroomValue.createClassroomValue(
        roomId,
        timeslotAttr.attribute_id,
        {
          value_string: JSON.stringify(timeSlot),
          array_index: nextIndex
        }
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  },
    updateTimeSlot: async (roomId, slotId, updatedTimeSlot) => {
    try {
        await initializeAttributes();
        const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");

        // 1. Fetch the existing record to get its current array_index
        const [existing] = await pool.query(
            "SELECT array_index FROM classroom_entity_attribute WHERE value_id = ? AND entity_id = ?",
            [slotId, roomId]
        );

        if (!existing || existing.length === 0) {
            return { success: false, message: "Time slot not found" };
        }

        // 2. Pass the existing index back into the update function
        const success = await ClassroomValue.updateClassroomValue(slotId, {
            value_string: JSON.stringify(updatedTimeSlot),
            array_index: existing[0].array_index // Keep the original index (1, 2, 3, etc.)
        });

        return { success: success };
    } catch (error) {
        console.error("Service Error:", error);
        return { success: false, message: error.message };
    }
},
deleteTimeSlot: async (roomId, slotId) => {
  try {
    await initializeAttributes();
    const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot"); //
    const [rows] = await pool.query(
      "SELECT value_id FROM classroom_entity_attribute WHERE value_id = ? AND entity_id = ? AND attribute_id = ?",
      [slotId, roomId, timeslotAttr.attribute_id]
    );

    if (rows.length === 0) {
      return { success: false, message: "Time slot not found for this classroom" };
    }


    const success = await ClassroomValue.deleteClassroomValue(slotId); //

    return { success: success };
  } catch (error) {
    console.error("Service Error:", error);
    return { success: false, message: error.message };
  }
}


};
module.exports = adminService;