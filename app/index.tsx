import { Redirect } from "expo-router";

import { useAuth } from "@/providers/AuthProvider";

export default function Index() {
  const { session } = useAuth();

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/sign-in" />;
}
