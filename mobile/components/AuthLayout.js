import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import BrandMark from "./BrandMark";

function SolarLandscape() {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 600 900"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#e5f8f2" />
            <Stop offset="0.5" stopColor="#fcfef9" />
            <Stop offset="1" stopColor="#e8f8f1" />
          </LinearGradient>
          <LinearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fffbe4" />
            <Stop offset="1" stopColor="#fff1b4" />
          </LinearGradient>
          <LinearGradient id="hill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#c6ead8" />
            <Stop offset="1" stopColor="#92c8ae" />
          </LinearGradient>
          <LinearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#86b674" />
            <Stop offset="1" stopColor="#337451" />
          </LinearGradient>
        </Defs>
        <Path d="M0 0H600V900H0Z" fill="url(#sky)" />
        <Path
          d="M0 180Q140 5 380 25Q180 30 0 350Z"
          fill="#daf5ed"
          opacity="0.35"
        />
        <Circle
          cx="574"
          cy="18"
          r="210"
          fill="#fff8d5"
          opacity="0.22"
          stroke="#ffffff"
          strokeWidth="2"
        />
        <Circle
          cx="574"
          cy="18"
          r="165"
          fill="#fff8d5"
          opacity="0.3"
          stroke="#ffffff"
          strokeWidth="2"
        />
        <Circle
          cx="574"
          cy="18"
          r="123"
          fill="url(#sun)"
          opacity="0.65"
          stroke="#ffffff"
          strokeWidth="2"
        />
        <Path
          d="M0 680Q100 702 207 790Q355 822 600 700V900H0Z"
          fill="#cceee1"
          opacity="0.55"
        />
        <Path
          d="M0 744Q140 755 270 801Q390 836 600 755V900H0Z"
          fill="url(#hill)"
          opacity="0.58"
        />
        <Path
          d="M0 800Q200 790 360 871Q470 846 600 822V900H0Z"
          fill="#a9d6be"
          opacity="0.55"
        />
        <Path
          d="M483 774L640 736L568 858L412 868Z"
          fill="#83b8ae"
          opacity="0.45"
          stroke="#f4fff8"
          strokeWidth="3"
        />
        <Path
          d="M523 764L454 865M564 754L494 863M607 745L535 860M460 805L617 773M437 837L592 811"
          fill="none"
          stroke="#effff8"
          strokeWidth="2"
          opacity="0.8"
        />
        <Path
          d="M0 900V810Q26 765 69 767Q36 809 0 831Q68 795 122 835Q73 862 15 872L40 900Z"
          fill="url(#leaf)"
          opacity="0.8"
        />
        <Ellipse
          cx="420"
          cy="911"
          rx="110"
          ry="48"
          fill="#8fbd82"
          opacity="0.6"
        />
        <Ellipse
          cx="571"
          cy="895"
          rx="90"
          ry="44"
          fill="#72aa77"
          opacity="0.65"
        />
      </Svg>
    </View>
  );
}

export default function AuthLayout({ title, description, children, footer }) {
  return (
    <View style={styles.screen}>
      <SolarLandscape />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.column}>
              <View style={styles.heading}>
                <View style={styles.brandRow}>
                  <BrandMark size={52} style={styles.mark} />
                  <Text style={styles.brand}>Solar Share</Text>
                </View>
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
                <Text style={styles.description}>{description}</Text>
              </View>
              <View style={styles.card}>{children}</View>
              <View style={styles.footer}>{footer}</View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  button: {
    backgroundColor: "#087c55",
    borderRadius: 14,
    minHeight: 56,
    marginTop: 4,
    boxShadow: "0px 8px 20px rgba(7, 125, 83, 0.16)",
    ...Platform.select({
      web: { backgroundImage: "linear-gradient(120deg, #159568, #005d40)" },
      default: {
        experimental_backgroundImage:
          "linear-gradient(120deg, #159568, #005d40)",
      },
    }),
  },
  linkButton: {
    alignSelf: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 14,
    padding: 8,
  },
  linkText: {
    color: "#647c7c",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  linkEmphasis: { color: "#00754e", fontWeight: "700", fontSize: 15 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#effaf5" },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 100,
  },
  column: { width: "100%", maxWidth: 460, alignSelf: "center" },
  heading: { paddingHorizontal: 16, marginBottom: 24 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  mark: {
    backgroundColor: "#008259",
    borderRadius: 15,
    boxShadow: "0px 5px 12px rgba(0, 112, 76, 0.14)",
  },
  brand: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: "#072722",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    color: "#062520",
    lineHeight: 41,
  },
  description: {
    fontSize: 17,
    lineHeight: 25,
    color: "#647c7c",
    marginTop: 10,
  },
  card: {
    padding: 26,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "#e0eee8",
    boxShadow: "0px 16px 40px rgba(18, 119, 80, 0.12)",
  },
  footer: { marginTop: 10 },
});
