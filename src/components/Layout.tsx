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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 bg-black/30">
            <div className="flex items-center">
              <Package className="h-7 w-7 text-blue-400 mr-2" />
              <span className="text-lg font-bold text-white">PickPoint</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-blue-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 py-4 border-b border-white/10 bg-black/20">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-blue-300">{user?.role}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

          <div className="px-4 py-4 border-t border-white/10 bg-black/30 space-y-2">
            <button
              onClick={() => { toggleLanguage(); }}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-100/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors"
            >
              <Globe className="h-4 w-4 mr-2" />
              {i18n.language.toUpperCase()}
            </button>
            <button
              onClick={() => { handleLogout(); setSidebarOpen(false); }}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-100/90 hover:text-white bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} z-40`}>
        <div className="flex flex-col flex-grow bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 shadow-2xl overflow-hidden relative">
          <div className={`flex items-center justify-between h-16 px-4 border-b border-white/10 bg-black/20 backdrop-blur-sm ${sidebarCollapsed ? 'px-2' : ''}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">PickPoint</span>
              </div>
            )}
            {sidebarCollapsed && (
              <Package className="h-8 w-8 text-blue-400 mx-auto" />
            )}
          </div>

          <div className={`px-4 py-4 border-b border-white/10 bg-black/20 ${sidebarCollapsed ? 'px-2' : ''}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-blue-300 truncate">{user?.role}</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <nav className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto ${sidebarCollapsed ? 'px-2' : ''}`}>
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
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <item.icon className={`h-5 w-5 relative z-10 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && <span className="relative z-10">{item.name}</span>}
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className={`px-4 py-4 border-t border-white/10 bg-black/20 space-y-2 ${sidebarCollapsed ? 'px-2' : ''}`}>
            {!sidebarCollapsed && (
              <>
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-100/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {i18n.language.toUpperCase()}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-100/90 hover:text-white bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('auth.logout')}
                </button>
              </>
            )}
            {sidebarCollapsed && (
              <>
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-center p-2 text-blue-100/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors"
                  title="Change Language"
                >
                  <Globe className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-2 text-red-100/90 hover:text-white bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                  title={t('auth.logout')}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Desktop Toggle Button - Outside Sidebar */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`hidden lg:block fixed top-24 bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50 border-2 border-white group ${
          sidebarCollapsed ? 'left-[60px]' : 'left-[244px]'
        }`}
        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />}
      </button>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-40">
          <button
            type="button"
            className="p-2 bg-white rounded-lg shadow-lg text-gray-700 hover:text-indigo-600 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="min-h-screen">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
