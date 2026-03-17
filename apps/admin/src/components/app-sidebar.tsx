"use client";

import {
  FileTextIcon,
  FolderTreeIcon,
  GiftIcon,
  LayoutGridIcon,
  LogInIcon,
  ScrollTextIcon,
  TicketPlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  hidden?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Workspace",
    items: [
      {
        title: "仪表盘",
        url: "/dashboard",
        icon: LayoutGridIcon,
      },
    ],
  },
  {
    title: "CMS",
    items: [
      {
        title: "分类管理",
        url: "/cms/categories",
        icon: FolderTreeIcon,
      },
      {
        title: "内容管理",
        url: "/cms/contents",
        icon: FileTextIcon,
      },
    ],
  },
  {
    title: "用户管理",
    items: [
      {
        title: "代理人管理",
        url: "/agents",
        icon: UsersIcon,
      },
    ],
  },
  {
    title: "积分管理",
    items: [
      {
        title: "代理人积分",
        url: "/points/agents",
        icon: TicketPlusIcon,
      },
      {
        title: "积分事项",
        url: "/points/items",
        icon: ScrollTextIcon,
      },
      {
        title: "兑换商品",
        url: "/points/products",
        icon: GiftIcon,
      },
    ],
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tenantName: string;
}

export function AppSidebar({ tenantName, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">
                R
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{tenantName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  Admin Panel
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.filter((item) => !item.hidden).map((item) => {
                  const isActive =
                    pathname === item.url ||
                    (item.url !== "/dashboard" &&
                      pathname.startsWith(item.url));

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.url} />}
                      >
                        <item.icon className="size-4" />
                        {item.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogInIcon className="size-4" />
              退出登录
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
