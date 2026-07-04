import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Fish,
  FolderOpen,
  Image,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Ship,
  StickyNote,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudioNavItem } from "@/modules/studio/types";

const NAV_ITEMS: StudioNavItem[] = [
  { href: "/studio", label: "Attention", icon: "dashboard" },
  { href: "/studio/review", label: "Verify", icon: "review" },
  { href: "/studio/community", label: "Community", icon: "community" },
  { href: "/studio/import", label: "Import Center", icon: "import" },
  { href: "/studio/products", label: "Products", icon: "products" },
  { href: "/studio/manufacturers", label: "Manufacturers", icon: "manufacturers" },
  { href: "/studio/species", label: "Fish Species", icon: "species" },
  { href: "/studio/techniques", label: "Techniques", icon: "techniques" },
  { href: "/studio/media", label: "Media Library", icon: "media" },
  { href: "/studio/settings", label: "Settings", icon: "settings" },
];

const ICONS = {
  dashboard: LayoutDashboard,
  review: ClipboardList,
  import: Ship,
  products: Package,
  manufacturers: Wrench,
  species: Fish,
  techniques: BookOpen,
  community: Users,
  media: Image,
  notes: StickyNote,
  settings: Settings,
} as const;

type StudioSidebarProps = {
  currentPath: string;
};

export function StudioSidebar({ currentPath }: StudioSidebarProps) {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-56 shrink-0 flex-col border-r">
      <div className="border-sidebar-border border-b px-4 py-5">
        <Link href="/studio" className="block">
          <span className="text-sidebar-foreground text-sm font-semibold tracking-tight">
            Balık Oltamda Studio
          </span>
          <span className="text-muted-foreground mt-0.5 block text-xs">
            Editorial verification
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS] ?? FolderOpen;
          const active =
            item.href === "/studio"
              ? currentPath === "/studio"
              : currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-sidebar-border border-t p-3">
        <Link
          href="/tr"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
        >
          <MessageSquare className="size-3.5" />
          View public site
        </Link>
      </div>
    </aside>
  );
}
