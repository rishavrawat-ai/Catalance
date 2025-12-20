import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BadgeCheck, BriefcaseBusiness, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  {
    id: "CLIENT",
    title: "I'm a client, hiring for a project",
    description: "Post projects, review proposals, and collaborate with top talent.",
    icon: BriefcaseBusiness
  },
  {
    id: "FREELANCER",
    title: "I'm a freelancer, looking for work",
    description: "Showcase your skills, submit proposals, and get hired faster.",
    icon: Laptop
  }
];

export function SignupRoleSelect({ onContinue }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (selectedRole) {
      onContinue(selectedRole);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl w-full mx-auto text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Step 1
        </p>
        <h1 className="text-3xl font-semibold mt-2">
          Join as a client or freelancer
        </h1>
        <p className="text-muted-foreground mt-2">
          Choose the option that best describes how you plan to use the platform.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {ROLE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = selectedRole === option.id;

          return (
            <Card
              key={option.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedRole(option.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedRole(option.id);
                }
              }}
              className={cn(
                "p-6 text-left cursor-pointer border transition-all hover:border-primary focus-visible:ring-2 focus-visible:ring-offset-2",
                isActive ? "border-primary shadow-lg" : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-muted rounded-full p-2">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">{option.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          disabled={!selectedRole}
          onClick={handleContinue}
          className="gap-2"
        >
          Continue
          <BadgeCheck className="size-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary underline-offset-4 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}

SignupRoleSelect.propTypes = {
  onContinue: PropTypes.func.isRequired
};
