import { Outlet } from "react-router-dom";
import NavBarLogged from "../components/NavBarLogged";

function StudentLayout() {
  return (
    <div className="app-root">
      <NavBarLogged/>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default StudentLayout;
