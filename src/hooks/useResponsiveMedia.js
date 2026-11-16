import { useGlobalStore } from "@/stores/global";

export function pickMedia(media, isMobileLayout) {
  return (isMobileLayout && media?.mobile?.url && media.mobile) || media;
}

export default function useResponsiveMedia(media) {
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  return pickMedia(media, isMobileLayout);
}
