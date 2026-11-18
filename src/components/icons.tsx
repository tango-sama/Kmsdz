import {
  Building2, Droplets, Sun, Cctv, PanelsTopLeft, LayoutPanelTop, Armchair, Zap, Network, type LucideProps,
} from "lucide-react";
import type { ServiceIcon } from "@/config/services";

const map = {
  building: Building2,
  roof: Droplets,
  solar: Sun,
  cctv: Cctv,
  facade: PanelsTopLeft,
  layout: LayoutPanelTop,
  office: Armchair,
  electric: Zap,
  network: Network,
} as const;

export function ServiceIconView({ name, ...props }: { name: ServiceIcon } & LucideProps) {
  const Icon = map[name];
  return <Icon aria-hidden {...props} />;
}

export function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden {...props}>
      <path d="M16.04 3C9.4 3 4 8.38 4 15c0 2.12.56 4.19 1.62 6.01L4 29l8.19-1.58A12.05 12.05 0 0 0 16.04 27C22.68 27 28 21.62 28 15S22.68 3 16.04 3Zm0 21.99c-1.8 0-3.56-.48-5.1-1.4l-.37-.22-4.86.94.99-4.74-.24-.39A9.93 9.93 0 0 1 6.03 15c0-5.5 4.5-9.98 10.01-9.98S26 9.5 26 15s-4.46 9.99-9.96 9.99Zm5.49-7.47c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.06 1.03-1.06 2.52s1.09 2.92 1.24 3.12c.15.2 2.14 3.26 5.18 4.57.72.31 1.29.5 1.73.64.73.23 1.39.2 1.91.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.12-.28-.2-.58-.35Z" />
    </svg>
  );
}
