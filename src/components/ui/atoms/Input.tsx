"use client";
import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { label, ...props },
  ref
) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium">{label}</span>}
      <input {...props} ref={ref} className="border p-2 w-full" />
    </label>
  );
});

export default Input;
