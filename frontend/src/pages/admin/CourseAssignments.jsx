import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import * as courseService from '../../services/courseService';
import adminStaffService from '../../services/adminStaffService';
import './CourseAssignments.css';
import './dashboard.css';

// Role badge colors
const ROLE_COLORS = {
  doctor: { bg: '#dbeafe', color: '#0369a1', label: 'Doctor' },
  ta: { bg: '#fef3c7', color: '#92400e', label: 'Teaching Assistant' },
};

// Status badge colors
const STATUS_COLORS = {
  active: { bg: '#d1fae5', color: '#065f46', label: 'Active' },
  inactive: { bg: '#fee2e2', color: '#991b1b', label: 'Inactive' },
};

function RoleBadge({ role }) {
  const config = ROLE_COLORS[role?.toLowerCase()] || { bg: '#e5e7eb', color: '#374151', label: role };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        marginRight: 4,
      }}
    >
      {config.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.active;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}

// Toast notification component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : type === 'warning' ? '#fef3c7' : '#e0e7ff';
  const textColor =
    type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : type === 'warning' ? '#92400e' : '#3730a3';

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        padding: '12px 20px',
        borderRadius: 8,
        backgroundColor: bgColor,
        color: textColor,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          color: textColor,
        }}
      >
        ×
      </button>
    </div>
  );
}

// Confirmation Modal
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 24,
          maxWidth: 400,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>{title}</h2>
        <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: isDestructive ? '#ef4444' : '#3b82f6',
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add/Edit Assignment Modal
function AssignmentModal({ isOpen, isEdit, onClose, onSubmit, assignment, courses, staff, loading, dataLoading }) {
  const [formData, setFormData] = useState({
    courseId: '',
    staffMembers: [
      {
        staffId: '',
        role: 'doctor',
      }
    ],
    department: '',
    notes: '',
  });
  
  const [staffSearches, setStaffSearches] = useState(['']);
  const [openDropdowns, setOpenDropdowns] = useState([false]);

  useEffect(() => {
    if (isEdit && assignment) {
      setFormData({
        courseId: assignment.courseId || '',
        staffMembers: [
          {
            staffId: assignment.staffId || '',
            role: assignment.role || 'doctor',
          }
        ],
        department: assignment.department || '',
        notes: assignment.notes || '',
      });
      setStaffSearches(['']);
      setOpenDropdowns([false]);
    } else {
      setFormData({
        courseId: '',
        staffMembers: [
          {
            staffId: '',
            role: 'doctor',
          }
        ],
        department: '',
        notes: '',
      });
      setStaffSearches(['']);
      setOpenDropdowns([false]);
    }
  }, [isEdit, assignment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStaffMemberChange = (index, field, value) => {
    setFormData((prev) => {
      const newStaffMembers = [...prev.staffMembers];
      newStaffMembers[index] = {
        ...newStaffMembers[index],
        [field]: value,
      };
      return {
        ...prev,
        staffMembers: newStaffMembers,
      };
    });
  };

  const handleStaffSearch = (index, searchValue) => {
    const newSearches = [...staffSearches];
    newSearches[index] = searchValue;
    setStaffSearches(newSearches);

    const newDropdowns = [...openDropdowns];
    newDropdowns[index] = searchValue.length > 0;
    setOpenDropdowns(newDropdowns);
  };

  const handleSelectStaff = (index, staffMember) => {
    handleStaffMemberChange(index, 'staffId', staffMember.id);
    const newSearches = [...staffSearches];
    newSearches[index] = staffMember.name + ' (' + staffMember.email + ')';
    setStaffSearches(newSearches);

    const newDropdowns = [...openDropdowns];
    newDropdowns[index] = false;
    setOpenDropdowns(newDropdowns);
  };

  const handleAddStaffMember = () => {
    setFormData((prev) => ({
      ...prev,
      staffMembers: [
        ...prev.staffMembers,
        {
          staffId: '',
          role: 'doctor',
        }
      ],
    }));
    setStaffSearches([...staffSearches, '']);
    setOpenDropdowns([...openDropdowns, false]);
  };

  const handleRemoveStaffMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      staffMembers: prev.staffMembers.filter((_, i) => i !== index),
    }));
    setStaffSearches(staffSearches.filter((_, i) => i !== index));
    setOpenDropdowns(openDropdowns.filter((_, i) => i !== index));
  };

  const getFilteredStaff = (searchTerm) => {
    if (!searchTerm.trim()) return staff;
    const lowerSearch = searchTerm.toLowerCase();
    console.log('=== SEARCH DEBUG ===');
    console.log('Search term:', searchTerm);
    console.log('Total staff available:', staff.length);
    console.log('Staff array:', staff);
    
    if (staff.length === 0) {
      console.warn('No staff members loaded!');
      return [];
    }
    
    const filtered = staff.filter((s) => {
      if (!s) {
        console.log('Null staff member encountered');
        return false;
      }
      
      // Check all possible properties
      const emailMatch = s.email?.toLowerCase().includes(lowerSearch);
      const nameMatch = s.name?.toLowerCase().includes(lowerSearch);
      const idMatch = s.id?.toString().toLowerCase().includes(lowerSearch);
      const usernameMatch = s.username?.toLowerCase().includes(lowerSearch);
      const entityNameMatch = s.entity_name?.toLowerCase().includes(lowerSearch);
      
      // Try common email patterns
      const constructedEmail1 = s.username ? `${s.username}@ums-doctor.com`.toLowerCase() : null;
      const constructedEmail2 = s.id ? `${s.id}@ums-doctor.com`.toLowerCase() : null;
      const emailVariants = [
        s.email?.toLowerCase(),
        constructedEmail1,
        constructedEmail2,
      ].filter(Boolean);
      
      const variantMatch = emailVariants.some(e => e?.includes(lowerSearch));
      
      const matches = {
        email: emailMatch,
        name: nameMatch,
        id: idMatch,
        username: usernameMatch,
        entity_name: entityNameMatch,
        variant: variantMatch
      };
      
      const hasMatch = Object.values(matches).some(v => v);
      
      if (hasMatch) {
        console.log(`✓ MATCH: ${s.name || s.entity_name} (${s.email})`, matches);
      }
      
      return hasMatch;
    });
    
    console.log(`Results: ${filtered.length} matches out of ${staff.length} staff`);
    console.log('Filtered results:', filtered);
    console.log('=== END SEARCH DEBUG ===');
    return filtered;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Support multiple staff assignments
    // Filter out empty staff member entries
    const validStaffMembers = formData.staffMembers.filter(
      (member) => member.staffId && String(member.staffId).trim() !== ''
    );
    
    if (validStaffMembers.length > 0) {
      onSubmit({
        courseId: formData.courseId,
        staffMembers: validStaffMembers,
        department: formData.department,
        notes: formData.notes,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 24,
          width: '95%',
          maxWidth: 1000,
          maxHeight: '95vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600 }}>
          {isEdit ? 'Edit Assignment' : 'New Assignment'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Course *
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              disabled={isEdit}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: isEdit ? '#f5f5f5' : 'white',
                cursor: isEdit ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Members Section */}
          <div>
            <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
              Staff Members *
            </label>
            
            {formData.staffMembers.map((member, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 16,
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  backgroundColor: '#fafafa',
                }}
              >
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: '#666' }}>
                      Search by Email or Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="e.g., doctor@email.com or John Doe"
                        value={staffSearches[index] || ''}
                        onChange={(e) => handleStaffSearch(index, e.target.value)}
                        onFocus={() => {
                          const newDropdowns = [...openDropdowns];
                          newDropdowns[index] = (staffSearches[index] || '').length > 0;
                          setOpenDropdowns(newDropdowns);
                        }}
                        disabled={isEdit}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          fontSize: 13,
                          backgroundColor: isEdit ? '#f5f5f5' : 'white',
                          cursor: isEdit ? 'not-allowed' : 'text',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Dropdown popup */}
                      {openDropdowns[index] && !isEdit && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderTop: 'none',
                            borderRadius: '0 0 6px 6px',
                            maxHeight: 200,
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        >
                          {dataLoading ? (
                            <div style={{ padding: '12px', color: '#999', fontSize: 12, textAlign: 'center' }}>
                              Loading staff data...
                            </div>
                          ) : staff.length === 0 ? (
                            <div style={{ padding: '12px', color: '#999', fontSize: 12, textAlign: 'center' }}>
                              No doctors or teaching assistants available
                            </div>
                          ) : getFilteredStaff(staffSearches[index] || '').length === 0 ? (
                            <div style={{ padding: '12px', color: '#999', fontSize: 12, textAlign: 'center' }}>
                              No staff found matching your search
                            </div>
                          ) : (
                            getFilteredStaff(staffSearches[index] || '').map((s) => (
                              <div
                                key={s.id}
                                onClick={() => handleSelectStaff(index, s)}
                                style={{
                                  padding: '10px 12px',
                                  borderBottom: '1px solid #f0f0f0',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  backgroundColor: 'white',
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseOver={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
                                onMouseOut={(e) => (e.target.style.backgroundColor = 'white')}
                              >
                                <div style={{ fontWeight: 500 }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: '#666' }}>{s.email}</div>
                                <div style={{ fontSize: 11, color: '#999' }}>Role: {s.role}</div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ width: 150 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: '#666' }}>
                      Role
                    </label>
                    <select
                      value={member.role}
                      onChange={(e) => handleStaffMemberChange(index, 'role', e.target.value)}
                      disabled={isEdit}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: 6,
                        fontSize: 13,
                        backgroundColor: isEdit ? '#f5f5f5' : 'white',
                        cursor: isEdit ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <option value="doctor">Doctor</option>
                      <option value="ta">Teaching Assistant</option>
                    </select>
                  </div>

                  {formData.staffMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStaffMember(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        marginTop: 20,
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            {!isEdit && (
              <button
                type="button"
                onClick={handleAddStaffMember}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 12,
                }}
              >
                + Add Another Staff Member
              </button>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this assignment..."
              rows="3"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: loading ? '#ccc' : '#3b82f6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Component
function CourseAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [staffMenuOpen, setStaffMenuOpen] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentsRes, coursesRes, staffRes] = await Promise.all([
        assignmentService.getAllAssignments(),
        courseService.getCourses(),
        adminStaffService.getStaff(), // Fetch all staff, then filter
      ]);

      if (assignmentsRes.status === 'success') {
        setAssignments(assignmentsRes.data || []);
      }

      if (Array.isArray(coursesRes)) {
        setCourses(coursesRes || []);
      } else if (coursesRes.status === 'success') {
        setCourses(coursesRes.courses || []);
      }

      if (staffRes.status === 'success') {
        console.log('=== STAFF RESPONSE DEBUG ===');
        console.log('Full staffRes object:', staffRes);
        console.log('staffRes.data:', staffRes.data);
        console.log('staffRes.data?.staff:', staffRes.data?.staff);
        
        // Try multiple ways to access the staff data
        let staffArray = [];
        if (Array.isArray(staffRes.data?.staff)) {
          staffArray = staffRes.data.staff;
          console.log('Using staffRes.data.staff');
        } else if (Array.isArray(staffRes.data)) {
          staffArray = staffRes.data;
          console.log('Using staffRes.data directly');
        } else if (staffRes.data) {
          console.log('staffRes.data exists but is not an array:', staffRes.data);
          for (const key of Object.keys(staffRes.data)) {
            if (Array.isArray(staffRes.data[key])) {
              staffArray = staffRes.data[key];
              console.log(`Found array at staffRes.data.${key}`);
              break;
            }
          }
        }
        
        console.log('Raw staff data array:', staffArray);
        console.log('Staff count:', staffArray.length);
        if (staffArray.length > 0) {
          console.log('First staff member structure:', staffArray[0]);
        }
        
        const filteredStaff = staffArray.filter((s) => {
          if (!s) return false;
          const roleStr = (s.role?.toLowerCase() || '').trim(); // TRIM whitespace!
          const rolesArray = s.roles ? (Array.isArray(s.roles) ? s.roles : []) : [];
          
          const isDoctor = roleStr === 'doctor' || rolesArray.some(r => r?.toLowerCase().trim() === 'doctor');
          const isTA = roleStr === 'ta' || rolesArray.some(r => r?.toLowerCase().trim() === 'ta');
          
          console.log(`Staff ${s.name} (${s.email}): role='${roleStr}', isDoctor=${isDoctor}, isTA=${isTA}`);
          return isDoctor || isTA;
        });
        console.log('Filtered staff (doctors/TAs only):', filteredStaff);
        console.log('=== END DEBUG ===');
        setStaff(filteredStaff);
      } else {
        console.error('Staff response error:', staffRes);
      }
    } catch (error) {
      showToast('Failed to load data', 'error');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Handle add new assignment
  const handleAddClick = () => {
    if (loading) {
      showToast('Loading data, please wait...', 'info');
      return;
    }
    if (staff.length === 0) {
      showToast('No doctors or teaching assistants available', 'warning');
      return;
    }
    setIsEdit(false);
    setSelectedAssignment(null);
    setIsModalOpen(true);
  };

  // Handle edit assignment
  const handleEditClick = (assignment) => {
    setIsEdit(true);
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  // Handle modal submit
  const handleModalSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (isEdit && selectedAssignment) {
        const result = await assignmentService.updateAssignment(selectedAssignment.id, {
          role: formData.role,
          department: formData.department,
          notes: formData.notes,
        });

        if (result.status === 'success') {
          showToast('Assignment updated successfully', 'success');
          fetchData();
          setIsModalOpen(false);
        } else {
          showToast(result.message || 'Failed to update assignment', 'error');
        }
      } else {
        console.log('=== CREATING NEW ASSIGNMENT(S) ===');
        console.log('FormData being sent:', formData);

        // Create assignment for each staff member
        const staffMembers = formData.staffMembers || [];
        const validMembers = staffMembers.filter(
          (member) => member.staffId && String(member.staffId).trim() !== ''
        );

        if (validMembers.length === 0) {
          showToast('Please select at least one staff member', 'error');
          return;
        }

        // Create assignments for all staff members
        const assignmentPromises = validMembers.map((member) =>
          assignmentService.assignStaffToCourse(
            formData.courseId,
            member.staffId,
            member.role,
            formData.department,
            formData.notes
          )
        );

        const results = await Promise.all(assignmentPromises);
        console.log('Assignment responses:', results);

        // Check if all assignments were successful
        const allSuccessful = results.every((r) => r.status === 'success');
        const failedCount = results.filter((r) => r.status !== 'success').length;

        if (allSuccessful) {
          showToast(
            `${validMembers.length} assignment(s) created successfully`,
            'success'
          );
          fetchData();
          setIsModalOpen(false);
        } else if (results.some((r) => r.status === 'success')) {
          showToast(
            `${validMembers.length - failedCount} assignment(s) created, ${failedCount} failed`,
            'warning'
          );
          fetchData();
          setIsModalOpen(false);
        } else {
          showToast('Failed to create assignments', 'error');
        }
      }
    } catch (error) {
      showToast('Operation failed: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (assignment) => {
    setConfirmDelete({
      title: 'Remove Assignment',
      message: `Remove ${assignment.staff?.name || assignment.staffName} from ${assignment.course?.name || assignment.courseName}?`,
      onConfirm: () => handleConfirmDelete(assignment),
    });
  };

  const handleConfirmDelete = async (assignment) => {
    try {
      const result = await assignmentService.removeAssignment(assignment.id);

      if (result.status === 'success') {
        showToast('Assignment removed successfully', 'success');
        fetchData();
        setConfirmDelete(null);
      } else {
        showToast(result.message || 'Failed to remove assignment', 'error');
      }
    } catch (error) {
      showToast('Failed to remove assignment: ' + error.message, 'error');
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const matchSearch =
      searchTerm === '' ||
      assignment.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.staff?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCourse = filterCourse === '' || assignment.courseId == filterCourse;
    const matchRole = filterRole === '' || assignment.role?.toLowerCase() === filterRole.toLowerCase();

    return matchSearch && matchCourse && matchRole;
  });

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">U-Manage</h2>
        <nav className="admin-menu">
          <button
            className="menu-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            Dashboard
          </button>
          <button
            className="menu-item"
            onClick={() => navigate("/admin/facilities")}
          >
            Facilities
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/curriculum")}>
            Curriculum
          </button>

          {/* Staff Dropdown */}
          <div>
            <button
              className="menu-item"
              onClick={() => setStaffMenuOpen(!staffMenuOpen)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}
            >
              Staff
              <span style={{ fontSize: 10 }}>{staffMenuOpen ? "▼" : "▶"}</span>
            </button>
            {staffMenuOpen && (
              <div style={{ paddingLeft: 16 }}>
                <button className="menu-item" onClick={() => navigate("/admin/staff/directory")} style={{ fontSize: 13 }}>
                  Directory
                </button>
                <button className="menu-item active" onClick={() => navigate("/admin/staff/assignments")} style={{ fontSize: 13 }}>
                  Course Assignments
                </button>
              </div>
            )}
          </div>

          <button className="menu-item" onClick={() => navigate("/admin/enrollments")}>
            Enrollments
          </button>
          <button className="menu-item" onClick={() => alert("Community soon")}>
            Community
          </button>
        </nav>

        {/* Logout button */}
        <div style={{ marginTop: "auto", padding: "20px" }}>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("student");
              navigate("/login");
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.target.style.background = "rgba(239, 68, 68, 0.2)"}
            onMouseOut={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Course Assignments</h1>
            <p className="subtitle">Manage staff assignments to courses</p>
          </div>

          <div className="header-right">
            <div className="admin-user">
              <div className="avatar">A</div>
              <div>
                <p className="user-name">Admin</p>
                <p className="user-role">System Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <div className="course-assignments-container">
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          <div className="assignments-header">
            <div>
              <h2>Assignments</h2>
              <p>Manage staff assignments to courses</p>
            </div>
            <button
              onClick={handleAddClick}
              disabled={loading}
              style={{
                padding: '10px 24px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: loading ? '#ccc' : '#3b82f6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              + New Assignment
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p>Loading assignments...</p>
            </div>
          ) : (
            <>
              <div className="assignments-filters">
                <input
                  type="text"
                  placeholder="Search by staff or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />

                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Roles</option>
                  <option value="doctor">Doctor</option>
                  <option value="ta">Teaching Assistant</option>
                </select>
              </div>

              {filteredAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                  <p>No assignments found</p>
                </div>
              ) : (
                <div className="assignments-table-wrapper">
                  <table className="assignments-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Staff Member</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Assigned Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td>
                            <div style={{ fontWeight: 500 }}>
                              {assignment.course?.name || assignment.courseName}
                            </div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {assignment.course?.code || assignment.courseCode}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>
                              {assignment.staff?.name || assignment.staffName}
                            </div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {assignment.staff?.email || assignment.staffEmail}
                            </div>
                          </td>
                          <td>
                            <RoleBadge role={assignment.role} />
                          </td>
                          <td>{assignment.department || '-'}</td>
                          <td>
                            <StatusBadge status={assignment.status} />
                          </td>
                          <td style={{ fontSize: 12, color: '#666' }}>
                            {new Date(assignment.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => handleEditClick(assignment)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #ddd',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(assignment)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  border: '1px solid #fecaca',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <AssignmentModal
            isOpen={isModalOpen}
            isEdit={isEdit}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleModalSubmit}
            assignment={selectedAssignment}
            courses={courses}
            staff={staff}
            loading={submitting}
            dataLoading={loading}
          />

          {confirmDelete && (
            <ConfirmModal
              isOpen={!!confirmDelete}
              title={confirmDelete.title}
              message={confirmDelete.message}
              onConfirm={confirmDelete.onConfirm}
              onCancel={() => setConfirmDelete(null)}
              confirmText="Remove"
              isDestructive={true}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default CourseAssignments;
