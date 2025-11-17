import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth, RequireAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Ingredients from "@/pages/ingredients";
import Recipes from "@/pages/recipes";
import StockEntry from "@/pages/stock-entry";
import SalesDataEntry from "@/pages/sales-data-entry";
import Reports from "@/pages/reports";
import CostAnalysis from "@/pages/cost-analysis";
import Users from "@/pages/users";
import DeliveryForecast from "@/pages/delivery-forecast";
import Deliveries from "@/pages/deliveries";
import StockControl from "@/pages/stock-control";
import RemainingStock from "@/pages/remaining-stock";
import ProductionEntry from "@/pages/production-entry";
import InventoryDashboard from "@/pages/inventory-dashboard";

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  const style = {
    "--sidebar-width": "16rem",
  };

  if (location === "/login") {
    return <Login />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar currentUser={user || undefined} onLogout={logout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <Switch>
              <Route path="/">
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              </Route>
              <Route path="/products">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <Products />
                </RequireAuth>
              </Route>
              <Route path="/ingredients">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <Ingredients />
                </RequireAuth>
              </Route>
              <Route path="/recipes">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <Recipes />
                </RequireAuth>
              </Route>
              <Route path="/stock-entry">
                <RequireAuth>
                  <StockEntry />
                </RequireAuth>
              </Route>
              <Route path="/sales-data-entry">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <SalesDataEntry />
                </RequireAuth>
              </Route>
              <Route path="/reports">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <Reports />
                </RequireAuth>
              </Route>
              <Route path="/cost-analysis">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <CostAnalysis />
                </RequireAuth>
              </Route>
              <Route path="/users">
                <RequireAuth roles={["Admin"]}>
                  <Users />
                </RequireAuth>
              </Route>
              <Route path="/delivery-forecast">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <DeliveryForecast />
                </RequireAuth>
              </Route>
              <Route path="/deliveries">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <Deliveries />
                </RequireAuth>
              </Route>
              <Route path="/stock-control">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <StockControl />
                </RequireAuth>
              </Route>
              <Route path="/remaining-stock">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <RemainingStock />
                </RequireAuth>
              </Route>
              <Route path="/production-entry">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <ProductionEntry />
                </RequireAuth>
              </Route>
              <Route path="/inventory-dashboard">
                <RequireAuth roles={["Admin", "Manager"]}>
                  <InventoryDashboard />
                </RequireAuth>
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
