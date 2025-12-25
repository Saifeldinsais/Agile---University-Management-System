import { Outlet } from "react-router-dom";
import NavBarDoctor from "../components/NavBarDoctor";

function DoctorLayout() {
  return (
    <div className="app-root">
      <NavBarDoctor/>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default DoctorLayout;
