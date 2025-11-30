import { useEffect } from "react";
import { API_BASE_URL } from "../services/config";

function Dashboard() {
  useEffect(() => {
    console.log("API base URL:", API_BASE_URL);
  }, []);

  return (
    <div>
      <h1>Dashboard Page</h1>
      <p>API Base URL: {API_BASE_URL}</p>
    </div>
  );
}

export default Dashboard;
