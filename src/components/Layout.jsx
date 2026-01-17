import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
            <div className="md:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 p-4 md:p-8">
                    <div className="md:hidden mb-4">
                        <button
                            className="p-2 rounded-md border border-gray-200 text-gray-600"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
