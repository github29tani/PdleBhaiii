import { useEffect } from 'react';
import { useAdMob } from './useAdMob';

export function usePageTransitionAd() {
  const { showInterstitialAd } = useAdMob();

  useEffect(() => {
    // Show interstitial ad when component mounts (page change)
    showInterstitialAd();
  }, []); // Empty dependency array means this runs once per page change
}
