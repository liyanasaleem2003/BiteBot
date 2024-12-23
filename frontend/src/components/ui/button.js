import React from "react";

export const Button = ({ children, onClick, ...props }) => (
  <button
    className="px-4 py-2 bg-blue-500 text-white rounded"
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);
