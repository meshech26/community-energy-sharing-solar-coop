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

export default function LoginScreen({ navigation }) {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError("Enter both your email address and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      const { token, user } = response.data;
      const currentUser = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      login(currentUser.data?.user || user, token);
    } catch (requestError) {
      setError(
        friendlyError(
          requestError,
          "We could not sign you in. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="Sign in to your Solar Share account."
      title="Welcome back"
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Register")}
          style={authStyles.linkButton}
        >
          <Text style={authStyles.linkText}>
            New to Solar Share?{" "}
            <Text style={authStyles.linkEmphasis}>Create an account</Text>
          </Text>
        </Pressable>
      }
    >
      <View>
        <FormInput
          variant="auth"
          icon="email-outline"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          testID="login-email"
          value={email}
        />
        <FormInput
          variant="auth"
          icon="lock-outline"
          autoComplete="current-password"
          label="Password"
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          testID="login-password"
          value={password}
        />
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        <PrimaryButton
          style={authStyles.button}
          loading={isSubmitting}
          onPress={submit}
          testID="login-submit"
        >
          Sign In
        </PrimaryButton>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("ForgotPassword")}
          style={authStyles.linkButton}
        >
          <Text style={authStyles.linkEmphasis}>Forgot password?</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
