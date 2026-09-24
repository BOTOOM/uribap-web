import { UribapBrand } from "@/components/uribap-brand";

type Props = {
  darkSrc?: string;
  lightSrc?: string;
  height?: number;
  width?: number;
};

export function Logo({}: Props) {
  return <UribapBrand compact />;
}
