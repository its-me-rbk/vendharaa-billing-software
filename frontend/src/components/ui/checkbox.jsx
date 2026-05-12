"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

function Checkbox({ className, ...props }) {
  return (
    <label
      className={cn("inline-flex items-center gap-2 cursor-pointer", className)}
    >
      <input type="checkbox" {...props} className="sr-only peer" />
      <span className="w-4 h-4 inline-flex items-center justify-center rounded-[4px] border bg-input-background transition-colors peer-checked:bg-primary peer-checked:border-primary">
        <CheckIcon className="w-3.5 h-3.5 text-current opacity-0 peer-checked:opacity-100" />
      </span>
    </label>
  );
}

export { Checkbox };
