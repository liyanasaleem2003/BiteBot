import React, { useState } from "react";

export const TooltipProvider = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

export const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
};

export const TooltipTrigger = ({ children, asChild, ...props }) => {
  return <div {...props}>{children}</div>;
};

export const TooltipContent = ({ children, side = "top", className = "", ...props }) => {
  return (
    <div
      className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg ${className}`}
      style={{
        [side]: "100%",
        left: "50%",
        transform: "translateX(-50%)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}; 