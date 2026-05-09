import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aruthtale.arutha',
  appName: 'Arutha',
  webDir: 'dist',
  android: {
    backgroundColor: '#FF000000'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#FF000000",
      androidScaleType: "CENTER_CROP"
    }
  }
}

export default config