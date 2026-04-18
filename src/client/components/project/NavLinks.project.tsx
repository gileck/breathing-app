/**
 * Project Navigation Items
 *
 * Define your project-specific navigation items here.
 * This file is NOT synced from template - it's owned by your project.
 */

import { NavItem } from '../template/layout/types';
import { Wind, Plus, Settings, Palette, Lightbulb, BarChart3, Bug } from 'lucide-react';

/** Project-specific admin menu items */
export const projectAdminMenuItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
  { path: '/admin/debug', label: 'Debug', icon: <Bug size={18} /> },
];

/** Bottom navigation bar items */
export const navItems: NavItem[] = [
  { path: '/', label: 'Library', icon: <Wind size={18} /> },
  { path: '/exercise/new', label: 'New', icon: <Plus size={18} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
];

/** Regular app menu items (non-admin) */
export const menuItems: NavItem[] = [
  { path: '/', label: 'Library', icon: <Wind size={18} /> },
  { path: '/exercise/new', label: 'New exercise', icon: <Plus size={18} /> },
  { path: '/my-requests', label: 'My Requests', icon: <Lightbulb size={18} /> },
  { path: '/theme', label: 'Theme', icon: <Palette size={18} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
];
