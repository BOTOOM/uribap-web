import {
  Bell,
  BookOpen,
  CalendarBlank,
  CaretRight,
  Carrot,
  Check,
  Clock,
  CookingPot,
  DotsThree,
  Heart,
  House,
  MagnifyingGlass,
  Package,
  Plus,
  Robot,
  ShoppingCart,
  SignOut,
  Snowflake,
  Sparkle,
  ThermometerCold,
  Users,
  X,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { CSSProperties } from "react";

const registry = {
  bell: Bell,
  book: BookOpen,
  calendar: CalendarBlank,
  chevron: CaretRight,
  check: Check,
  clock: Clock,
  cooking: CookingPot,
  fridge: ThermometerCold,
  heart: Heart,
  home: House,
  more: DotsThree,
  package: Package,
  plus: Plus,
  bot: Robot,
  search: MagnifyingGlass,
  cart: ShoppingCart,
  carrot: Carrot,
  signout: SignOut,
  snow: Snowflake,
  spark: Sparkle,
  users: Users,
  close: X,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof registry;

type IconProps = {
  name: IconName;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
  style?: CSSProperties;
};

export function Icon({
  name,
  size = 19,
  weight = "regular",
  className = "",
  style,
}: IconProps) {
  const Component = registry[name];
  return (
    <Component
      aria-hidden="true"
      className={`icon ${className}`.trim()}
      size={size}
      style={style}
      weight={weight}
    />
  );
}
