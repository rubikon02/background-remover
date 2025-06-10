import React from "react";

export function Checkerboard({ className = "", style = {}, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={"absolute inset-0 z-0 " + className}
      style={{
        backgroundImage:
          'linear-gradient(45deg, #e0e0e0 25%, transparent 25%),' +
          'linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),' +
          'linear-gradient(45deg, transparent 75%, #e0e0e0 75%),' +
          'linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
        backgroundSize: '32px 32px',
        backgroundPosition: '0 0, 0 16px, 16px -16px, -16px 0px',
        backgroundColor: '#fff',
        ...style,
      }}
      {...props}
    />
  );
}
