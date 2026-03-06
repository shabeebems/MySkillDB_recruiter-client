import { Toaster } from "react-hot-toast";
import { Outlet, useLocation } from "react-router-dom";
import Navigation from "../components/master-user/menu-navigation/Navigation";

const PATH_TO_PAGE_ID = {
  "/master/dashboard": "dashboard",
  "/master/location-manager": "location-manager",
  "/master/organization-setup": "organization-setup",
  "/master/organization-logins": "organization-logins",
};

const PATH_TO_HEADER = {
  "/master/dashboard": {
    title: "Master Dashboard",
    subtitle: "System Overview & Management",
  },
  "/master/location-manager": {
    title: "Location Data Management",
    subtitle: "Manage countries, states, districts, and syllabi",
  },
  "/master/organization-setup": {
    title: "Organization Class Setup",
    subtitle: "Departments, classes, sections & subjects",
  },
  "/master/organization-logins": {
    title: "Organization Login Manager",
    subtitle: "Create, edit and manage organization user logins",
  },
};

function MasterLayout() {
  const location = useLocation();
  const currentPage = PATH_TO_PAGE_ID[location.pathname] ?? "dashboard";
  const header =
    PATH_TO_HEADER[location.pathname] ?? PATH_TO_HEADER["/master/dashboard"];

  const handlePageChange = () => {};

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen">
      <Toaster position="top-right" />

      <Navigation currentPage={currentPage} onPageChange={handlePageChange} />

      <div className="lg:ml-72 pt-14 lg:pt-0">
        <main id="mainContent" className="flex-1 p-4 md:p-8 space-y-8">
          <header className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {header.title}
              </h1>
              <p className="text-slate-500 text-sm">{header.subtitle}</p>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MasterLayout;
