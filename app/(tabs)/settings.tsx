import React, { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { ToggleRow } from "@/components/ToggleRow";
import { requestNotificationAccess } from "@/lib/notifications";
import { useAuth } from "@/providers/AuthProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { NotificationMode } from "@/types/domain";
import { colors, radius, spacing } from "@/theme/theme";

const modes: NotificationMode[] = ["off", "in-app", "push"];
const providerContent = {
  garmin: {
    title: "Sync Garmin account",
    body: "PulsePilot is set up to become the hub for Garmin-linked recovery, sleep, readiness, and activity data. The final Garmin sign-in redirect needs Garmin developer approval and issued OAuth credentials.",
    nextSteps: [
      "Apply to the Garmin Connect developer program.",
      "Receive the client credentials and approved redirect URL requirements.",
      "Wire the real Garmin OAuth redirect into this handoff screen.",
      "Turn on field-level sync rules for Garmin-owned metrics."
    ],
    status: "Waiting for Garmin developer approval and OAuth credentials."
  },
  myfitnesspal: {
    title: "PulsePilot nutrition is built in",
    body: "PulsePilot now owns food logging, macro targets, saved foods, saved meals, and weight tracking directly. External MyFitnessPal sync is no longer required for the core nutrition workflow.",
    nextSteps: [
      "Use the Nutrition tab to log foods and edit calorie/macro targets directly.",
      "Save favorite foods and meals for quick logging.",
      "Track body weight inside PulsePilot instead of relying on MyFitnessPal.",
      "Add barcode scan, meal scan, and recipe import as native PulsePilot features next."
    ],
    status: "PulsePilot nutrition is active now. No MyFitnessPal sign-in is required."
  }
} as const;

export default function SettingsScreen() {
  const { preferences, updatePreferences, markIntegrationConnected, recordFitNotesImport, profile, updateProfile, fitNotesImports } = useAppState();
  const { signOut } = useAuth();
  const [hydrationTime, setHydrationTime] = useState(preferences.hydration.reminderTime);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [fullName, setFullName] = useState(profile.fullName);
  const [age, setAge] = useState(String(profile.age));
  const [weight, setWeight] = useState(String(profile.currentWeightLb));
  const [providerModal, setProviderModal] = useState<null | "garmin" | "myfitnesspal">(null);
  const fitNotesInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFullName(profile.fullName);
    setAge(String(profile.age));
    setWeight(String(profile.currentWeightLb));
  }, [profile.fullName, profile.age, profile.currentWeightLb]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setStatusMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [statusMessage]);

  async function setHydrationMode(mode: NotificationMode) {
    const next = {
      ...preferences,
      hydration: {
        ...preferences.hydration,
        enabled: mode !== "off",
        mode
      }
    };
    await updatePreferences(next);
    await requestNotificationAccess(mode);
  }

  async function setWeeklyMode(mode: NotificationMode) {
    const next = {
      ...preferences,
      weeklyCheckIns: {
        ...preferences.weeklyCheckIns,
        enabled: mode !== "off",
        mode
      }
    };
    await updatePreferences(next);
  }

  async function handleGarminConnect() {
    setStatusTone("success");
    setStatusMessage("Garmin sync request saved. PulsePilot is ready for the Garmin sign-in redirect once Garmin partner/API credentials are approved.");
    await markIntegrationConnected("garmin", "Connection request started. Waiting for Garmin partner/API credentials.");
  }

  async function handleMyFitnessPalConnect() {
    setStatusTone("success");
    setStatusMessage("PulsePilot nutrition is already active. Use the Nutrition tab for food logging, targets, saved foods, saved meals, and weight tracking.");
    await markIntegrationConnected("myfitnesspal", "PulsePilot nutrition is active now. No MyFitnessPal sign-in is required.");
  }

  function openFitNotesPicker() {
    fitNotesInputRef.current?.click();
  }

  async function handleFitNotesFile(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const rowCount = text.split(/\r?\n/).filter((line) => line.trim().length > 0).length - 1;
      await recordFitNotesImport(file.name, text);
      setStatusTone("success");
      setStatusMessage(`Updates saved successfully. Imported FitNotes file "${file.name}" with ${Math.max(rowCount, 0)} data rows.`);
      if (fitNotesInputRef.current) {
        fitNotesInputRef.current.value = "";
      }
    } catch {
      setStatusTone("error");
      setStatusMessage("Updates were not saved successfully. FitNotes import failed.");
    }
  }

  async function handleSaveProfile() {
    const nextAge = Number(age);
    const nextWeight = Number(weight);
    const nextProfile = {
      ...profile,
      fullName: fullName.trim() || profile.fullName,
      age: Number.isFinite(nextAge) ? nextAge : profile.age,
      currentWeightLb: Number.isFinite(nextWeight) ? nextWeight : profile.currentWeightLb
    };
    try {
      await updateProfile(nextProfile);
      setStatusTone("success");
      setStatusMessage(`Updates saved successfully. Profile saved to PulsePilot for ${nextProfile.fullName}.`);
    } catch {
      setStatusTone("error");
      setStatusMessage("Updates were not saved successfully. Please try saving your profile again.");
    }
  }

  return (
    <ScreenContainer>
      <Modal animationType="fade" transparent visible={providerModal !== null}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>{providerModal ? providerContent[providerModal].title : ""}</Text>
            <Text style={styles.helper}>{providerModal ? providerContent[providerModal].body : ""}</Text>
            <Text style={styles.integrationDetail}>{providerModal ? providerContent[providerModal].status : ""}</Text>
            <View style={styles.modalStepList}>
              {providerModal
                ? providerContent[providerModal].nextSteps.map((step, index) => (
                    <Text key={step} style={styles.modalStep}>
                      {index + 1}. {step}
                    </Text>
                  ))
                : null}
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={async () => {
                  if (providerModal === "garmin") {
                    await handleGarminConnect();
                  }
                  if (providerModal === "myfitnesspal") {
                    await handleMyFitnessPalConnect();
                  }
                  setProviderModal(null);
                }}
                style={styles.integrationAction}
              >
                <Text style={styles.integrationActionText}>Save sync request</Text>
              </Pressable>
              <Pressable onPress={() => setProviderModal(null)} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {statusMessage ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={[styles.toast, statusTone === "error" ? styles.toastError : styles.toastSuccess]}>
            <Text style={styles.toastText}>{statusMessage}</Text>
          </View>
        </View>
      ) : null}
      <SectionHeader
        eyebrow="Settings"
        title="Prompt controls, reminders, and account session"
        description="Prompts can be fully off, in-app only, or shown as popup notifications when the app is not open. PulsePilot is designed to be your main hub, then sync matching updates into connected apps where provider support allows it."
      />

      <Card>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.helper}>This is the basic account profile PulsePilot keeps with your email-linked account. PulsePilot should be the main place you edit shared profile values like age and current weight.</Text>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          onChangeText={setFullName}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={fullName}
        />
        <Text style={styles.label}>Age</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={setAge}
          placeholder="34"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={age}
        />
        <Text style={styles.label}>Current weight (lb)</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={setWeight}
          placeholder="198.6"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={weight}
        />
        <Pressable onPress={handleSaveProfile} style={styles.integrationAction}>
          <Text style={styles.integrationActionText}>Save profile</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Connections</Text>
        <Text style={styles.helper}>This is where PulsePilot links Garmin Connect and FitNotes, while owning nutrition directly inside the app. Garmin still needs approved partner/API access for full live sync. FitNotes is designed to start with export/import.</Text>
        {Object.values(preferences.integrations).map((integration) => (
          <View key={integration.key} style={styles.integrationCard}>
            <Text style={styles.integrationTitle}>{integration.label}</Text>
            <Pill
              label={
                integration.status === "partner-required"
                  ? "Partner/API setup needed"
                  : integration.status === "needs-import"
                    ? "Import-based setup"
                    : integration.status
              }
              tone={integration.status === "connected" ? "success" : "accent"}
            />
            <Text style={styles.helper}>{integration.description}</Text>
            <Text style={styles.integrationDetail}>{integration.detail}</Text>
            {integration.key === "garmin" ? (
              <Pressable onPress={() => setProviderModal("garmin")} style={styles.integrationAction}>
                <Text style={styles.integrationActionText}>Sync Garmin account</Text>
              </Pressable>
            ) : null}
            {integration.key === "myfitnesspal" ? (
              <Pressable onPress={() => setProviderModal("myfitnesspal")} style={styles.integrationAction}>
                <Text style={styles.integrationActionText}>View nutrition hub plan</Text>
              </Pressable>
            ) : null}
            {integration.key === "fitnotes" ? (
              <>
                <Pressable onPress={openFitNotesPicker} style={styles.integrationAction}>
                  <Text style={styles.integrationActionText}>Import FitNotes CSV</Text>
                </Pressable>
                {Platform.OS === "web"
                  ? React.createElement("input", {
                      accept: ".csv,text/csv",
                      onChange: (event: { target: { files?: FileList | null } }) =>
                        handleFitNotesFile(event.target.files?.[0] ?? null),
                      ref: fitNotesInputRef,
                      style: { display: "none" },
                      type: "file"
                    })
                  : null}
              </>
            ) : null}
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Sync rules</Text>
        <Text style={styles.helper}>These rules define which app is authoritative for each kind of data and whether PulsePilot can write changes back out.</Text>
        {preferences.syncRules.map((rule) => (
          <View key={rule.id} style={styles.integrationCard}>
            <Text style={styles.integrationTitle}>{rule.fieldLabel}</Text>
            <View style={styles.rulePills}>
              <Pill
                label={
                  rule.authority === "pulsepilot"
                    ? "PulsePilot owned"
                    : rule.authority === "provider"
                      ? "Provider owned"
                      : rule.authority === "two-way"
                        ? "Two-way"
                        : "Import-first"
                }
                tone={rule.authority === "provider" ? "accent" : "success"}
              />
              <Pill
                label={
                  rule.writeback === "supported"
                    ? "Write-back supported"
                    : rule.writeback === "planned"
                      ? "Write-back planned"
                      : "Read-only from provider"
                }
              />
            </View>
            <Text style={styles.helper}>{rule.pulsePilotBehavior}</Text>
            <Text style={styles.integrationDetail}>{rule.providerBehavior}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Recent FitNotes imports</Text>
        <Text style={styles.helper}>PulsePilot keeps the last imported files so you can confirm they were stored on your account.</Text>
        {fitNotesImports.length === 0 ? (
          <Text style={styles.helper}>No FitNotes imports saved yet.</Text>
        ) : (
          fitNotesImports.map((item) => (
            <View key={item.id} style={styles.importRow}>
              <View style={styles.importCopy}>
                <Text style={styles.integrationTitle}>{item.sourceFileName}</Text>
                <Text style={styles.helper}>{new Date(item.importedAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.integrationDetail}>{item.rowCount} rows</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Hydration prompt behavior</Text>
        <ToggleRow
          description="Turn the water check-in on or off."
          label="Enable hydration prompts"
          onValueChange={async (value) =>
            updatePreferences({
              ...preferences,
              hydration: { ...preferences.hydration, enabled: value, mode: value ? preferences.hydration.mode : "off" }
            })
          }
          value={preferences.hydration.enabled}
        />
        <Text style={styles.label}>Reminder time</Text>
        <TextInput
          onChangeText={setHydrationTime}
          onEndEditing={async () =>
            updatePreferences({
              ...preferences,
              hydration: { ...preferences.hydration, reminderTime: hydrationTime }
            })
          }
          placeholder="13:00"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={hydrationTime}
        />
        <Text style={styles.label}>Prompt mode</Text>
        <Text style={styles.helper}>Choose whether prompts stay inside the app or show as popup notifications too.</Text>
        {modes.map((mode) => (
          <Pressable key={mode} onPress={() => setHydrationMode(mode)} style={[styles.modeChip, preferences.hydration.mode === mode && styles.modeChipActive]}>
            <Text style={[styles.modeChipText, preferences.hydration.mode === mode && styles.modeChipTextActive]}>{mode}</Text>
          </Pressable>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Weekly strength check-ins</Text>
        <ToggleRow
          description="Ask at the start and end of the week if you feel stronger, the same, or weaker."
          label="Enable weekly check-ins"
          onValueChange={async (value) =>
            updatePreferences({
              ...preferences,
              weeklyCheckIns: {
                ...preferences.weeklyCheckIns,
                enabled: value,
                mode: value ? preferences.weeklyCheckIns.mode : "off"
              }
            })
          }
          value={preferences.weeklyCheckIns.enabled}
        />
        {modes.map((mode) => (
          <Pressable key={mode} onPress={() => setWeeklyMode(mode)} style={[styles.modeChip, preferences.weeklyCheckIns.mode === mode && styles.modeChipActive]}>
            <Text style={[styles.modeChipText, preferences.weeklyCheckIns.mode === mode && styles.modeChipTextActive]}>{mode}</Text>
          </Pressable>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.helper}>Email-linked accounts restore your profile and history after reinstalling or changing phones.</Text>
        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  helper: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  integrationCard: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  integrationTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  integrationDetail: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  },
  rulePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  integrationAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  integrationActionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  secondaryAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  toastWrap: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 8,
    zIndex: 20
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  modalCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 560,
    padding: spacing.lg,
    width: "100%"
  },
  modalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  modalStepList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    padding: spacing.md
  },
  modalStep: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20
  },
  toast: {
    borderRadius: radius.pill,
    maxWidth: 760,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12
  },
  toastSuccess: {
    backgroundColor: colors.success
  },
  toastError: {
    backgroundColor: colors.danger
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  importRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  importCopy: {
    flex: 1,
    gap: 4
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
  modeChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  modeChipActive: {
    backgroundColor: colors.accent
  },
  modeChipText: {
    color: colors.text,
    fontWeight: "700"
  },
  modeChipTextActive: {
    color: "#FFFFFF"
  },
  signOut: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 14
  },
  signOutText: {
    color: colors.text,
    fontWeight: "800"
  }
});
