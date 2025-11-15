import { useEffect, useState } from "react";
import { getFacilities } from "../services/facilitiesService";

function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getFacilities();
        setFacilities(data);
      } catch (err) {
        setError("Could not load facilities (check backend is running).");
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <h1>Facilities Module</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {facilities.length === 0 && !error && <p>No facilities found.</p>}

      <ul>
        {facilities.map((f) => (
          <li key={f.id || f._id || f.name}>{f.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Facilities;
