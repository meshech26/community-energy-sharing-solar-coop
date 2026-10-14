import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import AuthLayout, { authStyles } from "../components/AuthLayout";
import ErrorMessage from "../components/ErrorMessage";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

const friendlyError = (error, fallback) => {
  if (!error?.response) {
    return "Unable to reach Solar Share. Check your connection and try again.";
  }

  return error.response.data?.message || fallback;
};

export default function RegisterScreen({ navigation }) {
  const login = useAuthStore((state) => state.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password || !invitationCode.trim()) {
      setError("Complete all fields to create your account.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
        invitationCode: invitationCode.trim(),
      });
      const { token, user } = response.data;
      const currentUser = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      login(currentUser.data.user || user, token);
    } catch (requestError) {
      setError(
        friendlyError(
          requestError,
          "We could not create your account. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="Use the household invitation code provided by your co-op."
      title="Join your community"
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={authStyles.linkButton}
        >
          <Text style={authStyles.linkText}>
            Already have an account?{" "}
            <Text style={authStyles.linkEmphasis}>Sign in</Text>
          </Text>
        </Pressable>
      }
    >
      <View>
        <FormInput
          variant="auth"
          icon="account-outline"
          autoComplete="name"
          autoCapitalize="words"
          label="Full Name"
          onChangeText={setName}
          placeholder="Your full name"
          testID="register-name"
          value={name}
        />
        <FormInput
          variant="auth"
          icon="email-outline"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          testID="register-email"
          value={email}
        />
        <FormInput
          variant="auth"
          icon="lock-outline"
          autoComplete="new-password"
          label="Password"
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          testID="register-password"
          value={password}
        />
        <FormInput
          variant="auth"
          icon="account-group-outline"
          autoCapitalize="characters"
          label="Household Invitation Code"
          onChangeText={setInvitationCode}
          placeholder="For example: H01-SOLAR"
          testID="register-invitation-code"
          value={invitationCode}
        />
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        <PrimaryButton
          style={authStyles.button}
          loading={isSubmitting}
          onPress={submit}
          testID="register-submit"
        >
          Create Account
        </PrimaryButton>
      </View>
    </AuthLayout>
  );
}
