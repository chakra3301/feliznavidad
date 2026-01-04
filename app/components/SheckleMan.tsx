import {useState, useEffect} from 'react';

export function SheckleMan() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);

  useEffect(() => {
    // Random delay between 15-45 seconds for first appearance
    const initialDelay = Math.random() * 30000 + 15000;
    
    const showCharacter = () => {
      setIsVisible(true);
      setHasAppeared(true);
      
      // Hide after 4 seconds
      setTimeout(() => {
        setIsVisible(false);
        
        // Schedule next appearance (30-90 seconds)
        const nextDelay = Math.random() * 60000 + 30000;
        setTimeout(showCharacter, nextDelay);
      }, 4000);
    };

    const timer = setTimeout(showCharacter, initialDelay);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-4 z-[9999] transition-transform duration-700 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-[150%]'
      }`}
      style={{pointerEvents: 'none'}}
    >
      {/* Chat bubble */}
      <div
        className={`absolute -top-20 left-16 bg-white rounded-2xl px-4 py-3 shadow-xl border-2 border-neutral-900 max-w-[200px] transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        style={{transitionDelay: isVisible ? '300ms' : '0ms'}}
      >
        <p className="text-sm font-bold text-neutral-900 whitespace-nowrap">
          Give me all your sheckles!
        </p>
        {/* Speech bubble tail */}
        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-b-2 border-l-2 border-neutral-900 transform rotate-[-45deg]" />
      </div>
      
      {/* Character image */}
      <img
        src="/jew.png"
        alt=""
        className="h-32 w-auto animate-bounce"
        style={{
          animationDuration: '1s',
          animationIterationCount: isVisible ? 'infinite' : '0',
        }}
      />
    </div>
  );
}

