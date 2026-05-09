import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aruthtale.arutha',
  appName: 'Arutha',
  webDir: 'dist',
  server: {
    url: 'https://arutha.vercel.app',
    cleartext: false
  },
  android: {
    backgroundColor: '#ffffffff'
  }
}

export default config