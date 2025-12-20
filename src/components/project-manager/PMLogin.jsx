import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const initialFormState = {
    email: "",
    password: ""
};

function PMLogin({ className, ...props }) {
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
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

            const role = authPayload?.user?.role;
            if (role !== "PROJECT_MANAGER" && role !== "ADMIN") {
                throw new Error("Access Denied: This portal is for Project Managers only.");
            }

            setAuthSession(authPayload?.user, authPayload?.accessToken);
            toast.success("Welcome back, Manager.");
            setFormData(initialFormState);

            const redirectTo = location?.state?.redirectTo;
            if (redirectTo) {
                navigate(redirectTo, { replace: true });
            } else {
                navigate("/project-manager", { replace: true });
            }
        } catch (error) {
            const message = error?.message || "Unable to log in with those details.";
            setFormError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className={cn("flex flex-col gap-6", className)} {...props}>
                    <Card className="overflow-hidden border-t-4 border-t-primary">
                        <CardContent className="p-0">
                            <form
                                className="p-6 md:p-8"
                                onSubmit={handleSubmit}
                                noValidate
                            >
                                <FieldGroup>
                                    <div className="flex flex-col items-center gap-2 text-center mb-4">
                                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                            <ShieldCheck className="h-6 w-6 text-primary" />
                                        </div>
                                        <h1 className="text-2xl font-bold tracking-tight">
                                            PM Portal
                                        </h1>
                                        <p className="text-muted-foreground text-sm text-balance">
                                            Secure login for Project Managers
                                        </p>
                                    </div>
                                    <Field>
                                        <FieldLabel htmlFor="loginEmail">Email</FieldLabel>
                                        <Input
                                            id="loginEmail"
                                            name="email"
                                            type="email"
                                            placeholder="manager@example.com"
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
                                                className="absolute top-0 right-0 h-full px-3 flex items-center cursor-pointer select-none text-zinc-400 hover:text-foreground"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </div>

                                        </div>
                                    </Field>
                                    <Field>
                                        <Button type="submit" disabled={isSubmitting} className="w-full">
                                            {isSubmitting ? "Verifying..." : "Access Dashboard"}
                                        </Button>
                                    </Field>
                                    {formError ? (
                                        <FieldDescription
                                            className="text-destructive text-sm text-center"
                                            aria-live="polite"
                                        >
                                            {formError}
                                        </FieldDescription>
                                    ) : null}
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                    <div className="text-center text-xs text-muted-foreground">
                        Restricted Access. Authorized Personnel Only.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PMLogin;

PMLogin.propTypes = {
    className: PropTypes.string
};
