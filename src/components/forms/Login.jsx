import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import image from "@/assets/img.jpg";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, signup } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";

const initialFormState = {
  email: "",
  password: ""
};

function Login({ className, ...props }) {
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuthSession } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const authPayload = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });
      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success("Logged in successfully.");
      setFormData(initialFormState);
      const nextRole = authPayload?.user?.role?.toUpperCase();
      const redirectTo = location?.state?.redirectTo;
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (nextRole === "CLIENT") {
        navigate("/client", { replace: true });
      } else if (nextRole === "PROJECT_MANAGER") {
        navigate("/project-manager", { replace: true });
      } else if (nextRole === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/freelancer", { replace: true });
      }
    } catch (error) {
      const message = error?.message || "Unable to log in with those details.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFormError("");
    try {
      // Sign in with Firebase Google
      const firebaseUser = await signInWithGoogle();
      
      // Try to log in with the Google email
      let authPayload;
      try {
        // First try to log in (existing user)
        authPayload = await login({
          email: firebaseUser.email,
          password: firebaseUser.uid // Use Firebase UID as password for Google users
        });
      } catch (loginError) {
        // If login fails, create a new account
        authPayload = await signup({
          fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email,
          password: firebaseUser.uid, // Use Firebase UID as password
          role: "CLIENT"
        });
      }
      
      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success(`Welcome, ${firebaseUser.displayName || 'User'}!`);
      
      const nextRole = authPayload?.user?.role?.toUpperCase();
      const redirectTo = location?.state?.redirectTo;
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (nextRole === "CLIENT") {
        navigate("/client", { replace: true });
      } else if (nextRole === "PROJECT_MANAGER") {
        navigate("/project-manager", { replace: true });
      } else if (nextRole === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/freelancer", { replace: true });
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      const message = error?.message || "Unable to sign in with Google.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full mt-10 max-w-md md:max-w-5xl">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form
                className="p-8 md:p-12"
                onSubmit={handleSubmit}
                noValidate
              >
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">
                      Login to your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Enter your email below to log in to your account
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="loginEmail">Email</FieldLabel>
                    <Input
                      id="loginEmail"
                      name="email"
                      type="email"
                      placeholder="m@example.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="loginPassword">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="loginPassword"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pr-10"
                        required
                      />
                      <div
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-0 right-0 h-full px-3 flex items-center cursor-pointer select-none text-zinc-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </div>

                    </div>
                    <FieldDescription>
                      Must be at least 8 characters long.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Signing in..." : "Log In"}
                    </Button>
                  </Field>
                  {formError ? (
                    <FieldDescription
                      className="text-destructive text-sm"
                      aria-live="polite"
                    >
                      {formError}
                    </FieldDescription>
                  ) : null}
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Or continue with
                  </FieldSeparator>
                  <Field>
                    <Button
                      variant="outline"
                      type="button"
                      className="flex items-center justify-center gap-2 w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || isSubmitting}
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt="Google logo"
                          className="h-5 w-5"
                        />
                      )}
                      <span className="font-medium">
                        {isGoogleLoading ? "Signing in..." : "Continue with Google"}
                      </span>
                    </Button>
                  </Field>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account? <a href="/signup">Sign up</a>
                  </FieldDescription>
                </FieldGroup>
              </form>
              <div className="bg-muted relative hidden md:block">
                <img
                  src={image}
                  alt="Login illustration"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}

export default Login;

Login.propTypes = {
  className: PropTypes.string
};
