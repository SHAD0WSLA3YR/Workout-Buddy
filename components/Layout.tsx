
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ChartBarIcon, UserCircleIcon, ViewGridIcon, ArrowLeftIcon } from './icons/Icons';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ViewGridIcon },
  { name: 'Performance', href: '/performance', icon: ChartBarIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

const Layout: React.FC = () => {
  const NavLinks = ({isMobile = false} : {isMobile?: boolean}) => (
    <>
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `flex items-center justify-center md:justify-start gap-3 p-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
              isActive
                ? 'bg-brand-primary text-white'
                : 'text-dark-text-secondary hover:bg-dark-card hover:text-dark-text-primary'
            } ${isMobile ? 'flex-col text-xs' : ''}`
          }
        >
          <item.icon className="h-6 w-6" />
          <span className={isMobile ? 'mt-1' : ''}>{item.name}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="flex h-screen w-full bg-dark-bg text-dark-text-primary">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-dark-bg border-r border-dark-border p-4 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <svg className="w-8 h-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
          </svg>
          <h1 className="text-xl font-bold">Calisthenics AI</h1>
        </div>
        <nav className="flex flex-col space-y-2 flex-grow">
          <NavLinks />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-28 md:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
            <Outlet />
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border grid grid-cols-3 gap-2 p-2">
        <NavLinks isMobile={true}/>
      </nav>
    </div>
  );
};


export default Layout;