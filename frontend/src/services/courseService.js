import { apiClient } from "./apiClient";

const COURSES_URL = "/admin/courses";

export async function getCourses() {
  const res = await apiClient.get(COURSES_URL);
  return res.data.data;
}

export async function createCourse(payload) {
  const res = await apiClient.post(COURSES_URL, payload);
  return res.data.data.course;
}

export async function updateCourse(id, payload) {
  const res = await apiClient.patch(`${COURSES_URL}/${id}`, payload);
  return res.data.data;
}

export async function deleteCourse(id) {
  // backend returns updated list, but we'll just refetch after delete
  await apiClient.delete(`${COURSES_URL}/${id}`);
}
