import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Check, X } from "lucide-react";

const APP_PAGES = [
  { path: "/", label: "Dashboard" },
  { path: "/products", label: "Products" },
  { path: "/ingredients", label: "Ingredients" },
  { path: "/recipes", label: "Recipes" },
  { path: "/stock-entry", label: "Stock Entry" },
  { path: "/sales-data-entry", label: "Sales Data Entry" },
  { path: "/reports", label: "Reports" },
  { path: "/cost-analysis", label: "Cost Analysis" },
  { path: "/users", label: "Users" },
  { path: "/delivery-forecast", label: "Delivery Forecast" },
  { path: "/deliveries", label: "Deliveries" },
  { path: "/stock-control", label: "Stock Control" },
  { path: "/remaining-stock", label: "Remaining Stock" },
  { path: "/inventory", label: "Inventory" },
  { path: "/authorization", label: "Authorization" },
  { path: "/needs-list", label: "Needs List" },
];

interface UserData {
  id: string;
  username: string;
  role: string;
  storeId?: string;
}

interface Permission {
  id: string;
  userId: string;
  pagePath: string;
  allowed: number;
}

export default function Authorization() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
  });

  const { data: userPermissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/permissions", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      const res = await fetch(`/api/permissions/${selectedUser.id}`);
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json();
    },
    enabled: !!selectedUser?.id,
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async (data: { userId: string; permissions: Array<{ pagePath: string; allowed: boolean }> }) =>
      apiRequest("POST", "/api/permissions/batch", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions", selectedUser?.id] });
      toast({ title: "Permissions saved successfully" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handlePermissionChange = (pagePath: string, checked: boolean) => {
    setPermissions((prev) => ({ ...prev, [pagePath]: checked }));
  };

  const handleSave = () => {
    if (!selectedUser) return;
    
    const permissionsList = APP_PAGES.map((page) => ({
      pagePath: page.path,
      allowed: permissions[page.path] ?? true,
    }));
    
    savePermissionsMutation.mutate({
      userId: selectedUser.id,
      permissions: permissionsList,
    });
  };

  // Initialize permissions when user permissions load or when dialog opens
  useEffect(() => {
    if (!dialogOpen || !selectedUser) return;
    
    if (userPermissions.length > 0) {
      const perms: Record<string, boolean> = {};
      for (const perm of userPermissions) {
        perms[perm.pagePath] = perm.allowed === 1;
      }
      setPermissions(perms);
    } else {
      // Default all to true for new users
      const perms: Record<string, boolean> = {};
      for (const page of APP_PAGES) {
        perms[page.path] = true;
      }
      setPermissions(perms);
    }
  }, [userPermissions, dialogOpen, selectedUser]);

  if (isLoading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Authorization
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage page access permissions for each user
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card 
            key={user.id} 
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => handleUserClick(user)}
            data-testid={`card-user-${user.id}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  {user.username}
                </CardTitle>
                <Badge variant={user.role === "Admin" ? "default" : user.role === "Manager" ? "secondary" : "outline"}>
                  {user.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Click to manage page access permissions
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permissions for {selectedUser?.username}
            </DialogTitle>
            <DialogDescription>
              Select which pages this user can access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {APP_PAGES.map((page) => (
              <div 
                key={page.path} 
                className="flex items-center justify-between p-3 rounded-md border"
                data-testid={`permission-${page.path}`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`perm-${page.path}`}
                    checked={permissions[page.path] ?? true}
                    onCheckedChange={(checked) => handlePermissionChange(page.path, !!checked)}
                    data-testid={`checkbox-${page.path}`}
                  />
                  <label htmlFor={`perm-${page.path}`} className="cursor-pointer">
                    {page.label}
                  </label>
                </div>
                {permissions[page.path] !== false ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={savePermissionsMutation.isPending}
              data-testid="button-save-permissions"
            >
              {savePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
