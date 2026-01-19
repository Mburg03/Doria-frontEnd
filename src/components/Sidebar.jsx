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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const Sidebar = ({ mobileOpen = false, onClose = () => { }, isCollapsed = false, setIsCollapsed = () => { } }) => {
  const { logout, loggingOut, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Búsqueda", icon: LayoutDashboard, path: "/" },
    { name: "Insights", icon: TrendingUp, path: "/insights" },
    { name: "Paquetes", icon: Package, path: "/packages" },
    { name: "Cuentas", icon: Mail, path: "/accounts" },
  ];

  if (user?.role === "admin") {
    navItems.push({
      name: "Usuarios",
      icon: LayoutDashboard,
      path: "/admin/users",
    });
  }

  const SidebarContent = (
    <div className={clsx(
      "h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={clsx(
        "h-16 flex items-center border-b border-gray-100 mb-4",
        isCollapsed ? "justify-center" : "px-6 justify-between"
      )}>
        <span className={clsx("flex items-center gap-2", isCollapsed && "justify-center")}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
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
          {!isCollapsed && <span className="text-blue-600 font-bold transition-opacity duration-300">Doria</span>}
        </span>
        <button className="md:hidden p-1 text-gray-500" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Toggle Button for Desktop - Only shown when NOT collapsed for cleaner look as requested? 
            Wait, user said "place it somewhere else". If collapsed, it needs to be accessible to expand.
            I'll keep it but ensure it's centered if collapsed.
        */}
      </div>

      <div className="flex-1 px-3 space-y-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : ""}
              className={clsx(
                "flex items-center px-4 py-2 text-sm transition-all relative group",
                isActive
                  ? "text-gray-900 font-bold"
                  : "text-gray-500 font-medium hover:text-gray-900",
                isCollapsed && "justify-center px-0"
              )}
              onClick={onClose}
            >
              <item.icon
                size={18}
                className={clsx(
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
                  !isCollapsed && "mr-3"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {isActive && !isCollapsed && (
                <div className="absolute right-0 w-1 h-4 bg-blue-600 rounded-l-full" />
              )}
            </Link>
          );
        })}
      </div>

      <div className={clsx("p-4 border-t border-gray-100 transition-all", isCollapsed && "px-2")}>
        <div className="space-y-3">
          <div className={clsx("flex items-center", isCollapsed ? "justify-center" : "gap-3 px-3 py-2")}>
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
              {(user?.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Usuario'}
              </div>
            )}
          </div>
          <Link
            to="/settings"
            title={isCollapsed ? "Ajustes" : ""}
            className={clsx(
              "flex items-center text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-all",
              isCollapsed ? "justify-center py-2" : "px-3 py-2"
            )}
            onClick={onClose}
          >
            <Settings size={20} className={clsx(isCollapsed ? "" : "mr-3", "text-gray-400")} />
            {!isCollapsed && <span>Ajustes</span>}
          </Link>
          <button
            onClick={logout}
            disabled={loggingOut}
            title={isCollapsed ? "Salir" : ""}
            className={clsx(
              "flex items-center w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-60",
              isCollapsed ? "justify-center py-2" : "px-3 py-2"
            )}
          >
            {loggingOut ? (
              <Loader2 size={18} className={clsx(isCollapsed ? "" : "mr-3", "animate-spin")} />
            ) : (
              <LogOut size={18} className={clsx(isCollapsed ? "" : "mr-3")} />
            )}
            {!isCollapsed && <span>{loggingOut ? "Cerrando..." : "Salir"}</span>}
          </button>

          {/* Toggle Button for Desktop (Footer) */}
          {!mobileOpen && (
            <div className="pt-2 border-t border-gray-50 mt-2">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={clsx(
                  "hidden md:flex items-center w-full transition-all duration-300 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600",
                  isCollapsed ? "justify-center py-2" : "px-3 py-2"
                )}
                title={isCollapsed ? "Expandir menú" : "Contraer menú"}
              >
                {isCollapsed ? <ChevronRight size={18} /> : (
                  <>
                    <ChevronLeft size={18} className="mr-3" />
                    <span className="text-sm font-medium">Contraer</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={clsx(
        "hidden md:flex fixed left-0 top-0 h-screen z-50 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
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
