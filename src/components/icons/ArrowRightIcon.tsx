import React from 'react';

interface ArrowRightIconProps {
  className?: string;
}

const ArrowRightIcon: React.FC<ArrowRightIconProps> = ({ className }) => {
  return (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 14 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M8.41182 3.68194C8.19579 3.42273 7.81055 3.38771 7.55133 3.60372C7.29212 3.81974 7.2571 4.20498 7.47311 4.4642L8.67453 5.90592H3.0548C2.71738 5.90592 2.44385 6.17946 2.44385 6.51687C2.44385 6.85429 2.71738 7.12783 3.0548 7.12783H8.67461L7.47311 8.5696C7.2571 8.82881 7.29212 9.21404 7.55133 9.43007C7.81055 9.6461 8.19579 9.61108 8.41182 9.35187L10.4483 6.90802C10.6372 6.68144 10.6372 6.35234 10.4483 6.12576L8.41182 3.68194Z" 
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowRightIcon;

