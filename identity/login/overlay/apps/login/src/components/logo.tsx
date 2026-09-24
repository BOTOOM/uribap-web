import type { ComponentType } from "react";

import { UribapBrand } from "@/components/uribap-brand";

type Props = {
  darkSrc?: string;
  lightSrc?: string;
  height?: number;
  width?: number;
};

export const Logo: ComponentType<Props> = () => <UribapBrand compact />;
