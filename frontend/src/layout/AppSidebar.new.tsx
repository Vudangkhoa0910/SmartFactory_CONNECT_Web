/**
 * AppSidebar - Modularized Version
 */
import React from 'react';
import { Link } from 'react-router';
import { HorizontaLDots } from '../icons';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../contexts/AuthContext';
import {
  navItems,
  othersItems1,
  othersItems2,
  NavItem,
  useBadgeCounts,
  getBadgeCount as getBadgeCountFn,
  useSubmenuState,
  MenuItem,
} from './sidebar';

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { canManageUsers, canViewPinkBox } = useAuth();
  const badgeCounts = useBadgeCounts();
  const { openSubmenu, subMenuHeight, subMenuRefs, isActive, handleSubmenuToggle } = useSubmenuState();

  // Permission check
  const hasPermission = (item: NavItem): boolean => {
    if (!item.requiredPermission) return true;
    if (item.requiredPermission === 'manage_users') return canManageUsers();
    if (item.requiredPermission === 'pink_box') return canViewPinkBox();
    return true;
  };

  const getBadgeCount = (badgeKey?: string) => getBadgeCountFn(badgeCounts, badgeKey);

  // Render menu section
  const renderMenuItems = (items: NavItem[], menuType: 'main' | 'others1' | 'others2') => {
    const filteredItems = items.filter(hasPermission);
    
    return (
      <ul className="flex flex-col gap-4">
        {filteredItems.map((nav, index) => (
          <MenuItem
            key={nav.name}
            nav={nav}
            index={index}
            menuType={menuType}
            isExpanded={isExpanded}
            isHovered={isHovered}
            isMobileOpen={isMobileOpen}
            openSubmenu={openSubmenu}
            subMenuHeight={subMenuHeight}
            subMenuRefs={subMenuRefs}
            isActive={isActive}
            getBadgeCount={getBadgeCount}
            onSubmenuToggle={handleSubmenuToggle}
          />
        ))}
      </ul>
    );
  };

  const showContent = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? 'w-[290px]' : isHovered ? 'w-[290px]' : 'w-[90px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'}`}>
        <Link to="/" className="flex justify-center w-full">
          <img
            src="/images/logo/denso.svg"
            alt="DENSO Logo"
            className={showContent ? 'h-10 w-auto' : 'h-8 w-auto'}
          />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Main Menu */}
            <MenuSection title="Menu" showContent={showContent} isExpanded={isExpanded} isHovered={isHovered}>
              {renderMenuItems(navItems, 'main')}
            </MenuSection>

            {/* Incident Reports */}
            <MenuSection title="Báo cáo sự cố" showContent={showContent} isExpanded={isExpanded} isHovered={isHovered}>
              {renderMenuItems(othersItems1, 'others1')}
            </MenuSection>

            {/* Idea Box */}
            <MenuSection title="Hòm thư góp ý" showContent={showContent} isExpanded={isExpanded} isHovered={isHovered}>
              {renderMenuItems(othersItems2, 'others2')}
            </MenuSection>
          </div>
        </nav>
      </div>
    </aside>
  );
};

// Menu Section Component
const MenuSection: React.FC<{
  title: string;
  showContent: boolean;
  isExpanded: boolean;
  isHovered: boolean;
  children: React.ReactNode;
}> = ({ title, showContent, isExpanded, isHovered, children }) => (
  <div>
    <h2
      className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
        !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
      }`}
    >
      {showContent ? title : <HorizontaLDots className="size-6" />}
    </h2>
    {children}
  </div>
);

export default AppSidebar;
