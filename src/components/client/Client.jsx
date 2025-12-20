import CursorSpotlight from "@/components/ui/cursor-spotlight";
import ClientOnboading from "./ClientOnboading";

const Client = () => {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden transition-colors">
      <CursorSpotlight />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none [background-image:linear-gradient(to_right,var(--grid-line-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line-color)_1px,transparent_1px)]"
        style={{
          backgroundSize: "80px 80px",
          backgroundPosition: "0 0",
          opacity: 0.35,
          transform: "translateZ(0)",
        }}
      />

      <div className="relative z-10 max-w-[90rem] mx-auto px-6 py-16">
        <ClientOnboading />
      </div>
    </main>
  );
};

export default Client;
