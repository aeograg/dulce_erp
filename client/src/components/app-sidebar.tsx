import { Home, Package, ClipboardList, DollarSign, FileText, Settings, LogOut, Wheat, Users, CookingPot, ShoppingCart, TrendingUp, Truck, Database, BarChart3, Factory, Boxes } from "lucide-react";
import { Link, useLocation } from "wouter";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: Home, roles: ["Admin", "Manager", "Staff"] },
  { title: "Products", url: "/products", icon: Package, roles: ["Admin", "Manager"] },
  { title: "Stock Entry", url: "/stock-entry", icon: ClipboardList, roles: ["Admin", "Manager", "Staff"] },
  { title: "Sales Data Entry", url: "/sales-data-entry", icon: ShoppingCart, roles: ["Admin", "Manager"] },
  { title: "Deliveries", url: "/deliveries", icon: Truck, roles: ["Admin", "Manager"] },
  { title: "Stock Control", url: "/stock-control", icon: Database, roles: ["Admin", "Manager"] },
  { title: "Remaining Stock", url: "/remaining-stock", icon: BarChart3, roles: ["Admin", "Manager"] },
  { title: "Production Entry", url: "/production-entry", icon: Factory, roles: ["Admin", "Manager"] },
  { title: "Inventory Dashboard", url: "/inventory-dashboard", icon: Boxes, roles: ["Admin", "Manager"] },
  { title: "Delivery Forecast", url: "/delivery-forecast", icon: TrendingUp, roles: ["Admin", "Manager"] },
  { title: "Ingredients", url: "/ingredients", icon: Wheat, roles: ["Admin", "Manager"] },
  { title: "Recipes", url: "/recipes", icon: CookingPot, roles: ["Admin", "Manager"] },
  { title: "Reports", url: "/reports", icon: FileText, roles: ["Admin", "Manager"] },
  { title: "Cost Analysis", url: "/cost-analysis", icon: DollarSign, roles: ["Admin", "Manager"] },
  { title: "Users", url: "/users", icon: Users, roles: ["Admin"] },
];

interface AppSidebarProps {
  currentUser?: {
    username: string;
    role: string;
  };
  onLogout?: () => void;
}

export function AppSidebar({ currentUser, onLogout }: AppSidebarProps) {
  const [location] = useLocation();

  const filteredItems = currentUser
    ? menuItems.filter((item) => item.roles.includes(currentUser.role))
    : menuItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <Wheat className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Bakery ERP</h1>
            <p className="text-xs text-muted-foreground">Inventory Management</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        {currentUser && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-md">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-muted">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.username}</p>
                <p className="text-xs text-muted-foreground">{currentUser.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
