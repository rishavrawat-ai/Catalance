import React from 'react';

const GradientBars = ({
  numBars = 15,
  gradientFrom = '#facc15',
  gradientTo = 'transparent',
  animationDuration = 2,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  const calculateHeight = (index, total) => {
    const position = index / (total - 1);
    const maxHeight = 100;
    const minHeight = 30;
    
    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);
    
    return minHeight + (maxHeight - minHeight) * heightPercentage;
  };

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      <div 
        className="flex h-full"
        style={{
          width: '100%',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {Array.from({ length: numBars }).map((_, index) => {
          const height = calculateHeight(index, numBars);
          const isHovered = hoveredIndex === index;
          
          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                flex: `1 0 calc(100% / ${numBars})`,
                maxWidth: `calc(100% / ${numBars})`,
                height: '100%',
                background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
                transform: `scaleY(${isHovered ? (height / 100) * 1.5 : (height / 100)})`,
                transformOrigin: 'bottom',
                transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smoother "piano-like" feel
                outline: '1px solid rgba(0, 0, 0, 0)',
                boxSizing: 'border-box',
                zIndex: isHovered ? 10 : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default function GradientBarsBackground({
  numBars = 7,
  gradientFrom = 'rgb(255, 60, 0)',
  gradientTo = 'transparent',
  animationDuration = 2,
  backgroundColor = 'rgb(10, 10, 10)',
  children,
  className,
}) {
  return (
    <section 
      className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden ${className || ''}`}
      style={{ backgroundColor }}
    >
      <GradientBars
        numBars={numBars}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        animationDuration={animationDuration}
      />
      
      {children && (
        <div className="relative z-10 w-full h-full flex items-center justify-center px-4 pointer-events-none">
          {children}
        </div>
      )}
    </section>
  );
}

export { GradientBars };
