import React from "react";

export const Card = ({ children, className }) => (
  <div className={`border rounded-lg shadow p-4 ${className}`}>{children}</div>
);
