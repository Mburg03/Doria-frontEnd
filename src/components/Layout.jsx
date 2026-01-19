import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            <div className={clsx(
                "flex-1 flex flex-col min-h-screen transition-all duration-300",
                isCollapsed ? "md:pl-20" : "md:pl-64"
            )}>
                <main className="flex-1 p-4 md:p-8">
                    <div className="md:hidden mb-4">
                        <button
                            className="p-2 rounded-md border border-gray-200 text-gray-600"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
};

export default Layout;
