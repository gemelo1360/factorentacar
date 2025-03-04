/**
 * Application Configuration
 * 
 * This file contains global configuration settings for the application.
 */

/**
 * Authentication Mode Configuration
 * 
 * When set to true, the application will require users to log in.
 * When set to false, the application will use a temporary user without login.
 * 
 * Default: false (development mode)
 */
export const PRODUCTION_MODE = false;

/**
 * Default Admin Credentials
 * 
 * These credentials are used for the default admin account in development mode.
 */
export const DEFAULT_ADMIN = {
  email: 'admin@admin.com',
  password: '123456789'
};