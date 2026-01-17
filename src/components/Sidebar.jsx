import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Settings,
  Package,
  LogOut,
  Loader2,
  X,
  Mail,
  Search,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const { logout, loggingOut, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Búsqueda general", icon: LayoutDashboard, path: "/" },
    { name: "Búsqueda por proveedor", icon: Search, path: "/provider-search" },
    { name: "Inteligencia de Datos", icon: TrendingUp, path: "/insights" },
    { name: "Mis paquetes", icon: Package, path: "/packages" },
    { name: "Gestionar cuentas", icon: Mail, path: "/accounts" },
  ];

  if (user?.role === "admin") {
    navItems.push({
      name: "Administración de usuarios",
      icon: LayoutDashboard,
      path: "/admin/users",
    });
  }

  const SidebarContent = (
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 mb-4 justify-between">
        <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 9-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-blue-600">Doria</span>
        </span>
        <button className="md:hidden p-1 text-gray-500" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              onClick={onClose}
            >
              <item.icon
                size={20}
                className={clsx(
                  "mr-3",
                  isActive ? "text-gray-500" : "text-gray-400"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-2">
          <Link
            to="/settings"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
            onClick={onClose}
          >
            <Settings size={20} className="mr-3 text-gray-400" />
            Ajustes
          </Link>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 size={18} className="mr-3 animate-spin" />
            ) : (
              <LogOut size={18} className="mr-3" />
            )}
            {loggingOut ? "Cerrando..." : "Salir"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 z-50">
        {SidebarContent}
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={onClose}></div>
          <div className="w-64 bg-white h-full shadow-lg">{SidebarContent}</div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
