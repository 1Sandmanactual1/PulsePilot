import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { NotificationMode } from "@/types/domain";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
}

export async function requestNotificationAccess(mode: NotificationMode) {
  if (mode !== "push" || Platform.OS === "web") {
    return;
  }

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    return;
  }

  await Notifications.requestPermissionsAsync();
}

export async function schedulePromptNotification(
  title: string,
  body: string,
  secondsFromNow: number,
  mode: NotificationMode
) {
  if (mode !== "push" || Platform.OS === "web") {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow
    }
  });
}
