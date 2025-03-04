/**
 * Feature Flags Service
 * 
 * This service provides a centralized way to check if features are enabled or disabled
 * based on the configuration set in the ConfiguracionGeneral component.
 */

/**
 * Check if QR code generation is enabled
 */
export const isQrCodesEnabled = (): boolean => {
  return localStorage.getItem('qrCodesEnabled') !== 'false';
};

/**
 * Check if PDF generation is enabled
 */
export const isPdfGenerationEnabled = (): boolean => {
  return localStorage.getItem('pdfGenerationEnabled') !== 'false';
};

/**
 * Check if client search is enabled
 */
export const isClientSearchEnabled = (): boolean => {
  return localStorage.getItem('clientSearchEnabled') !== 'false';
};

/**
 * Check if log service is enabled
 */
export const isLogServiceEnabled = (): boolean => {
  return localStorage.getItem('logServiceEnabled') !== 'false';
};

/**
 * Check if reservas calendar is enabled
 */
export const isReservasCalendarEnabled = (): boolean => {
  return localStorage.getItem('reservasCalendarEnabled') !== 'false';
};

/**
 * Safe execution of a function if a feature is enabled
 * 
 * @param featureCheck Function that checks if the feature is enabled
 * @param fn Function to execute if the feature is enabled
 * @param fallback Optional fallback function to execute if the feature is disabled
 * @returns The result of fn if the feature is enabled, otherwise the result of fallback
 */
export const safeExecute = <T>(
  featureCheck: () => boolean,
  fn: () => T,
  fallback?: () => T
): T | undefined => {
  if (featureCheck()) {
    return fn();
  }
  return fallback ? fallback() : undefined;
};