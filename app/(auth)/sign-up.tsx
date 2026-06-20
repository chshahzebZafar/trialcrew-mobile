import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import { authStub } from "@/lib/auth";
import { CLERK_ENABLED } from "@/lib/clerk";
import { clerkErrorMessage } from "@/lib/clerkErrors";
import { syncAfterSignIn } from "@/lib/postAuthSync";
import { colors } from "@/theme/tokens";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AuthBrand } from "@/components/AuthBrand";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errs = { name?: string; email?: string; password?: string };

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.porcelain }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 28, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center gap-3 pt-2">
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text className="text-[22px]" style={{ color: colors.ink }}>←</Text>
            </Pressable>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SignUpForm(props: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  errors: Errs; formError?: string | null; loading: boolean; onSubmit: () => void;
}) {
  return (
    <Shell>
      <AuthBrand tagline="Create your tester account and start building a verified reputation." />
      <View className="gap-4">
        <TextField label="Full name" placeholder="Sam Rivera" autoCapitalize="words" autoComplete="name" value={props.name} onChangeText={props.setName} error={props.errors.name} />
        <TextField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={props.email} onChangeText={props.setEmail} error={props.errors.email} />
        <TextField label="Password" placeholder="Create a password" secure autoComplete="password-new" value={props.password} onChangeText={props.setPassword} error={props.errors.password} />
        {props.formError && <Text className="font-body text-[13px]" style={{ color: colors.danger }}>{props.formError}</Text>}
      </View>
      <View className="mt-auto gap-3">
        <PrimaryButton label="Create account" variant="accent" onPress={props.onSubmit} loading={props.loading} />
        <Text className="text-center font-inter text-[12px] leading-relaxed" style={{ color: colors.slate }}>
          By continuing you agree to run genuine tests and leave honest feedback.
        </Text>
        <View className="flex-row justify-center gap-1.5">
          <Text className="font-inter text-[14px]" style={{ color: colors.slate }}>Already have an account?</Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable hitSlop={8}>
              <Text className="font-inter-semibold text-[14px]" style={{ color: colors.indigo }}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Shell>
  );
}

function StubSignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errs>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: Errs = {};
    if (name.trim().length < 2) next.name = "Tell us your name";
    if (!emailRe.test(email)) next.email = "Enter a valid email";
    if (password.length < 6) next.password = "At least 6 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await authStub.signUp({ name, email, password });
      await syncAfterSignIn();
    } finally {
      setLoading(false);
    }
  };
  return <SignUpForm name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} errors={errors} loading={loading} onSubmit={submit} />;
}

function ClerkSignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [code, setCode] = useState("");

  const submit = async () => {
    const next: Errs = {};
    if (name.trim().length < 2) next.name = "Tell us your name";
    if (!emailRe.test(email)) next.email = "Enter a valid email";
    if (password.length < 6) next.password = "At least 6 characters";
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length || !isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password, unsafeMetadata: { fullName: name.trim() } });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPending(true);
    } catch (e) {
      setFormError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!isLoaded) return;
    setFormError(null);
    setLoading(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        await syncAfterSignIn();
      } else {
        setFormError("That code didn't work — try again.");
      }
    } catch (e) {
      setFormError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <Shell>
        <AuthBrand tagline={`Enter the 6-digit code we sent to ${email}.`} />
        <View className="gap-4">
          <TextField label="Verification code" placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" value={code} onChangeText={setCode} error={errors.email} />
          {formError && <Text className="font-body text-[13px]" style={{ color: colors.danger }}>{formError}</Text>}
        </View>
        <View className="mt-auto gap-3">
          <PrimaryButton label="Verify & create account" variant="accent" onPress={verify} loading={loading} />
          <Pressable className="self-center" hitSlop={8} onPress={() => setPending(false)}>
            <Text className="font-inter-medium text-[13px]" style={{ color: colors.slate }}>Use a different email</Text>
          </Pressable>
        </View>
      </Shell>
    );
  }

  return <SignUpForm name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} errors={errors} formError={formError} loading={loading} onSubmit={submit} />;
}

export default CLERK_ENABLED ? ClerkSignUp : StubSignUp;
