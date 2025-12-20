import { useState, useEffect } from "react";
import { EvervaultCard, CardPattern, generateRandomString } from "@/components/ui/evervault-card";
import { useMotionValue, useMotionTemplate, motion } from "motion/react";
import ChatDialog from "./ChatDialog";
import {
  Code,
  Target,
  Video,
  Megaphone,
  Palette,
  FileText,
  Heart,
  Headphones,
  ClipboardList,
  Search,
  Share2,
  Activity,
  Mic,
  Database,
  Workflow,
  MessageCircle,
  Users,
  Globe,
  Smartphone,
  Terminal,
} from "lucide-react";

// ... features array remains the same ...
const features = [
  {
    title: "Website Development",
    description: "Custom business websites, landing pages and e-commerce stores.",
    price: "Starting at ₹15,000",
    icon: Globe,
  },
  {
    title: "App Development",
    description: "Native and cross-platform mobile applications for iOS and Android.",
    price: "Starting at ₹25,000",
    icon: Smartphone,
  },
  {
    title: "Software Development",
    description: "Custom software solutions, SaaS platforms and enterprise tools.",
    price: "Starting at ₹30,000",
    icon: Terminal,
  },
  {
    title: "Lead Generation",
    description: "Targeted leads & outreach campaigns to grow sales funnel.",
    price: "Starting at ₹15,000",
    icon: Target,
  },
  {
    title: "Video Services",
    description: "Promo, explainer, ads and product videos.",
    price: "Starting at ₹7,500",
    icon: Video,
  },
  {
    title: "SEO Optimization",
    description: "Rank higher on Google with on-page, off-page and technical SEO.",
    price: "Starting at ₹8,000",
    icon: Search,
  },
  {
    title: "Social Media Management",
    description: "Content creation, scheduling and community management.",
    price: "Starting at ₹12,000",
    icon: Share2,
  },
  {
    title: "Performance Marketing",
    description: "Paid ad campaigns (PPC) on Google, Facebook, and Instagram.",
    price: "Starting at ₹15,000",
    icon: Activity,
  },
  {
    title: "Creative & Design",
    description: "Logo, branding, UI/UX and visual design services.",
    price: "Starting at ₹3,500",
    icon: Palette,
  },
  {
    title: "Writing & Content",
    description: "Blogs, website copy, ad copy and scripts.",
    price: "Starting at ₹2,000",
    icon: FileText,
  },

  {
    title: "Customer Support",
    description: "Chat, email or voice support setup and staffing.",
    price: "Starting at ₹8,000",
    icon: Headphones,
  },

  {
    title: "Influencer/UGC Marketing",
    description: "Collaborate with creators for authentic brand promotion.",
    price: "Starting at ₹10,000",
    icon: Users,
  },
  {
    title: "CRM & ERP Solutions",
    description: "Custom CRM/ERP systems to streamline business operations.",
    price: "Starting at ₹40,000",
    icon: Database,
  },
  {
    title: "AI Automation",
    description: "Automate repetitive tasks with custom AI workflows and agents.",
    price: "Starting at ₹20,000",
    icon: Workflow,
  },
  {
    title: "WhatsApp Chat Bot",
    description: "Automated customer support and sales bots for WhatsApp.",
    price: "Starting at ₹10,000",
    icon: MessageCircle,
  },
];

// Custom Matrix Pattern component for background - always visible (masked by mouse) without hover dependency
function MatrixPattern({ mouseX, mouseY, randomString }) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 20%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0.15) 80%, transparent 100%)`; // Softer edges, more visible in light mode
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 [mask-image:linear-gradient(white,transparent)] opacity-20" /> {/* Base subtle pattern */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary to-orange-700 opacity-100 transition duration-500 backdrop-blur-xl" // Always visible, controlled by mask
        style={style}
      />
      <motion.div
        className="absolute inset-0 opacity-100 mix-blend-overlay transition duration-500" // Always visible, controlled by mask
        style={style}
      >
        <p className="absolute inset-x-0 h-full break-words whitespace-pre-wrap text-xs font-mono font-bold text-white transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const ClientOnboading = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Matrix effect state
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    const str = generateRandomString(20000);
    setRandomString(str);

    const handleMouseMove = (event) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);

      // Optional: Regenerate string on movement for dynamic effect
      const str = generateRandomString(20000);
      setRandomString(str);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleCardClick = (feature) => {
    setSelectedService(feature);
    setIsChatOpen(true);
  };

  return (
    <section
      className="mt-10 space-y-6 text-foreground transition-colors relative"
    >
      {/* Matrix Background Layer - Fixed to cover whole screen */}
      <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden">
        <MatrixPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
      </div>

      <div className="text-center space-y-2 relative z-10">
        <p className="text-lg uppercase tracking-[0.4em] text-primary">
          Services
        </p>
        <h2 className="text-3xl font-semibold">
          Clarity across every step of the freelance lifecycle.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
        {features.map((feature, index) => (
          <div key={index} onClick={() => handleCardClick(feature)} className="cursor-pointer">
            <EvervaultCard text={feature.title} className="h-72" disableEffect={true}>
              <div className="text-center space-y-3 flex flex-col items-center">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <p className="text-sm font-medium text-primary pt-2">
                  {feature.price}
                </p>
              </div>
            </EvervaultCard>
          </div>
        ))}
      </div>

      <ChatDialog
        isOpen={isChatOpen}
        onClose={setIsChatOpen}
        service={selectedService}
      />
    </section>
  );
};

export default ClientOnboading;