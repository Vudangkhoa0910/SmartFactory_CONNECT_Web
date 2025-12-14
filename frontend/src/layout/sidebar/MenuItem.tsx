/**
 * AppSidebar - Menu Item Component
 */
import React from 'react';
import { Link } from 'react-router';
import { ChevronDownIcon } from '../../icons';
import { NavItem } from './navConfig';
import { SubmenuState } from './useSubmenuState';

interface MenuItemProps {
  nav: NavItem;
  index: number;
  menuType: 'main' | 'others1' | 'others2';
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
  openSubmenu: SubmenuState;
  subMenuHeight: Record<string, number>;
  subMenuRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  isActive: (path: string) => boolean;
  getBadgeCount: (badgeKey?: string) => number;
  onSubmenuToggle: (index: number, menuType: 'main' | 'others1' | 'others2') => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  nav,
  index,
  menuType,
  isExpanded,
  isHovered,
  isMobileOpen,
  openSubmenu,
  subMenuHeight,
  subMenuRefs,
  isActive,
  getBadgeCount,
  onSubmenuToggle,
}) => {
  const showContent = isExpanded || isHovered || isMobileOpen;
  const isSubmenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
  const menuKey = `${menuType}-${index}`;

  if (nav.subItems) {
    return (
      <li>
        <SubmenuButton
          nav={nav}
          showContent={showContent}
          isSubmenuOpen={isSubmenuOpen}
          getBadgeCount={getBadgeCount}
          isExpanded={isExpanded}
          isHovered={isHovered}
          isMobileOpen={isMobileOpen}
          onClick={() => onSubmenuToggle(index, menuType)}
        />
        {showContent && (
          <SubmenuItems
            nav={nav}
            menuKey={menuKey}
            isSubmenuOpen={isSubmenuOpen}
            subMenuHeight={subMenuHeight}
            subMenuRefs={subMenuRefs}
            isActive={isActive}
          />
        )}
      </li>
    );
  }

  if (nav.path) {
    return (
      <li>
        <DirectLink
          nav={nav}
          showContent={showContent}
          isActive={isActive(nav.path)}
          getBadgeCount={getBadgeCount}
          isExpanded={isExpanded}
          isHovered={isHovered}
          isMobileOpen={isMobileOpen}
        />
      </li>
    );
  }

  return null;
};

// Submenu Button Component
const SubmenuButton: React.FC<{
  nav: NavItem;
  showContent: boolean;
  isSubmenuOpen: boolean;
  getBadgeCount: (badgeKey?: string) => number;
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
  onClick: () => void;
}> = ({ nav, showContent, isSubmenuOpen, getBadgeCount, isExpanded, isHovered, isMobileOpen, onClick }) => (
  <button
    onClick={onClick}
    className={`menu-item group ${isSubmenuOpen ? 'menu-item-active' : 'menu-item-inactive'} cursor-pointer ${
      !isExpanded && !isHovered ? 'lg:justify-center' : 'lg:justify-start'
    }`}
  >
    <span className={`menu-item-icon-size relative ${isSubmenuOpen ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}>
      {nav.icon}
      <CollapsedBadge show={!isExpanded && !isHovered && !isMobileOpen} count={getBadgeCount(nav.badgeKey)} />
    </span>
    {showContent && <span className="menu-item-text">{nav.name}</span>}
    <ExpandedBadge show={showContent} count={getBadgeCount(nav.badgeKey)} />
    {showContent && (
      <ChevronDownIcon className={`ml-auto w-5 h-5 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180 text-brand-500' : ''}`} />
    )}
  </button>
);

// Direct Link Component
const DirectLink: React.FC<{
  nav: NavItem;
  showContent: boolean;
  isActive: boolean;
  getBadgeCount: (badgeKey?: string) => number;
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
}> = ({ nav, showContent, isActive, getBadgeCount, isExpanded, isHovered, isMobileOpen }) => (
  <Link
    to={nav.path!}
    className={`menu-item group ${isActive ? 'menu-item-active' : 'menu-item-inactive'}`}
  >
    <span className={`menu-item-icon-size relative ${isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}>
      {nav.icon}
      <CollapsedBadge show={!isExpanded && !isHovered && !isMobileOpen} count={getBadgeCount(nav.badgeKey)} />
    </span>
    {showContent && <span className="menu-item-text">{nav.name}</span>}
    <ExpandedBadge show={showContent} count={getBadgeCount(nav.badgeKey)} position="ml-auto" />
  </Link>
);

// Submenu Items Component
const SubmenuItems: React.FC<{
  nav: NavItem;
  menuKey: string;
  isSubmenuOpen: boolean;
  subMenuHeight: Record<string, number>;
  subMenuRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  isActive: (path: string) => boolean;
}> = ({ nav, menuKey, isSubmenuOpen, subMenuHeight, subMenuRefs, isActive }) => (
  <div
    ref={(el) => { subMenuRefs.current[menuKey] = el; }}
    className="overflow-hidden transition-all duration-300"
    style={{ height: isSubmenuOpen ? `${subMenuHeight[menuKey]}px` : '0px' }}
  >
    <ul className="mt-2 space-y-1 ml-9">
      {nav.subItems!.map((subItem) => (
        <li key={subItem.name}>
          <Link
            to={subItem.path}
            className={`menu-dropdown-item ${isActive(subItem.path) ? 'menu-dropdown-item-active' : 'menu-dropdown-item-inactive'}`}
          >
            {subItem.name}
            <span className="flex items-center gap-1 ml-auto">
              {subItem.new && (
                <span className={`ml-auto ${isActive(subItem.path) ? 'menu-dropdown-badge-active' : 'menu-dropdown-badge-inactive'} menu-dropdown-badge`}>
                  new
                </span>
              )}
              {subItem.pro && (
                <span className={`ml-auto ${isActive(subItem.path) ? 'menu-dropdown-badge-active' : 'menu-dropdown-badge-inactive'} menu-dropdown-badge`}>
                  pro
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

// Badge Components
const CollapsedBadge: React.FC<{ show: boolean; count: number }> = ({ show, count }) => {
  if (!show || count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
      {count > 9 ? '9+' : count}
    </span>
  );
};

const ExpandedBadge: React.FC<{ show: boolean; count: number; position?: string }> = ({ show, count, position = 'ml-2' }) => {
  if (!show || count <= 0) return null;
  return (
    <span className={`${position} px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full ${position === 'ml-2' ? 'animate-pulse' : ''}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default MenuItem;
