import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Admin Home – University Management System</h1>

      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/facilities">Facilities</Link></li>
        </ul>
      </nav>
    </div>
  );
}

export default Home;
