/**
 * AppSidebar - Badge Counts Hook
 */
import { useState, useEffect } from 'react';
import dashboardService from '../../services/dashboard.service';
import { BadgeCounts } from './navConfig';

export function useBadgeCounts(): BadgeCounts {
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    pendingIncidents: 0,
    pendingIdeas: 0,
    pendingBookings: 0,
    unreadNews: 0,
  });

  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const summary = await dashboardService.getDashboardSummary();
        setBadgeCounts({
          pendingIncidents: summary.pending_incidents || 0,
          pendingIdeas: summary.pending_ideas || 0,
          pendingBookings: 0,
          unreadNews: 0,
        });
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    };

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return badgeCounts;
}

export function getBadgeCount(badgeCounts: BadgeCounts, badgeKey?: string): number {
  if (!badgeKey) return 0;
  return badgeCounts[badgeKey as keyof BadgeCounts] || 0;
}
