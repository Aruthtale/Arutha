export const APP_CONFIG = {
  ADMIN_EMAILS: ['aruthtale@gmail.com'],
  SUPPORT_EMAIL: 'aruthtale@gmail.com',
  SYSTEM_SCHEME: 'com.aruthtale.arutha',
};

export const isAdmin = (email?: string | null) => {
  if (!email) return false;
  return APP_CONFIG.ADMIN_EMAILS.includes(email);
};
