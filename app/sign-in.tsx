import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect } from "expo-router";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { ToggleRow } from "@/components/ToggleRow";
import { useAuth } from "@/providers/AuthProvider";
import { colors, radius, spacing } from "@/theme/theme";

export default function SignInScreen() {
  const { session, signInWithEmail, signUpWithEmail, rememberEmail, savedEmail } = useAuth();
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(rememberEmail);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleSubmit() {
    const error =
      mode === "sign-in"
        ? await signInWithEmail(email.trim(), password, remember)
        : await signUpWithEmail(email.trim(), password);

    setErrorMessage(error);
  }

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="PulsePilot"
        title="Email sign-in with saved progress"
        description="Accounts are tied to email and password so your plan, check-ins, and profile can come back even if your phone is replaced."
      />

      <Card>
        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode("sign-in")} style={[styles.modeButton, mode === "sign-in" && styles.modeButtonActive]}>
            <Text style={[styles.modeText, mode === "sign-in" && styles.modeTextActive]}>Sign in</Text>
          </Pressable>
          <Pressable onPress={() => setMode("sign-up")} style={[styles.modeButton, mode === "sign-up" && styles.modeButtonActive]}>
            <Text style={[styles.modeText, mode === "sign-up" && styles.modeTextActive]}>Create account</Text>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        <ToggleRow
          description="Keep this device signed in and remember the email. The app uses a saved auth session rather than storing your raw password in plain text."
          label="Remember this device"
          onValueChange={setRemember}
          value={remember}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable onPress={handleSubmit} style={styles.submit}>
          <Text style={styles.submitText}>{mode === "sign-in" ? "Sign in to PulsePilot" : "Create PulsePilot account"}</Text>
        </Pressable>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flexDirection: "row",
    padding: 4
  },
  modeButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: 10
  },
  modeButtonActive: {
    backgroundColor: colors.card
  },
  modeText: {
    color: colors.muted,
    fontWeight: "700"
  },
  modeTextActive: {
    color: colors.text
  },
  fieldGroup: {
    gap: 8
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 14
  },
  error: {
    color: colors.danger,
    fontWeight: "600"
  },
  submit: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800"
  }
});
