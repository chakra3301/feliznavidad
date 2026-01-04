import {useState, useEffect, useCallback} from 'react';

export function Nugget() {
  const [isPartying, setIsPartying] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  
  const partyColors = [
    'hue-rotate(0deg)',
    'hue-rotate(60deg)',
    'hue-rotate(120deg)',
    'hue-rotate(180deg)',
    'hue-rotate(240deg)',
    'hue-rotate(300deg)',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPartying) {
      interval = setInterval(() => {
        setColorIndex((prev) => (prev + 1) % partyColors.length);
      }, 100); // Fast color cycling
      
      // Stop partying after 3 seconds
      const timeout = setTimeout(() => {
        setIsPartying(false);
        setColorIndex(0);
      }, 3000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
    
    return () => clearInterval(interval);
  }, [isPartying]);

  const handleClick = useCallback(() => {
    if (!isPartying) {
      setIsPartying(true);
    }
  }, [isPartying]);

  return (
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[9998] cursor-pointer"
      onClick={handleClick}
      style={{pointerEvents: 'auto'}}
    >
      <div
        className={`transition-transform duration-200 ${
          isPartying ? 'animate-shake' : 'hover:-translate-x-2'
        }`}
        style={{
          transform: `translateX(40%)`,
        }}
      >
        <img
          src="/nugget.png"
          alt="Nugget"
          className={`h-40 w-auto transition-all duration-100 ${
            isPartying ? 'brightness-125 saturate-150' : ''
          }`}
          style={{
            filter: isPartying ? `${partyColors[colorIndex]} brightness(1.3) saturate(1.5)` : 'none',
          }}
        />
      </div>
      
      {/* Party sparkles when active */}
      {isPartying && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][i % 6],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.5s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

