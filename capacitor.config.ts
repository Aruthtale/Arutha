import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aruthtale.arutha',
  appName: 'Arutha',
  webDir: 'dist',
  server: {
    url: 'https://URL-VERCEL-KAMU.vercel.app',
    cleartext: false
  },
  android: {
    backgroundColor: '#000000'
  }
}

export default config