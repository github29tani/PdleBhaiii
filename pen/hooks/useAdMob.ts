import { useEffect, useState, ReactElement } from 'react';
import { Platform, View } from 'react-native';
import { useSettingsStore } from '@/store/settings-store';

// Types for AdMob components
interface BannerProps {
  style?: any;
  adUnitID: string;
  onDidFailToReceiveAdWithError: (error: BannerError) => void;
}

// Mock AdMob components for development
const AdMobBanner = ({ style, adUnitID, onDidFailToReceiveAdWithError }: BannerProps): ReactElement | null => null;
const AdMobInterstitial = {
  setAdUnitID: async (id: string) => {},
  requestAdAsync: async () => {},
  showAdAsync: async () => {},
};
const AdMobRewarded = {
  setAdUnitID: async (id: string) => {},
  requestAdAsync: async () => {},
  showAdAsync: async () => {},
};
const setTestDeviceIDAsync = async (id: string) => {};

export interface AdSettings {
  admobEnabled: boolean;
  bannerAdsEnabled: boolean;
  rewardedAdsEnabled: boolean;
  interstitialAdsEnabled: boolean;
  admobBannerId: string;
  admobRewardedId: string;
  admobInterstitialId: string;
  bannerRefreshRate: string;
  rewardedInterval: string;
  interstitialFrequency: string;
}

interface BannerError {
  message: string;
}

export function useAdMob() {
  const [screenCount, setScreenCount] = useState(0);
  const [lastRewardedTime, setLastRewardedTime] = useState(0);
  const { settings } = useSettingsStore();

  useEffect(() => {
    // Set up test device ID for development
    const setupTestDevice = async () => {
      if (__DEV__) {
        await setTestDeviceIDAsync('EMULATOR');
      }
    };
    setupTestDevice();
  }, []);

  const showBannerAd = (): ReactElement | null => {
    if (!settings.admobEnabled || !settings.bannerAdsEnabled) return null;

    const props: BannerProps = {
      style: { alignSelf: 'center' },
      adUnitID: settings.admobBannerId,
      onDidFailToReceiveAdWithError: (error: BannerError) => console.error(error.message)
    };

    return <AdMobBanner {...props} />;
  };

  const showInterstitialAd = async () => {
    if (!settings.admobEnabled || !settings.interstitialAdsEnabled) return;

    const frequency = parseInt(settings.interstitialFrequency, 10) || 5;
    setScreenCount((prev) => prev + 1);

    if (screenCount % frequency === 0) {
      try {
        await AdMobInterstitial.setAdUnitID(settings.admobInterstitialId);
        await AdMobInterstitial.requestAdAsync();
        await AdMobInterstitial.showAdAsync();
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
      }
    }
  };

  const showRewardedAd = async () => {
    if (!settings.admobEnabled || !settings.rewardedAdsEnabled) return false;

    const interval = parseInt(settings.rewardedInterval, 10) || 300;
    const now = Date.now();
    
    if (now - lastRewardedTime < interval * 1000) {
      return false;
    }

    try {
      await AdMobRewarded.setAdUnitID(settings.admobRewardedId);
      await AdMobRewarded.requestAdAsync();
      await AdMobRewarded.showAdAsync();
      setLastRewardedTime(now);
      return true;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      return false;
    }
  };

  return {
    showBannerAd,
    showInterstitialAd,
    showRewardedAd,
  };
}
