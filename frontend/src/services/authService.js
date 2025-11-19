import { apiClient } from "./apiClient";


const LOGIN_URL = "/auth/signin";
const REGISTER_URL = "/auth/signup";
const ADMIN_LOGIN_URL = "/admin/signinAdmin";

async function loginUser(credentials) {

  if(credentials.email.toLowerCase().includes('@admin')){
    console.log("Admin login detected")
    const response = await apiClient.post(ADMIN_LOGIN_URL, credentials);
    return response.data;
  }

  console.log("user login detected")
  const response = await apiClient.post(LOGIN_URL, credentials);
  return response.data;
}

async function registerUser(data) {
  const response = await apiClient.post(REGISTER_URL, data);
  return response.data;
}

export{
  loginUser, registerUser
}