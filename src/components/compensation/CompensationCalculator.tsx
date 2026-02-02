import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Calculator, Plus, Trash2, DollarSign, Building2, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CompensationEntry {
  id: string;
  website_name: string;
  total_paid: number;
  expenses: number;
  developer_name: string | null;
  notes: string | null;
  date_completed: string;
  created_at: string;
  sales_splits?: SalesSplit[];
}

interface SalesSplit {
  id: string;
  sales_agent_name: string;
  share_amount: number;
}

const CompensationCalculator = () => {
  const [entries, setEntries] = useState<CompensationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Calculation state
  const [calc, setCalc] = useState({
    websiteName: "",
    totalPaid: "",
    expenses: "",
    developerName: "",
    salesAgents: [{ name: "", share: 0 }],
    notes: "",
  });

  // Computed values
  const netAmount = (parseFloat(calc.totalPaid) || 0) - (parseFloat(calc.expenses) || 0);
  const developerShare = netAmount * 0.50;
  const companyShare = netAmount * 0.15;
  const salesShare = netAmount * 0.35;
  const perAgentShare = calc.salesAgents.length > 0 ? salesShare / calc.salesAgents.length : 0;

  // Totals
  const totalCompanyFund = entries.reduce((sum, e) => {
    const net = e.total_paid - e.expenses;
    return sum + (net * 0.15);
  }, 0);

  const totalDeveloperEarnings = entries.reduce((sum, e) => {
    const net = e.total_paid - e.expenses;
    return sum + (net * 0.50);
  }, 0);

  const totalSalesEarnings = entries.reduce((sum, e) => {
    const net = e.total_paid - e.expenses;
    return sum + (net * 0.35);
  }, 0);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("compensation_entries")
      .select("*")
      .order("date_completed", { ascending: false });

    if (!error && data) {
      // Fetch sales splits for each entry
      const entriesWithSplits = await Promise.all(
        data.map(async (entry) => {
          const { data: splits } = await supabase
            .from("compensation_sales_splits")
            .select("*")
            .eq("compensation_entry_id", entry.id);
          return { ...entry, sales_splits: splits || [] };
        })
      );
      setEntries(entriesWithSplits);
    }
    setLoading(false);
  };

  const handleAddAgent = () => {
    setCalc({ ...calc, salesAgents: [...calc.salesAgents, { name: "", share: 0 }] });
  };

  const handleRemoveAgent = (index: number) => {
    setCalc({
      ...calc,
      salesAgents: calc.salesAgents.filter((_, i) => i !== index),
    });
  };

  const handleAgentNameChange = (index: number, name: string) => {
    const newAgents = [...calc.salesAgents];
    newAgents[index].name = name;
    setCalc({ ...calc, salesAgents: newAgents });
  };

  const handleSubmit = async () => {
    if (!calc.websiteName || !calc.totalPaid) {
      toast.error("Website name and total paid are required");
      return;
    }

    const { data: entry, error } = await supabase
      .from("compensation_entries")
      .insert([{
        website_name: calc.websiteName,
        total_paid: parseFloat(calc.totalPaid),
        expenses: parseFloat(calc.expenses) || 0,
        developer_name: calc.developerName || null,
        notes: calc.notes || null,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add entry");
      return;
    }

    // Add sales splits
    if (calc.salesAgents.some(a => a.name)) {
      const splits = calc.salesAgents
        .filter(a => a.name)
        .map(a => ({
          compensation_entry_id: entry.id,
          sales_agent_name: a.name,
          share_amount: perAgentShare,
        }));

      await supabase.from("compensation_sales_splits").insert(splits);
    }

    toast.success("Compensation entry added");
    setCalc({
      websiteName: "",
      totalPaid: "",
      expenses: "",
      developerName: "",
      salesAgents: [{ name: "", share: 0 }],
      notes: "",
    });
    setShowForm(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;

    const { error } = await supabase
      .from("compensation_entries")
      .delete()
      .eq("id", id);

    if (!error) {
      setEntries(entries.filter(e => e.id !== id));
      toast.success("Entry deleted");
    } else {
      toast.error("Failed to delete entry");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Company Fund (15%)</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalCompanyFund)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total accumulated savings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Developers (50%)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalDeveloperEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total developer earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sales Agents (35%)</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalSalesEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total sales commission</p>
          </CardContent>
        </Card>
      </div>

      {/* Calculator Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Compensation Calculator
            </span>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Entry
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Calculate splits: 50% Developer, 35% Sales (split among agents), 15% Company
          </CardDescription>
        </CardHeader>
        
        {showForm && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div>
                  <Label>Website/Project Name *</Label>
                  <Input
                    value={calc.websiteName}
                    onChange={(e) => setCalc({ ...calc, websiteName: e.target.value })}
                    placeholder="e.g., Client XYZ Website"
                  />
                </div>
                <div>
                  <Label>Total Paid (₱) *</Label>
                  <Input
                    type="number"
                    value={calc.totalPaid}
                    onChange={(e) => setCalc({ ...calc, totalPaid: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Expenses (₱)</Label>
                  <Input
                    type="number"
                    value={calc.expenses}
                    onChange={(e) => setCalc({ ...calc, expenses: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Developer Name</Label>
                  <Input
                    value={calc.developerName}
                    onChange={(e) => setCalc({ ...calc, developerName: e.target.value })}
                    placeholder="Developer's name"
                  />
                </div>
                <div>
                  <Label>Sales Agents</Label>
                  <div className="space-y-2">
                    {calc.salesAgents.map((agent, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={agent.name}
                          onChange={(e) => handleAgentNameChange(idx, e.target.value)}
                          placeholder={`Agent ${idx + 1} name`}
                        />
                        {idx > 0 && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveAgent(idx)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddAgent}>
                      <Plus className="w-4 h-4 mr-1" /> Add Agent
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={calc.notes}
                    onChange={(e) => setCalc({ ...calc, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              {/* Results Section */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Calculation Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(calc.totalPaid) || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="font-semibold text-red-400">- {formatCurrency(parseFloat(calc.expenses) || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Net Amount</span>
                    <span className="font-bold text-lg">{formatCurrency(netAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-blue-400">Developer (50%)</span>
                    <span className="font-semibold text-blue-400">{formatCurrency(developerShare)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-green-400">Company (15%)</span>
                    <span className="font-semibold text-green-400">{formatCurrency(companyShare)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-purple-400">Sales Total (35%)</span>
                    <span className="font-semibold text-purple-400">{formatCurrency(salesShare)}</span>
                  </div>
                  {calc.salesAgents.filter(a => a.name).length > 0 && (
                    <div className="pl-4 border-l-2 border-purple-500/30 space-y-1">
                      {calc.salesAgents.filter(a => a.name).map((agent, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{agent.name}</span>
                          <span>{formatCurrency(perAgentShare)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={handleSubmit}>Save Entry</Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compensation History</CardTitle>
          <CardDescription>Past entries with breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Dev (50%)</TableHead>
                <TableHead className="text-right">Company (15%)</TableHead>
                <TableHead className="text-right">Sales (35%)</TableHead>
                <TableHead>Sales Agents</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => {
                const net = entry.total_paid - entry.expenses;
                const devShare = net * 0.50;
                const compShare = net * 0.15;
                const saleShare = net * 0.35;

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(entry.date_completed), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{entry.website_name}</TableCell>
                    <TableCell>{entry.developer_name || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.total_paid)}</TableCell>
                    <TableCell className="text-right text-red-400">{formatCurrency(entry.expenses)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(net)}</TableCell>
                    <TableCell className="text-right text-blue-400">{formatCurrency(devShare)}</TableCell>
                    <TableCell className="text-right text-green-400">{formatCurrency(compShare)}</TableCell>
                    <TableCell className="text-right text-purple-400">{formatCurrency(saleShare)}</TableCell>
                    <TableCell className="text-sm">
                      {entry.sales_splits?.map(s => (
                        <div key={s.id} className="text-muted-foreground">
                          {s.sales_agent_name}: {formatCurrency(s.share_amount)}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No entries yet. Add your first compensation entry above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompensationCalculator;