import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Users, Package, Receipt, FileMinus, BarChart3, UserCog, Settings,
  ChevronDown, ShoppingCart, ShoppingBag, History,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

const main = [
  { title: "Home", url: "/", icon: Home },
  { title: "Parties", url: "/parties", icon: Users },
  { title: "Items", url: "/items", icon: Package },
];

const billChildren = [
  { title: "Sales Bill", url: "/bills/sales", icon: ShoppingCart },
  { title: "Estimate", url: "/bills/estimate", icon: FileText },
  { title: "Purchase Bill", url: "/bills/purchase", icon: ShoppingBag },
  { title: "History", url: "/bills/history", icon: History },
];

const more = [
  { title: "Debit Note", url: "/debit-note", icon: FileMinus },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Payroll", url: "/payroll", icon: UserCog },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const billsActive = pathname.startsWith("/bills");
  const [billsOpen, setBillsOpen] = useState(billsActive);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 w-full ${
      isActive
        ? "bg-primary-soft text-primary font-medium"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            I
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Inventra</span>
              <span className="text-[11px] text-muted-foreground">Inventory Suite</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((m) => (
                <SidebarMenuItem key={m.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={m.url} end className={linkCls}>
                      <m.icon className="h-4 w-4" />
                      {!collapsed && <span>{m.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <Collapsible open={billsOpen} onOpenChange={setBillsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={
                        billsActive
                          ? "bg-primary-soft text-primary font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      <Receipt className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>Bills</span>
                          <ChevronDown
                            className={`ml-auto h-4 w-4 transition-transform ${
                              billsOpen ? "rotate-180" : ""
                            }`}
                          />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {billChildren.map((c) => (
                          <SidebarMenuSubItem key={c.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={c.url} className={linkCls}>
                                <c.icon className="h-4 w-4" />
                                <span>{c.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {more.map((m) => (
                <SidebarMenuItem key={m.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={m.url} end className={linkCls}>
                      <m.icon className="h-4 w-4" />
                      {!collapsed && <span>{m.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
