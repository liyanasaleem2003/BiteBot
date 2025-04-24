import React, { useState } from "react";

export const Popover = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

export const PopoverTrigger = ({ children, asChild, ...props }) => {
  return <div {...props}>{children}</div>;
};

export const PopoverContent = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}; 