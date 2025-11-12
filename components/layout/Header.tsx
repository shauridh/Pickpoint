import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircle, Menu } from 'lucide-react';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    const { user } = useAuth();

    return (
        <header className="flex items-center justify-between h-16 px-6 bg-white shadow-sm flex-shrink-0">
             <div className="flex items-center">
                <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800 ml-4 hidden sm:block">Selamat Datang!</h2>
            </div>
            <div className="flex items-center">
                <div className="text-right mr-4">
                    <p className="font-semibold text-gray-700">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.role}</p>
                </div>
                <UserCircle className="w-10 h-10 text-primary-500" />
            </div>
        </header>
    );
};

export default Header;