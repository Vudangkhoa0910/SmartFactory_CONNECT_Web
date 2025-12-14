/**
 * AppSidebar - Submenu State Hook
 */
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { NavItem, navItems, othersItems1, othersItems2 } from './navConfig';

export type SubmenuState = {
  type: 'main' | 'others1' | 'others2';
  index: number;
} | null;

export function useSubmenuState() {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<SubmenuState>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = (path: string) => location.pathname === path;

  // Auto-open submenu based on current path
  useEffect(() => {
    let submenuMatched = false;
    const menuMapping = {
      main: navItems,
      others1: othersItems1,
      others2: othersItems2,
    };

    for (const menuType in menuMapping) {
      if (submenuMatched) break;
      const items = menuMapping[menuType as keyof typeof menuMapping];
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as 'main' | 'others1' | 'others2', index });
              submenuMatched = true;
            }
          });
        }
      });
    }

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location.pathname]);

  // Calculate submenu height when opened
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: 'main' | 'others1' | 'others2') => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return {
    openSubmenu,
    subMenuHeight,
    subMenuRefs,
    isActive,
    handleSubmenuToggle,
  };
}
