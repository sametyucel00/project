import { Linking, Platform } from "react-native";

export function openExternalUrl(url?: string) {
  if (!url) return;
  void Linking.openURL(url);
}

export function openPhoneNumber(phone?: string) {
  if (!phone) return;
  const normalized = phone.replace(/\s+/g, "");
  void Linking.openURL(`tel:${normalized}`);
}

export function openEmailAddress(email?: string) {
  if (!email) return;
  void Linking.openURL(`mailto:${email}`);
}

export function openAddressInMaps(address?: string) {
  if (!address) return;
  const query = encodeURIComponent(address);
  const url = Platform.select({
    ios: `http://maps.apple.com/?q=${query}`,
    android: `https://www.google.com/maps/search/?api=1&query=${query}`,
    default: `https://www.google.com/maps/search/?api=1&query=${query}`
  }) ?? `https://www.google.com/maps/search/?api=1&query=${query}`;
  void Linking.openURL(url);
}
