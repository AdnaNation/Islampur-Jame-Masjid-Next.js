import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.islampurjamemasjid.app',
  appName: 'Islampur Jame Masjid',
  webDir: 'public',
  server: {
    // Points the native shell at your live deployment instead of bundling
    // static files. This is required because the app has server-side API
    // routes (app/api/**) and MongoDB access that only work when actually
    // deployed - a static export wouldn't include any of that.
    url: 'https://islampur-jame-masjid.vercel.app',
    cleartext: false,
  },
};

export default config;
