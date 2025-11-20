import { apiClient } from "./apiClient";

const LOGIN_URL = "/auth/signin";
const REGISTER_URL = "/auth/signup";

async function loginUser(credentials) {
  // ALWAYS use /auth/signin – backend decides role (admin/student/doctor)
  const response = await apiClient.post(LOGIN_URL, credentials);
  return response.data;
}

async function registerUser(data) {
  const response = await apiClient.post(REGISTER_URL, data);
  return response.data;
}

export { loginUser, registerUser };
