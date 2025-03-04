/**
 * QR Code Generator Utility
 * 
 * This utility provides functions to generate QR codes for various purposes
 * in the Facto Rent a Car application.
 */
import { isQrCodesEnabled } from './featureFlags';

/**
 * Generate a QR code URL using an external API service
 * 
 * @param data The data to encode in the QR code
 * @param size The size of the QR code in pixels (width x height)
 * @returns A URL to the generated QR code image
 */
export const generateQRCodeUrl = (data: string, size: number = 100): string => {
  // Check if QR codes are enabled
  if (!isQrCodesEnabled()) {
    console.log('QR code generation is disabled');
    // Return a placeholder image URL
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }

  // Use the QR Server API to generate a QR code
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
};

/**
 * Generate a QR code URL for a client code
 * 
 * @param clientCode The client code to encode
 * @param size The size of the QR code in pixels
 * @returns A URL to the generated QR code image
 */
export const generateClientQRCode = (clientCode: string, size: number = 100): string => {
  const url = `https://factorentacar.com/cliente/${clientCode}`;
  return generateQRCodeUrl(url, size);
};

/**
 * Generate a QR code URL for an order
 * 
 * @param orderNumber The order number to encode
 * @param size The size of the QR code in pixels
 * @returns A URL to the generated QR code image
 */
export const generateOrderQRCode = (orderNumber: string, size: number = 100): string => {
  const url = `https://factorentacar.com/orden/${orderNumber}`;
  return generateQRCodeUrl(url, size);
};