const pool = require("../Db_config/DB");

const getGlobalAttrId = async (attributeName) => {
  const [[row]] = await pool.query(
    "SELECT attribute_id FROM attributes WHERE attribute_name=? LIMIT 1",
    [attributeName]
  );
  return row?.attribute_id || null;
};

const getStaffIdFromUserEntityId = async (userEntityId) => {
  const entityId = Number(userEntityId);
  if (!Number.isFinite(entityId)) return null;

  const emailAttrId = await getGlobalAttrId("email");
  if (!emailAttrId) return null;

  const [[emailRow]] = await pool.query(
    `SELECT value_string AS email
     FROM entity_attribute
     WHERE entity_id=? AND attribute_id=? LIMIT 1`,
    [entityId, emailAttrId]
  );

  const rawEmail = String(emailRow?.email || "").trim().toLowerCase();
  if (!rawEmail) return null;

  const staffEmail = rawEmail.startsWith("staff-") ? rawEmail : `staff-${rawEmail}`;

  const [[staff]] = await pool.query(
    `SELECT entity_id
     FROM staff_entity
     WHERE LOWER(TRIM(entity_name)) = ?
        OR LOWER(TRIM(entity_name)) = ?
     LIMIT 1`,
    [rawEmail, staffEmail]
  );

  return staff?.entity_id || null;
};

const studentService = {
  // View office hours for a doctor (doctorEntityId -> staffId -> office hours)
// View office hours by STAFF ID directly
getOfficeHoursByStaffId: async (staffId) => {
    try {
      const staffIdNum = Number(staffId);
      if (!Number.isFinite(staffIdNum)) {
        return { success: false, message: "Invalid staffId" };
      }

      const [rows] = await pool.query(
        `SELECT id, day, start_time, end_time, location
         FROM doctor_office_hours
         WHERE doctor_staff_id=? AND is_active=1
         ORDER BY FIELD(day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), start_time`,
        [staffIdNum]
      );

      const data = rows.map((r) => ({
        id: r.id,
        day: r.day,
        startTime: r.start_time,
        endTime: r.end_time,
        location: r.location,
      }));

      return { success: true, data };
    } catch (e) {
      console.error("getOfficeHoursByStaffId error:", e);
      return { success: false, message: e.message };
    }
  },

  createMeetingRequestForStaff: async ({
  staffId,
  studentEntityId,
  studentName,
  reason,
  requestedDate,
  requestedTime,
}) => {
  try {
    const staffIdNum = Number(staffId);
    const studentIdNum = Number(studentEntityId);

    if (!Number.isFinite(staffIdNum)) {
      return { success: false, message: "Invalid staffId" };
    }
    if (!Number.isFinite(studentIdNum)) {
      return { success: false, message: "Invalid studentEntityId" };
    }

    // optional: check staff exists
    const [[staff]] = await pool.query(
      "SELECT entity_id FROM staff_entity WHERE entity_id=? LIMIT 1",
      [staffIdNum]
    );
    if (!staff) return { success: false, message: "Staff not found" };

    // optional: prevent duplicates while pending
    const [[dup]] = await pool.query(
      `SELECT id FROM doctor_meeting_requests
       WHERE doctor_staff_id=? AND student_entity_id=? AND requested_date=? AND requested_time=?
         AND status='pending'
       LIMIT 1`,
      [staffIdNum, studentIdNum, String(requestedDate), String(requestedTime)]
    );
    if (dup) {
      return { success: false, message: "You already have a pending request for this slot" };
    }

    const [ins] = await pool.query(
      `INSERT INTO doctor_meeting_requests
       (doctor_staff_id, student_entity_id, student_name, reason, requested_date, requested_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        staffIdNum,
        studentIdNum,
        String(studentName || "Student"),
        String(reason || ""),
        String(requestedDate),
        String(requestedTime),
      ]
    );

    return { success: true, data: { id: ins.insertId } };
  } catch (e) {
    console.error("createMeetingRequestForStaff error:", e);
    return { success: false, message: e.message };
  }
},



  // Student view his requests (including approved for reminders)
  getMyMeetingRequests: async (studentEntityId) => {
    try {
      const studentIdNum = Number(studentEntityId);
      if (!Number.isFinite(studentIdNum)) {
        return { success: false, message: "Invalid studentEntityId" };
      }

      const [rows] = await pool.query(
        `SELECT id, doctor_staff_id, student_entity_id, student_name, reason,
                requested_date, requested_time, status, created_at
         FROM doctor_meeting_requests
         WHERE student_entity_id=?
         ORDER BY
           CASE status WHEN 'approved' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
           requested_date ASC, requested_time ASC`,
        [studentIdNum]
      );

      const data = rows.map((r) => ({
        id: r.id,
        doctorStaffId: r.doctor_staff_id,
        reason: r.reason || "",
        requestedDate: r.requested_date,
        requestedTime: r.requested_time,
        status: r.status,
        createdAt: r.created_at,
      }));

      return { success: true, data };
    } catch (e) {
      console.error("getMyMeetingRequests error:", e);
      return { success: false, message: e.message };
    }
  },
};

module.exports = studentService;