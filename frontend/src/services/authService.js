import { apiClient } from "./apiClient";


const LOGIN_URL = "/student/signin";
const REGISTER_URL = "/student/signup";

export async function loginUser(credentials) {
  const response = await apiClient.post(LOGIN_URL, credentials);
  return response.data;
}

export async function registerUser(data) {
  const response = await apiClient.post(REGISTER_URL, data);
  return response.data;
}
