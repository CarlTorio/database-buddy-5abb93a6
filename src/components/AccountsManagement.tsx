import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Code, Users, Trash2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CreateAccountDialog from "./CreateAccountDialog";

interface UserAccount {
  id: string;
  full_name: string;
  password: string;
  role: "developer" | "salesAgent";
  created_at: string;
}

const AccountsManagement = () => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"developer" | "salesAgent">("developer");

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts((data as UserAccount[]) || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s account?`)) return;

    try {
      const { error } = await supabase.from("user_accounts").delete().eq("id", id);
      if (error) throw error;

      toast.success(`Account deleted successfully`);
      fetchAccounts();
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error("Failed to delete account");
    }
  };

  const openCreateDialog = (role: "developer" | "salesAgent") => {
    setSelectedRole(role);
    setCreateDialogOpen(true);
  };

  const getFirstName = (fullName: string) => fullName.split(" ")[0];

  const developerAccounts = accounts.filter((a) => a.role === "developer");
  const salesAccounts = accounts.filter((a) => a.role === "salesAgent");

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Account Management
              </CardTitle>
              <CardDescription>Create and manage team accounts</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => openCreateDialog("developer")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              <Code className="w-4 h-4 mr-2" />
              Create Dev Account
            </Button>
            <Button
              onClick={() => openCreateDialog("salesAgent")}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              <Users className="w-4 h-4 mr-2" />
              Create Sales Account
            </Button>
          </div>

          {/* Developers Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-500" />
              Developer Accounts ({developerAccounts.length})
            </h3>
            {developerAccounts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No developer accounts yet</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {developerAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                            {getFirstName(account.full_name)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{account.full_name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {account.password}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAccount(account.id, account.full_name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Sales Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              Sales Accounts ({salesAccounts.length})
            </h3>
            {salesAccounts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No sales accounts yet</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-green-500 border-green-500/30">
                            {getFirstName(account.full_name)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{account.full_name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {account.password}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAccount(account.id, account.full_name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateAccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        role={selectedRole}
        onAccountCreated={fetchAccounts}
      />
    </>
  );
};

export default AccountsManagement;
