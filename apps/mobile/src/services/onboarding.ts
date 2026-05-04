import AsyncStorage from "@react-native-async-storage/async-storage";

const onboardingKey = "narrehberi:mobile:onboarding-complete";

export async function getOnboardingCompleted() {
  try {
    return (await AsyncStorage.getItem(onboardingKey)) === "1";
  } catch {
    return false;
  }
}

export async function markOnboardingCompleted() {
  try {
    await AsyncStorage.setItem(onboardingKey, "1");
  } catch {
    // Local preference is best-effort only.
  }
}

export async function resetOnboardingState() {
  try {
    await AsyncStorage.removeItem(onboardingKey);
  } catch {
    // Best effort only.
  }
}
