import * as React from "react";

export function RadioGroup({ value, onValueChange, children, className }) {
  return (
    <div
      role="radiogroup"
      className={`flex gap-4 ${className || ""}`}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { checked: value === child.props.value, onChange: () => onValueChange(child.props.value) })
      )}
    </div>
  );
}

export function RadioGroupItem({ value, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}
