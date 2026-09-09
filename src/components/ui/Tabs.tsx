"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef } from "react";

export const Tabs = TabsPrimitive.Root;
export const TabList = TabsPrimitive.List;
export const TabTrigger = TabsPrimitive.Trigger;
export const TabContent = TabsPrimitive.Content;

export function StyledTabList({ className = "", ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={`ui-tabs-list ${className}`.trim()} {...props} />;
}
