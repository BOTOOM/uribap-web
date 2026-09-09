"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef } from "react";

export const Menu = DropdownMenuPrimitive.Root;
export const MenuTrigger = DropdownMenuPrimitive.Trigger;
export const MenuItem = DropdownMenuPrimitive.Item;

export function MenuContent({ className = "", ...props }: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return <DropdownMenuPrimitive.Portal><DropdownMenuPrimitive.Content className={`ui-menu-content ${className}`.trim()} {...props} /></DropdownMenuPrimitive.Portal>;
}
