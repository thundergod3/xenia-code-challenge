"use client";
import React from "react";

type OptionItem = string | { value: string; label?: string };

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options?: OptionItem[];
  placeholder?: string;
};

const Select = React.forwardRef<HTMLSelectElement, Props>(function Select(
  { label, children, placeholder, ...props }: any,
  ref
) {
  const options: OptionItem[] | undefined = props.options;

  return (
    <label className="block">
      {label && <span className="block text-sm font-medium">{label}</span>}
      <select {...props} ref={ref} className="border p-2 w-full">
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options && options.length
          ? options.map((opt: OptionItem) => {
              if (typeof opt === "string")
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label ?? opt.value}
                </option>
              );
            })
          : children}
      </select>
    </label>
  );
});

export default Select;
