import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  Users,
  MapPin,
  UserCog,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.customers'), href: '/customers', icon: Users },
    { name: t('nav.locations'), href: '/locations', icon: MapPin, adminOnly: true },
    { name: t('nav.users'), href: '/users', icon: UserCog, adminOnly: true },
    { name: t('nav.reports'), href: '/reports', icon: FileText },
    { name: t('nav.settings'), href: '/settings', icon: Settings, adminOnly: true },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex flex-col w-72 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between h-20 px-4 border-b border-white/10 bg-black/30">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur-md opacity-75"></div>
                <Package className="relative h-8 w-8 text-white mr-3" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">PickPoint</span>
                <p className="text-xs text-blue-300/70">Management</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-blue-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-item ${isActive ? 'active' : ''} ${
                    isActive
                      ? 'text-white'
                      : 'text-blue-100/70 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          {/* Bottom actions: language + logout (mobile) */}
          <div className="px-4 py-4 border-t border-white/10 bg-black/30">
            <div className="flex items-center justify-between">
              <button
                onClick={() => { toggleLanguage(); setSidebarOpen(false); }}
                className="flex items-center px-3 py-2 text-xs font-medium text-blue-100/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/10"
              >
                <Globe className="h-4 w-4 mr-2" />
                {i18n.language.toUpperCase()}
              </button>
              <button
                onClick={() => { handleLogout(); setSidebarOpen(false); }}
                className="flex items-center px-3 py-2 text-xs font-medium text-red-100/90 hover:text-white bg-red-600/20 hover:bg-red-600/30 rounded-lg"
                title={t('auth.logout')}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 overflow-y-auto shadow-2xl">
          <div className="flex items-center h-20 px-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur-md opacity-75"></div>
              <Package className="relative h-10 w-10 text-white mr-3" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">PickPoint</span>
              <p className="text-xs text-blue-300/70">Management System</p>
            </div>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item ${isActive ? 'active' : ''} ${
                    isActive
                      ? 'text-white'
                      : 'text-blue-100/70 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center px-3 py-2 text-xs font-medium text-blue-100/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/10"
              >
                <Globe className="h-4 w-4 mr-2" />
                {i18n.language.toUpperCase()}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-xs font-medium text-red-100/90 hover:text-white bg-red-600/20 hover:bg-red-600/30 rounded-lg"
                title={t('auth.logout')}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout')}
              </button>
            </div>
            <div className="text-xs text-blue-300/50 text-center">v1.0.0 • 2025</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 flex h-20 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
          <button
            type="button"
            className="px-4 text-gray-700 hover:text-indigo-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:outline-none lg:hidden transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex justify-between items-center px-6">
            <div className="flex-1" />
            
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 
                           bg-white/60 hover:bg-white rounded-xl border border-gray-200/50 
                           shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Globe className="h-5 w-5 mr-2" />
                {i18n.language.toUpperCase()}
              </button>
              
              <div className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
                <div className="flex items-center mr-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-2">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-600">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 
                             hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200"
                  title={t('auth.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
