import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "Staff",
    storeId: "",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const createMutation = useMutation({
    mutationFn: (user: any) => apiRequest("POST", "/api/users", user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User created successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, user }: { id: string; user: any }) =>
      apiRequest("PATCH", `/api/users/${id}`, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User updated successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ username: "", password: "", role: "Staff", storeId: "" });
    setEditingUser(null);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
      storeId: user.storeId || "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = { ...formData };
    if (!userData.storeId) {
      delete userData.storeId;
    }
    if (editingUser) {
      if (!userData.password) {
        delete userData.password;
      }
      updateMutation.mutate({ id: editingUser.id, user: userData });
    } else {
      createMutation.mutate(userData);
    }
  };

  const storeMap = new Map(stores.map((s: any) => [s.id, s.name]));

  const columns = [
    { key: "username", label: "Username", sortable: true },
    { key: "role", label: "Role", sortable: true },
    {
      key: "storeId",
      label: "Assigned Store",
      sortable: true,
      render: (item: any) => item.storeId ? storeMap.get(item.storeId) || "N/A" : "All Stores",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update user details" : "Create a new user account"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    required
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password {editingUser && "(leave blank to keep current)"}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    required={!editingUser}
                    data-testid="input-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="role" data-testid="select-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store">Assigned Store (optional for Admin/Manager)</Label>
                  <Select 
                    value={formData.storeId} 
                    onValueChange={(value) => setFormData({ ...formData, storeId: value })}
                  >
                    <SelectTrigger id="store" data-testid="select-store">
                      <SelectValue placeholder="Select store (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific store</SelectItem>
                      {stores.map((store: any) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-user">
                  {editingUser ? "Update" : "Create"} User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users..."
        actions={(item) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(item)}
              data-testid={`button-edit-${item.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`Are you sure you want to delete user "${item.username}"?`)) {
                  deleteMutation.mutate(item.id);
                }
              }}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
