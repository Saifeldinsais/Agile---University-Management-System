import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Courses.module.css";

const API = "http://localhost:5000";

function DoctorCourses() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [view, setView] = useState("list"); // list, details
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [courseResources, setCourseResources] = useState([]);
  const [courseStaff, setCourseStaff] = useState([]);
  const [courseSchedule, setCourseSchedule] = useState([]);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Section modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'students', 'resources', 'staff'

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const doctorId = localStorage.getItem("userId");
      const res = await axios.get(`${API}/api/doctor/courses/${doctorId}`);
      setCourses(res.data.data || []);
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (course) => {
    setSelectedCourse(course);
    const courseId = course.entity_id || course.id;
    const doctorId = localStorage.getItem("userId");

    console.log(`[handleViewDetails] Course selected:`, { courseId, courseCode: course.code, courseTitle: course.title });

    try {
      // Load students
      try {
        const studentsRes = await axios.get(
          `${API}/api/doctor/courses/${courseId}/students`
        );
        setStudents(studentsRes.data.data || []);
      } catch (err) {
        console.error("Error loading students:", err.response?.data || err.message);
        setStudents([]);
      }

      // Load course resources
      try {
        console.log(`Loading resources for courseId: ${courseId}`);
        const resourcesRes = await axios.get(
          `${API}/api/doctor/courses/${courseId}/resources`
        );
        setCourseResources(resourcesRes.data.data || []);
      } catch (err) {
        console.error("Error loading course resources:", err.response?.data || err.message);
        console.error("Full error:", err);
        setCourseResources([]);
      }

      // Load course staff (TAs)
      try {
        const staffRes = await axios.get(
          `${API}/api/doctor/courses/${courseId}/staff`
        );
        setCourseStaff(staffRes.data.data || []);
      } catch (err) {
        console.error("Error loading course staff:", err.response?.data || err.message);
        setCourseStaff([]);
      }

      // Load course schedule
      try {
        const scheduleRes = await axios.get(
          `${API}/api/doctor/courses/${courseId}/schedule/${doctorId}`
        );
        setCourseSchedule(scheduleRes.data.data || []);
      } catch (err) {
        console.error("Error loading course schedule:", err.response?.data || err.message);
        setCourseSchedule([]);
      }
    } catch (err) {
      console.error("Error loading course details:", err);
    }

    setView("details");
  };

  const handleUploadResource = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0 || !uploadTitle) {
      alert("Please fill in title and select at least one file");
      return;
    }

    setUploading(true);
    const courseId = selectedCourse.entity_id || selectedCourse.id;
    const doctorId = localStorage.getItem("userId");

    let uploadedCount = 0;
    let failedCount = 0;

    try {
      // Upload each file individually
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", `${uploadTitle}${uploadFiles.length > 1 ? ` - ${file.name}` : ""}`);
        formData.append("description", uploadDescription);
        formData.append("doctorId", doctorId);

        try {
          const res = await axios.post(
            `${API}/api/doctor/courses/${courseId}/resources/upload`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          if (res.data.status === "success") {
            setCourseResources(prev => [res.data.data, ...prev]);
            uploadedCount++;
          }
        } catch (err) {
          console.error(`Error uploading file ${file.name}:`, err.response?.data || err.message);
          failedCount++;
        }
      }

      // Show result message
      if (uploadedCount > 0) {
        alert(`Successfully uploaded ${uploadedCount} file(s)${failedCount > 0 ? `. Failed: ${failedCount}` : ""}`);
      } else {
        alert("Failed to upload files. Please check the console for errors.");
      }

      // Reset form
      setUploadTitle("");
      setUploadDescription("");
      setUploadFiles([]);
      setShowUploadModal(false);
    } catch (err) {
      console.error("Error uploading resources:", err);
      alert("Failed to upload resources");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setUploadFiles(selectedFiles);
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) return <div className={styles.loading}>Loading courses...</div>;

  return (
    <div className={styles.container}>
      <h1>Courses Management</h1>

      {view === "list" ? (
        <div className={styles.coursesList}>
          {courses.length === 0 ? (
            <p className={styles.empty}>No courses assigned</p>
          ) : (
            courses.map((course) => (
              <div key={course.id || course.entity_id} className={styles.courseCard}>
                <div className={styles.courseHeader}>
                  <h3>{course.code}</h3>
                  <span className={styles.badge}>Active</span>
                </div>
                <p className={styles.courseTitle}>{course.title}</p>
                <p className={styles.courseDesc}>{course.description || "No description"}</p>
                <div className={styles.courseMeta}>
                  <span>Credits: {course.credits}</span>
                  <span>Semester: {course.semester}</span>
                </div>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewDetails(course)}
                >
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className={styles.detailsView}>
          <button className={styles.backBtn} onClick={() => setView("list")}>
            ← Back to Courses
          </button>

          {selectedCourse && (
            <>
              <div className={styles.courseInfo}>
                <h2>{selectedCourse.code}: {selectedCourse.title}</h2>
                <p>{selectedCourse.description}</p>
              </div>

              <div className={styles.grid}>
                {/* Enrolled Students */}
                <div
                  className={styles.section}
                  onClick={() => {
                    setActiveSection('students');
                    setShowSectionModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>Enrolled Students ({students.length})</h3>
                  <div className={styles.sectionContent}>
                    <div className={styles.studentList}>
                      {students.length === 0 ? (
                        <p className={styles.noData}>No students enrolled</p>
                      ) : (
                        students.slice(0, 5).map((student) => (
                          <div key={student.id} className={styles.studentItem}>
                            <div className={styles.studentName}>
                              {student.name || student.fullName}
                            </div>
                            <div className={styles.studentEmail}>{student.email}</div>
                          </div>
                        ))
                      )}
                      {students.length > 5 && (
                        <div className={styles.more}>+{students.length - 5} more students</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.sectionFooter}>Click to view all</div>
                </div>

                {/* Course Resources/Materials */}
                <div
                  className={styles.section}
                  onClick={() => {
                    setActiveSection('resources');
                    setShowSectionModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>Course Resources & Materials ({courseResources.length})</h3>
                  <div className={styles.sectionContent}>
                    <div className={styles.resourceList}>
                      {courseResources.length === 0 ? (
                        <p className={styles.noData}>No resources uploaded yet</p>
                      ) : (
                        courseResources.slice(0, 5).map((resource) => (
                          <div key={resource.resource_id} className={styles.resourceItem}>
                            <span className={styles.resourceIcon}>
                              {resource.file_type === "pdf" ? "📄" : "📎"}
                            </span>
                            <div className={styles.resourceInfo}>
                              <div className={styles.resourceName}>{resource.title}</div>
                              {resource.description && (
                                <div className={styles.resourceDesc}>
                                  {resource.description}
                                </div>
                              )}
                              <div className={styles.resourceMeta}>
                                {resource.file_type && (
                                  <span className={styles.fileType}>
                                    {resource.file_type.toUpperCase()}
                                  </span>
                                )}
                                {resource.file_size && (
                                  <span className={styles.fileSize}>
                                    {(resource.file_size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {courseResources.length > 5 && (
                        <div className={styles.more}>+{courseResources.length - 5} more resources</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.sectionFooter}>Click to view all or upload</div>
                </div>

                {/* Assigned TAs */}
                <div
                  className={styles.section}
                  onClick={() => {
                    setActiveSection('staff');
                    setShowSectionModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>Assigned Teaching Assistants ({courseStaff.length})</h3>
                  <div className={styles.sectionContent}>
                    <div className={styles.taList}>
                      {courseStaff.length === 0 ? (
                        <p className={styles.noData}>No TAs assigned to this course</p>
                      ) : (
                        courseStaff.slice(0, 5).map((staff) => (
                          <div key={staff.assignmentId} className={styles.taItem}>
                            <div className={styles.taName}>{staff.name}</div>
                            <div className={styles.taRole}>{staff.role}</div>
                            <div className={styles.taEmail}>{staff.email}</div>
                          </div>
                        ))
                      )}
                      {courseStaff.length > 5 && (
                        <div className={styles.more}>+{courseStaff.length - 5} more assistants</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.sectionFooter}>Click to view all</div>
                </div>

                {/* Course Schedule */}
                <div className={styles.section}>
                  <h3>Course Schedule</h3>
                  <div className={styles.sectionContent}>
                    <div className={styles.schedule}>
                      {courseSchedule.length === 0 ? (
                        <p className={styles.noData}>No schedule assigned yet</p>
                      ) : (
                        courseSchedule.map((slot) => (
                          <div key={slot.scheduleId} className={styles.scheduleItem}>
                            <span className={styles.day}>{slot.day}</span>
                            <span className={styles.time}>
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                            <span className={styles.room}>{slot.room}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Section Modal (View All Items) */}
      {showSectionModal && (
        <div className={styles.modal}>
          <div className={styles.sectionModal}>
            <button
              className={styles.closeBtn}
              onClick={() => {
                setShowSectionModal(false);
                setActiveSection(null);
              }}
            >
              ✕
            </button>

            {/* Students Modal */}
            {activeSection === 'students' && (
              <>
                <h2>Enrolled Students ({students.length})</h2>
                <div className={styles.modalContentArea}>
                  {students.length === 0 ? (
                    <p className={styles.noData}>No students enrolled</p>
                  ) : (
                    students.map((student) => (
                      <div key={student.id} className={styles.studentItemLarge}>
                        <div className={styles.studentName}>{student.name || student.fullName}</div>
                        <div className={styles.studentEmail}>{student.email}</div>
                        {student.enrollmentDate && (
                          <div className={styles.enrollDate}>
                            Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Resources Modal */}
            {activeSection === 'resources' && (
              <>
                <h2>Course Resources & Materials ({courseResources.length})</h2>
                <div className={styles.modalContentArea}>
                  {courseResources.length === 0 ? (
                    <p className={styles.noData}>No resources uploaded yet</p>
                  ) : (
                    courseResources.map((resource) => (
                      <div key={resource.resource_id} className={styles.resourceItemLarge}>
                        <span className={styles.resourceIcon}>
                          {resource.file_type === "pdf" ? "📄" : "📎"}
                        </span>
                        <div className={styles.resourceInfo}>
                          <div className={styles.resourceName}>{resource.title}</div>
                          {resource.description && (
                            <div className={styles.resourceDesc}>{resource.description}</div>
                          )}
                          <div className={styles.resourceMeta}>
                            {resource.file_type && (
                              <span className={styles.fileType}>
                                {resource.file_type.toUpperCase()}
                              </span>
                            )}
                            {resource.file_size && (
                              <span className={styles.fileSize}>
                                {(resource.file_size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                            {resource.upload_date && (
                              <span className={styles.uploadDate}>
                                {new Date(resource.upload_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {resource.file_path && (
                          <a
                            href={resource.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.downloadBtn}
                          >
                            ↓ Download
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <button
                  className={styles.uploadBtn}
                  onClick={() => {
                    setShowSectionModal(false);
                    setShowUploadModal(true);
                  }}
                >
                  + Upload New Resource
                </button>
              </>
            )}

            {/* Staff Modal */}
            {activeSection === 'staff' && (
              <>
                <h2>Assigned Teaching Assistants ({courseStaff.length})</h2>
                <div className={styles.modalContentArea}>
                  {courseStaff.length === 0 ? (
                    <p className={styles.noData}>No TAs assigned to this course</p>
                  ) : (
                    courseStaff.map((staff) => (
                      <div key={staff.assignmentId} className={styles.taItemLarge}>
                        <div className={styles.taName}>{staff.name}</div>
                        <div className={styles.taRole}>{staff.role}</div>
                        <div className={styles.taEmail}>{staff.email}</div>
                        {staff.assignedDate && (
                          <div className={styles.assignDate}>
                            Assigned: {new Date(staff.assignedDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button
              className={styles.closeBtn}
              onClick={() => setShowUploadModal(false)}
            >
              ✕
            </button>
            <h3>Upload Course Resource</h3>
            <form onSubmit={handleUploadResource}>
              <div className={styles.formGroup}>
                <label>Resource Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Lecture Slides Week 1"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Short description (optional)"
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Select File(s) *</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.txt,.csv,.xls,.xlsx,.mp4,.mov"
                  multiple
                  required
                />
                {uploadFiles.length > 0 && (
                  <div className={styles.fileList}>
                    <p className={styles.fileCount}>{uploadFiles.length} file(s) selected:</p>
                    <ul>
                      {uploadFiles.map((file, idx) => (
                        <li key={idx}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={uploading || uploadFiles.length === 0}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorCourses;
