import { apiClient } from "./apiClient";

export async function getFacilities() {
  const response = await apiClient.get("/facilities");
  return response.data;
}
