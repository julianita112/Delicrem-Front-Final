import PropTypes from "prop-types";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { XMarkIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { Button, IconButton, Typography } from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { useAuth } from "@/context/authContext";
import allRoutes, { filterRoutes } from "@/routes";

export function Sidenav({ brandImg, brandName }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const { permissions, logout } = useAuth();
  const routes = filterRoutes(allRoutes, permissions);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/sign-in");
  };

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };
  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${
        openSidenav ? "translate-x-0" : "-translate-x-0"
      } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 xl:translate-x-0 border border-blue-gray-100`}
    >


      <div className={`relative`}>
        <div className="py-6 px-8 text-center">
          <img src="/img/delicremlogo.png" alt="Logo" className="mx-auto mb-1" style={{ width: '230px' }} />
        </div>
      </div>

      <div className="m-4 h-[calc(125vh-400px)] overflow-y-auto">
        {routes
          .filter(route => route.visible !== false) // Filtrar las rutas no visibles
          .map(({ layout, title, pages }, key) => (
            <ul key={key} className="mb-4 flex flex-col gap-1">
              {title && (
                <li className="mx-3.5 mt-4 mb-2">
                  <Typography
                    variant="small"
                    color={sidenavType === "dark" ? "white" : "blue-gray"}
                    className="font-black uppercase opacity-75"
                  >
                    {title}
                  </Typography>
                </li>
              )}
              
              {pages.map(({ icon, name, path }) => (
                <li key={name}>
                  <NavLink to={`/${layout}${path}`}>
                    {({ isActive }) => (
                      <Button variant={isActive ? "gradient" : "text"} color={
                          isActive
                            ? sidenavColor
                            : sidenavType === "dark"
                            ? "white"
                            : "blue-gray"
                        }
                        className={`flex items-center gap-4 px-4 capitalize transition-all duration-300 ease-in-out transform ${
                          isActive
                            ? "scale-95"
                            : "hover:scale-100"
                        }`}
                        fullWidth
                      >
                        {icon}
                        <Typography
                          color="inherit"
                          className="font-medium capitalize"
                        >
                          {name}
                        </Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          ))}
      </div>
      <div className="m-4">
        <Button variant="text"
          color={sidenavType === "dark" ? "white" : "blue-gray"}
          className="flex items-center gap-4 px-4 capitalize transition-all duration-300 ease-in-out transform hover:scale-100"
          fullWidth
          onClick={handleLogout}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <Typography color="inherit" className="font-medium capitalize">
            Cerrar Sesión
          </Typography>
        </Button>
      </div>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/delicremlogo.png",
  brandName: "DelicRem",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidnave.jsx";

export default Sidenav;