import { apiClient } from "./apiClient";


const CLASSROOMS_URL = "/admin/classrooms";

export async function getClassrooms() {
  const response = await apiClient.get(CLASSROOMS_URL);
  // backend returns { status, results, data: [ ...classrooms ] }
  return response.data.data;
}

export async function createClassroom(payload) {
  const response = await apiClient.post(CLASSROOMS_URL, payload);
  // backend returns { status: "success", data: { classroom } }
  return response.data.data.classroom;
}

export async function deleteClassroom(id) {
  await apiClient.delete(`${CLASSROOMS_URL}/${id}`);
}
