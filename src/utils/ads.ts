import { TestIds } from 'react-native-google-mobile-ads';

// Configuration for Ad Unit IDs (Banner, Interstitial, Rewarded)
// Automatically uses Google Test Unit IDs in __DEV__ environment or falls back to Test Unit IDs if production keys are not set.
export const AD_UNITS = {
  banner: __DEV__ ? TestIds.BANNER : (process.env.EXPO_PUBLIC_BANNER_AD_UNIT_ID || TestIds.BANNER),
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : (process.env.EXPO_PUBLIC_OPENING_AD_UNIT_ID || TestIds.INTERSTITIAL),
  rewarded: __DEV__ ? TestIds.REWARDED : (process.env.EXPO_PUBLIC_REWARDED_AD_UNIT_ID || TestIds.REWARDED),
};

