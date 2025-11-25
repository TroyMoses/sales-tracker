// app/forgotpassword.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Lock } from "lucide-react-native";
import { requestPasswordReset } from "../services/passwordResetService";

export default function ForgotPasswordScreen() {
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [step, setStep] = useState<"request" | "reset">("request");

  const handleRequestReset = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter your username");
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestPasswordReset(username.trim());

      if (result.token) {
        // Show token (in real app, would be sent via email)
        Alert.alert(
          "Reset Token Generated",
          `Your reset token is:\n\n${result.token}\n\nThis token is valid for 1 hour.`,
          [
            {
              text: "Copy",
              onPress: () => {
                // In real app, copy to clipboard
                setResetToken(result.token!);
                setStep("reset");
              },
            },
            {
              text: "OK",
              onPress: () => {
                setResetToken(result.token!);
                setStep("reset");
              },
            },
          ]
        );
      } else {
        Alert.alert("Info", result.message);
      }
    } catch {
      Alert.alert("Error", "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim()) {
      Alert.alert("Error", "Please enter your reset token");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { resetPassword } = await import(
        "../services/passwordResetService"
      );
      const result = await resetPassword(resetToken, newPassword);

      if (result.success) {
        Alert.alert("Success", result.message, [
          {
            text: "Back to Login",
            onPress: () => router.replace("/signin"),
          },
        ]);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch {
      Alert.alert("Error", "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#3b82f6" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Lock size={48} color="#fff" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === "request"
              ? "Enter your username to receive a reset token"
              : "Enter your reset token and new password"}
          </Text>
        </View>

        {step === "request" ? (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRequestReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Request Reset Token</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => router.back()}
            >
              <Text style={styles.switchText}>
                Remember your password?{" "}
                <Text style={styles.switchTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Reset Token</Text>
              <TextInput
                style={styles.input}
                value={resetToken}
                onChangeText={setResetToken}
                placeholder="Paste your reset token"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setStep("request");
                setResetToken("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              <Text style={styles.switchText}>
                Don&apos;t have a token?{" "}
                <Text style={styles.switchTextBold}>Request One</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            1. Enter your username{"\n"}
            2. Copy your reset token{"\n"}
            3. Enter new password{"\n"}
            4. Reset and login!
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#e2e8f0",
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  switchButton: {
    alignItems: "center",
    marginTop: 16,
  },
  switchText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  switchTextBold: {
    color: "#3b82f6",
    fontWeight: "600" as const,
  },
  infoBox: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 20,
  },
});
