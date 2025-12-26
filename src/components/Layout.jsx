import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, ChevronDown, LogOut, Loader2, Menu } from 'lucide-react';
import { useState } from 'react';

const Header = ({ onOpenMobile }) => {
    const { user, logout, loggingOut } = useAuth();
    const [showMenu, setShowMenu] = useState(false);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
            {/* Left: mobile menu */}
            <div className="flex items-center gap-3">
                <button
                    className="md:hidden p-2 rounded-md border border-gray-200 text-gray-600"
                    onClick={onOpenMobile}
                >
                    <Menu size={18} />
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
                <button className="text-gray-400 hover:text-gray-600 relative">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white transform translate-x-1/2 -translate-y-1/3"></span>
                </button>

                <div className="h-6 w-px bg-gray-200"></div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors outline-none"
                    >
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D8ABC&color=fff`}
                            alt=""
                            className="h-8 w-8 rounded-full bg-gray-200 object-cover"
                        />
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                        </div>
                        <ChevronDown size={16} className="text-gray-400" />
                    </button>

                    {/* Dropdown */}
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 ring-1 ring-black ring-opacity-5 z-50">
                            <button
                                onClick={logout}
                                disabled={loggingOut}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                                {loggingOut ? <Loader2 size={16} className="mr-2 animate-spin" /> : <LogOut size={16} className="mr-2" />}
                                {loggingOut ? 'Cerrando...' : 'Sign out'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

const Layout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
            <div className="md:pl-64 flex flex-col min-h-screen">
                <Header onOpenMobile={() => setMobileOpen(true)} />
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
