import * as DialogPrimitive from "@radix-ui/react-dialog";

// Core components
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogOverlay = (props) => (
  <DialogPrimitive.Overlay
    {...props}
    className="fixed inset-0 bg-black/50 data-[state=open]:animate-fadeIn"
  />
);
export const DialogContent = ({ children, ...props }) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      {...props}
      className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none dark:bg-neutral-900"
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);

export const DialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
);
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

// Footer and Close button
export const DialogFooter = ({ children }) => (
  <div className="mt-4 flex justify-end gap-2">{children}</div>
);
export const DialogClose = DialogPrimitive.Close;
