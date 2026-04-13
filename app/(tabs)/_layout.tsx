import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { Image, StyleSheet } from "react-native";

import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/theme/theme";

const settingsLogo = require("../../assets/pulse-pilot-emblem.png");

export default function TabsLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="pulse" size={size} />
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: "Training",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="barbell" size={size} />
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrition",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="nutrition" size={size} />
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="analytics" size={size} />
        }}
      />
      <Tabs.Screen
        name="check-ins"
        options={{
          title: "Check-Ins",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="chatbubble-ellipses" size={size} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Account",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={settingsLogo}
              style={[
                styles.logoIcon,
                {
                  height: size + 8,
                  opacity: focused ? 1 : 0.72,
                  width: size + 8
                }
              ]}
            />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoIcon: {
    borderRadius: 999,
    overflow: "hidden"
  }
});
