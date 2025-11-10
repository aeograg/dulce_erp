import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          currentUser={{
            username: "admin",
            role: "Admin",
          }}
          onLogout={() => console.log("Logout triggered")}
        />
      </div>
    </SidebarProvider>
  );
}
