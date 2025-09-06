import React from "react";

export const Command = ({ children }) => <div className="command">{children}</div>;
export const CommandInput = (props) => <input {...props} className="command-input" />;
export const CommandItem = ({ children, ...props }) => <div {...props} className="command-item">{children}</div>;
export const CommandEmpty = ({ children }) => <div className="command-empty">{children}</div>;
export const CommandGroup = ({ children }) => <div className="command-group">{children}</div>;
