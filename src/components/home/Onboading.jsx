import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import GradientBarsBackground from "@/components/ui/gradient-bars-background";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const ShinyText = ({ text, className = "", disabled = false, speed = 3 }) => {
  if (disabled) {
    return (
      <span
        className={cn(
          "text-current font-semibold tracking-tight",
          className
        )}>
        {text}
      </span>
    );
  }

  const duration = Math.max(Number(speed) || 3, 0.5);

  return (
    <span
      className={cn(
        "font-semibold tracking-tight text-transparent bg-clip-text",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(251,191,36,0.25), #facc15, #fef3c7, #facc15, rgba(251,191,36,0.25))",
        backgroundSize: "250% 100%",
        animation: `shimmer ${duration}s linear infinite`,
      }}>
      {text}
    </span>
  );
};

const Onboading = () => {
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;

    const checkTheme = () => {
      setResolvedTheme(root.classList.contains("dark") ? "dark" : "light");
    };

    // Initial check
    checkTheme();

    // Observe changes to the class attribute on the html element
    const observer = new MutationObserver(checkTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Force dark theme palette for the hero section to maintain the premium look
  const palette =
    resolvedTheme === "light"
      ? {
          bg: "#ffffff",
          text: "#000000",
          subtext: "rgba(0,0,0,0.72)",
          gradientFrom: "#facc15", // Yellow bars visible on white
          gradientTo: "#ffffff",
          buttonHover: "hover:bg-black/5",
          buttonBorder: "border-black/20",
          buttonText: "text-black",
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          subtext: "rgba(255,255,255,0.72)",
          gradientFrom: "#facc15",
          gradientTo: "#000000",
          buttonHover: "hover:bg-white/10",
          buttonBorder: "border-white/20",
          buttonText: "text-white",
        };

  return (
    <GradientBarsBackground
      backgroundColor={palette.bg}
      gradientFrom={palette.gradientFrom}
      gradientTo={palette.gradientTo}
      numBars={13}
      animationDuration={3}
    >
      <div className="max-w-6xl text-center flex flex-col items-center justify-center gap-5 py-16 pointer-events-auto">
        <Link to="/signup" className="inline-block">
          <Button
            variant="outline"
            className={cn(
              "group border px-6 py-3 rounded-full inline-flex items-center gap-2 text-sm font-medium cursor-pointer bg-transparent",
              palette.buttonHover,
              palette.buttonText,
              palette.buttonBorder
            )}>
            <Sparkles className="text-yellow-400 fill-yellow-400 w-5 h-5" />
            <ShinyText
              text="Smarter Way to Connect Freelancers & Clients"
              disabled={false}
              speed={3}
              className={palette.buttonText}
            />
            <ChevronRight className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Button>
        </Link>

        <h1 
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium leading-tight tracking-tight max-w-6xl"
          style={{ color: palette.text }}
        >
          Find clever minds<br /> Upgrade your craft
        </h1>

        <p
          className="text-lg md:text-2xl max-w-3xl"
          style={{ color: palette.subtext }}>
          Join our network of freelancers and connect with clients who value
          your talent.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
          <Link to="/service" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="text-lg gap-2 rounded-full shadow-md w-full sm:w-auto cursor-pointer">
              Hire a professional <ArrowRight className="h-5 w-4" />
            </Button>
          </Link>
          <Link to="/freelancer/onboarding" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "text-lg rounded-full w-full sm:w-auto cursor-pointer bg-transparent border",
                palette.buttonText,
                palette.buttonBorder,
                palette.buttonHover
              )}>
              Get Hired
            </Button>
          </Link>
        </div>
      </div>
    </GradientBarsBackground>
  );
};

export default Onboading;
