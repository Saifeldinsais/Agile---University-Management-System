USE university_management;

CREATE TABLE IF NOT EXISTS doctor_office_hours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_staff_id INT NOT NULL,
  day VARCHAR(16) NOT NULL,
  start_time VARCHAR(8) NOT NULL,
  end_time VARCHAR(8) NOT NULL,
  location VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_meeting_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_staff_id INT NOT NULL,
  student_entity_id INT NULL,
  student_name VARCHAR(255) NULL,
  reason TEXT NULL,
  requested_date VARCHAR(16) NOT NULL,
  requested_time VARCHAR(8) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_office_hours_doctor ON doctor_office_hours(doctor_staff_id);
CREATE INDEX idx_meet_req_doctor ON doctor_meeting_requests(doctor_staff_id);
CREATE INDEX idx_meet_req_status ON doctor_meeting_requests(status);