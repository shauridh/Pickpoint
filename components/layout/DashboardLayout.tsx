import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardPage from '../../pages/DashboardPage';
import ReportsPage from '../../pages/ReportsPage';
import SettingsPage from '../../pages/SettingsPage';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const DashboardLayout = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const { user } = useAuth();

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    const renderContent = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage />;
            case 'reports':
                return <ReportsPage />;
            case 'settings':
                 if (user?.role === UserRole.ADMIN || user?.role === UserRole.PETUGAS) {
                    return <SettingsPage />;
                }
                return <DashboardPage />; // fallback for unauthorized
            default:
                return <DashboardPage />;
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar currentPage={currentPage} setPage={setCurrentPage} isOpen={isSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;