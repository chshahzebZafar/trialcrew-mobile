import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import { authStub } from "@/lib/auth";
import { CLERK_ENABLED } from "@/lib/clerk";
import { clerkErrorMessage } from "@/lib/clerkErrors";
import { syncAfterSignIn } from "@/lib/postAuthSync";
import { colors } from "@/theme/tokens";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AuthBrand } from "@/components/AuthBrand";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared presentational form. `onDemo` is only passed by the stub variant. */
function SignInView(props: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  errors: { email?: string; password?: string };
  formError?: string | null;
  loading: boolean;
  onSubmit: () => void;
  onDemo?: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.porcelain }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 28, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="pt-6">
            <AuthBrand tagline="Welcome back. Sign in to pick up your cycles." />
          </View>

          <View className="gap-4">
            <TextField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={props.email} onChangeText={props.setEmail} error={props.errors.email} />
            <TextField label="Password" placeholder="Your password" secure autoComplete="password" value={props.password} onChangeText={props.setPassword} error={props.errors.password} />
            {props.formError && (
              <Text className="font-body text-[13px]" style={{ color: colors.danger }}>{props.formError}</Text>
            )}
            <Pressable className="self-end" hitSlop={8}>
              <Text className="font-inter-medium text-[13px]" style={{ color: colors.indigo }}>Forgot password?</Text>
            </Pressable>
          </View>

          <View className="mt-auto gap-3">
            <PrimaryButton label="Sign in" onPress={props.onSubmit} loading={props.loading} />
            {props.onDemo && (
              <PrimaryButton label="Continue as tester (demo)" variant="outline" onPress={props.onDemo} disabled={props.loading} />
            )}
            <View className="flex-row justify-center gap-1.5 pt-1">
              <Text className="font-inter text-[14px]" style={{ color: colors.slate }}>New here?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable hitSlop={8}>
                  <Text className="font-inter-semibold text-[14px]" style={{ color: colors.indigo }}>Create an account</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StubSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (!emailRe.test(email)) next.email = "Enter a valid email";
    if (password.length < 6) next.password = "At least 6 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await authStub.signIn(email, password);
      await syncAfterSignIn();
    } finally {
      setLoading(false);
    }
  };
  const demo = async () => {
    setLoading(true);
    try {
      await authStub.continueAsTester();
      await syncAfterSignIn();
    } finally {
      setLoading(false);
    }
  };

  return <SignInView email={email} setEmail={setEmail} password={password} setPassword={setPassword} errors={errors} loading={loading} onSubmit={submit} onDemo={demo} />;
}

function ClerkSignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (!emailRe.test(email)) next.email = "Enter a valid email";
    if (password.length < 6) next.password = "At least 6 characters";
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length || !isLoaded) return;

    setLoading(true);
    try {
      const res = await signIn.create({ identifier: email, password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        await syncAfterSignIn();
        // Root gate redirects into (tabs).
      } else {
        setFormError("Additional verification is required to sign in.");
      }
    } catch (e) {
      setFormError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return <SignInView email={email} setEmail={setEmail} password={password} setPassword={setPassword} errors={errors} formError={formError} loading={loading} onSubmit={submit} />;
}

export default CLERK_ENABLED ? ClerkSignIn : StubSignIn;
