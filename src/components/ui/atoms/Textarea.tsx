"use client";
import React from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, ...props },
  ref
) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium">{label}</span>}
      <textarea rows={4} {...props} ref={ref} className="border p-2 w-full" />
    </label>
  );
});

export default Textarea;
