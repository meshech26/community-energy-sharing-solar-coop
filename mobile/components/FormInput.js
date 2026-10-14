import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function FormInput({
  autoCapitalize = "none",
  autoComplete,
  error,
  keyboardType = "default",
  label,
  multiline = false,
  numberOfLines,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  testID,
  value,
  icon,
  variant,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const canTogglePassword = secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, variant === "auth" && styles.authLabel]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputFrame,
          variant === "auth" && styles.authFrame,
          isFocused && styles.inputFrameFocused,
          error && styles.inputFrameError,
        ]}
      >
        {icon ? (
          <View style={styles.leadingIcon}>
            <MaterialCommunityIcons
              accessible={false}
              name={icon}
              color="#688184"
              size={23}
            />
          </View>
        ) : null}
        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          accessibilityLabel={label}
          aria-invalid={Boolean(error)}
          accessibilityHint={error || undefined}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          placeholderTextColor="#627168"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          style={[
            styles.input,
            variant === "auth" && styles.authInput,
            multiline && styles.multilineInput,
          ]}
          testID={testID}
          value={value}
        />
        {canTogglePassword ? (
          <Pressable
            accessibilityLabel={`${isPasswordVisible ? "Hide" : "Show"} ${(label || "password").toLowerCase()}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}
          >
            <MaterialCommunityIcons
              accessible={false}
              color="#587064"
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  authLabel: { color: "#102b28", fontSize: 15, marginBottom: 10 },
  authFrame: {
    backgroundColor: "#f5f9f9",
    borderColor: "#d6e4e4",
    borderRadius: 13,
    overflow: "hidden",
    minHeight: 56,
  },
  authInput: {
    backgroundColor: "transparent",
    minWidth: 0,
    minHeight: 56,
    paddingHorizontal: 12,
    color: "#173632",
  },
  leadingIcon: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#d6e4e4",
    marginLeft: 8,
    height: 27,
  },
  wrapper: {
    marginBottom: 18,
  },
  label: {
    color: "#29352F",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    color: "#17231C",
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    paddingBottom: 12,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputFrame: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDE5DF",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
  },
  inputFrameFocused: {
    borderColor: "#16764C",
  },
  inputFrameError: {
    borderColor: "#B84A4A",
  },
  passwordToggle: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  errorText: { color: "#A42A2A", fontSize: 13, lineHeight: 18, marginTop: 6 },
});
