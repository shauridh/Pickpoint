import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { BarChart, Home, Settings, LogOut, Package, Star } from 'lucide-react';

interface SidebarProps {
    currentPage: string;
    setPage: (page: string) => void;
    isOpen: boolean;
}

// Fix: Add a specific type for navigation items to ensure type safety for icons, resolving the type error.
interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, isOpen }) => {
    const { user, logout } = useAuth();

    const navItems: NavItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: Home, roles: [UserRole.ADMIN, UserRole.PETUGAS] },
        { id: 'reports', label: 'Laporan', icon: BarChart, roles: [UserRole.ADMIN] },
        { id: 'subscription', label: 'Langganan', icon: Star, roles: [UserRole.ADMIN] },
        { id: 'settings', label: 'Setting', icon: Settings, roles: [UserRole.ADMIN, UserRole.PETUGAS] },
    ];
    
    const NavLink: React.FC<NavItem> = ({ id, label, icon: Icon }) => {
        const isActive = currentPage === id;
        return (
            <button
                onClick={() => setPage(id)}
                title={label}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-200 transform rounded-lg ${isOpen ? '' : 'justify-center'} ${
                    isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
                <Icon className="w-5 h-5" />
                <span className={`mx-4 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 sr-only'}`}>{label}</span>
            </button>
        );
    };

    return (
        <aside className={`flex-col bg-gray-800 text-gray-200 shadow-lg transition-all duration-300 ease-in-out hidden md:flex ${isOpen ? 'w-64' : 'w-20'}`}>
            <div className="flex items-center justify-center h-16 border-b border-gray-700 flex-shrink-0">
                 <Package className={`h-8 w-8 text-primary-500 transition-all duration-200 ${isOpen ? 'mr-2' : ''}`} />
                 <h1 className={`text-xl font-bold text-white transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 sr-only'}`}>Pickpoint</h1>
            </div>
            <div className="flex-1 p-2 overflow-y-auto mt-4">
                <nav className="space-y-2">
                    {navItems
                        .filter(item => user && item.roles.includes(user.role))
                        .map(item => (
                            <NavLink key={item.id} {...item} />
                        ))
                    }
                </nav>
            </div>
            <div className="p-2 border-t border-gray-700">
                 <button 
                    onClick={logout} 
                    title="Logout"
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 transition-colors duration-200 transform rounded-lg hover:bg-red-600 hover:text-white ${isOpen ? '' : 'justify-center'}`}>
                     <LogOut className="w-5 h-5" />
                     <span className={`mx-4 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 sr-only'}`}>Logout</span>
                 </button>
             </div>
        </aside>
    );
};

export default Sidebar;