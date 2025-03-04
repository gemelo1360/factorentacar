/**
 * Log Service
 * 
 * This service handles logging of system activities for auditing and debugging purposes.
 */
import { isLogServiceEnabled } from './featureFlags';

interface LogEntry {
  timestamp: string;
  type: string;
  action: string;
  details?: any;
  user?: string;
}

/**
 * Log an action in the system
 * 
 * @param type The type of action (e.g., 'CLIENTE', 'ORDEN', 'CONFIGURACION')
 * @param action A description of the action
 * @param details Optional details about the action
 * @param user Optional user who performed the action
 */
export const logAction = (
  type: string,
  action: string,
  details?: any,
  user?: string
): void => {
  // Skip logging if the log service is disabled
  if (!isLogServiceEnabled()) {
    console.log('Log service is disabled. Skipping log entry:', { type, action, details });
    return;
  }

  try {
    // Get existing log from localStorage
    const existingLog = localStorage.getItem('systemLog');
    const logEntries: LogEntry[] = existingLog ? JSON.parse(existingLog) : [];
    
    // Create new log entry
    const newEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      action,
      ...(details && { details }),
      ...(user && { user })
    };
    
    // Add new entry to log
    logEntries.push(newEntry);
    
    // Limit log size to prevent localStorage overflow (keep last 1000 entries)
    const trimmedLog = logEntries.slice(-1000);
    
    // Save updated log to localStorage
    localStorage.setItem('systemLog', JSON.stringify(trimmedLog));
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

/**
 * Get the system log
 * 
 * @returns Array of log entries
 */
export const getSystemLog = (): LogEntry[] => {
  try {
    const logData = localStorage.getItem('systemLog');
    return logData ? JSON.parse(logData) : [];
  } catch (error) {
    console.error('Error getting system log:', error);
    return [];
  }
};

/**
 * Clear the system log
 */
export const clearSystemLog = (): void => {
  try {
    localStorage.setItem('systemLog', '[]');
  } catch (error) {
    console.error('Error clearing system log:', error);
  }
};

/**
 * Filter log entries by type
 * 
 * @param type The type of log entries to filter
 * @returns Filtered log entries
 */
export const filterLogByType = (type: string): LogEntry[] => {
  const allLogs = getSystemLog();
  return allLogs.filter(entry => entry.type === type);
};

/**
 * Filter log entries by date range
 * 
 * @param startDate Start date for filtering
 * @param endDate End date for filtering
 * @returns Filtered log entries
 */
export const filterLogByDateRange = (startDate: Date, endDate: Date): LogEntry[] => {
  const allLogs = getSystemLog();
  return allLogs.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= startDate && entryDate <= endDate;
  });
};