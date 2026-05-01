/**
 * Project-Specific Routes
 *
 * Add your project-specific routes here.
 * This file is NOT synced from template - it's owned by your project.
 *
 * Route formats:
 *   '/path': Component                              // Requires auth (default)
 *   '/path': { component: Component, public: true } // Public route
 *   '/admin/path': Component                        // Admin only (automatic)
 *
 * REMINDER: When adding a new route, consider if it should be added to:
 *   - navItems (bottom nav bar) in src/client/components/NavLinks.tsx
 *   - menuItems (hamburger menu) in src/client/components/NavLinks.tsx
 */

import { Routes } from '../features/template/router';
import { AIChat } from './project/AIChat';
import { Todos } from './project/Todos';
import { SingleTodo } from './project/SingleTodo';
import { Dashboard } from './project/Dashboard';
import { Debug } from './project/Debug';
import { Library } from './project/Library';
import { ExerciseEditor } from './project/ExerciseEditor';
import { PatternCalibration } from './project/PatternCalibration';
import { Session } from './project/Session';
import { AudioSettings } from './project/AudioSettings';

/**
 * Project route definitions.
 * These are merged with template routes in index.ts.
 */
export const projectRoutes: Routes = {
  // Breathing app
  '/': Library,
  '/exercise/new': ExerciseEditor,
  '/exercise/measure': PatternCalibration,
  '/exercise/:id': ExerciseEditor,
  '/session/:id': { component: Session, fullScreen: true },
  '/audio': AudioSettings,

  // Template demo routes (kept accessible via direct URL):
  '/ai-chat': AIChat,
  '/todos': Todos,
  '/todos/:todoId': SingleTodo,

  // Admin routes
  '/admin/dashboard': Dashboard,
  '/admin/debug': Debug,
};
