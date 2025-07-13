import React from 'react';

const getRandomRotation = () => {
  const forbidden = [0, 90, 180, 270, 360];
  let angle = Math.floor(Math.random() * 361); // 0–360
  while (forbidden.includes(angle)) {
    angle = Math.floor(Math.random() * 361);
  }
  return angle;
};

const randomDelay = Math.random() * 5; // tussen 0 en 5 seconden

const FallingSquaresBackground = () => {
  return (
    <div className="absolute w-full h-screen overflow-hidden">
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, index) => {
          const size = Math.random() * 700 + 10;
          const delay = Math.random() * 1; // time before spawn
          const duration = Math.random() * 300 + 250; // higher is slower
          const left = Math.random() * 100; // willekeurige horizontale start
          const rotation = getRandomRotation();
          return (
            <div
              key={index}
              className="square neon-border"
              style={{
                animationDelay: `${randomDelay}s`,
                transform: `rotate(${rotation}deg)`,
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `-${Math.random() * 100}%`, // spawn ergens boven het scherm
                // animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FallingSquaresBackground;
