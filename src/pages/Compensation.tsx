import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Briefcase,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Employee types and commission rates
const COMMISSION_RATES = {
  "Web Developer": 0.4,
  "Sales Agent": 0.3,
};
const COMPANY_RATE = 0.3;

// Employee data
const employees = [
  { id: 1, name: "John Carl", role: "Web Developer" as const, avatar: "JC" },
  { id: 2, name: "Rona", role: "Web Developer" as const, avatar: "RO" },
  { id: 3, name: "Shian", role: "Sales Agent" as const, avatar: "SH" },
];

// Sample sales data (website projects sold)
const salesData = [
  // January
  { id: 1, date: "2024-01-05", projectName: "E-commerce Site A", amount: 5000, salesAgentId: 3, developerId: 1 },
  { id: 2, date: "2024-01-12", projectName: "Portfolio Site B", amount: 2500, salesAgentId: 3, developerId: 2 },
  { id: 3, date: "2024-01-20", projectName: "Business Site C", amount: 3500, salesAgentId: 3, developerId: 1 },
  { id: 4, date: "2024-01-28", projectName: "Landing Page D", amount: 1500, salesAgentId: 3, developerId: 2 },
  // February
  { id: 5, date: "2024-02-03", projectName: "Web App E", amount: 8000, salesAgentId: 3, developerId: 1 },
  { id: 6, date: "2024-02-10", projectName: "Blog Site F", amount: 2000, salesAgentId: 3, developerId: 2 },
  { id: 7, date: "2024-02-18", projectName: "Dashboard G", amount: 6000, salesAgentId: 3, developerId: 1 },
  { id: 8, date: "2024-02-25", projectName: "Corporate Site H", amount: 4500, salesAgentId: 3, developerId: 2 },
  // March
  { id: 9, date: "2024-03-02", projectName: "SaaS Platform I", amount: 12000, salesAgentId: 3, developerId: 1 },
  { id: 10, date: "2024-03-08", projectName: "Portfolio J", amount: 2200, salesAgentId: 3, developerId: 2 },
  { id: 11, date: "2024-03-15", projectName: "E-commerce K", amount: 7500, salesAgentId: 3, developerId: 1 },
  { id: 12, date: "2024-03-22", projectName: "Agency Site L", amount: 5500, salesAgentId: 3, developerId: 2 },
  { id: 13, date: "2024-03-28", projectName: "Startup Site M", amount: 4000, salesAgentId: 3, developerId: 1 },
  // April
  { id: 14, date: "2024-04-05", projectName: "Restaurant Site N", amount: 3000, salesAgentId: 3, developerId: 2 },
  { id: 15, date: "2024-04-12", projectName: "Real Estate O", amount: 9000, salesAgentId: 3, developerId: 1 },
  { id: 16, date: "2024-04-20", projectName: "Booking System P", amount: 11000, salesAgentId: 3, developerId: 2 },
  { id: 17, date: "2024-04-28", projectName: "Consulting Site Q", amount: 4500, salesAgentId: 3, developerId: 1 },
];

type TimePeriod = "week" | "month" | "year";

const Compensation = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Calculate employee earnings
  const employeeEarnings = useMemo(() => {
    return employees.map((emp) => {
      const rate = COMMISSION_RATES[emp.role];
      let totalEarnings = 0;
      let projectCount = 0;

      salesData.forEach((sale) => {
        if (emp.role === "Sales Agent" && sale.salesAgentId === emp.id) {
          totalEarnings += sale.amount * rate;
          projectCount++;
        } else if (emp.role === "Web Developer" && sale.developerId === emp.id) {
          totalEarnings += sale.amount * rate;
          projectCount++;
        }
      });

      return {
        ...emp,
        rate,
        totalEarnings,
        projectCount,
      };
    });
  }, []);

  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr"];
    return months.map((month, idx) => {
      const monthNum = String(idx + 1).padStart(2, "0");
      const monthSales = salesData.filter((s) => s.date.includes(`-${monthNum}-`));
      const totalRevenue = monthSales.reduce((sum, s) => sum + s.amount, 0);
      const companyProfit = totalRevenue * COMPANY_RATE;
      const developerCommissions = monthSales.reduce((sum, s) => sum + s.amount * COMMISSION_RATES["Web Developer"], 0);
      const salesCommissions = monthSales.reduce((sum, s) => sum + s.amount * COMMISSION_RATES["Sales Agent"], 0);

      return {
        month,
        totalRevenue,
        companyProfit,
        developerCommissions,
        salesCommissions,
        projects: monthSales.length,
      };
    });
  }, []);

  // Weekly data (simulated for current month)
  const weeklyData = useMemo(() => {
    return [
      { week: "Week 1", revenue: 8500, companyProfit: 2550, commissions: 5950 },
      { week: "Week 2", revenue: 12000, companyProfit: 3600, commissions: 8400 },
      { week: "Week 3", revenue: 9500, companyProfit: 2850, commissions: 6650 },
      { week: "Week 4", revenue: 15000, companyProfit: 4500, commissions: 10500 },
    ];
  }, []);

  // Yearly totals
  const yearlyTotals = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, s) => sum + s.amount, 0);
    const companyProfit = totalRevenue * COMPANY_RATE;
    const totalCommissions = totalRevenue * (1 - COMPANY_RATE);

    return {
      totalRevenue,
      companyProfit,
      totalCommissions,
      projectCount: salesData.length,
    };
  }, []);

  // Pie chart data for distribution
  const distributionData = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, s) => sum + s.amount, 0);
    return [
      { name: "Company (30%)", value: totalRevenue * 0.3, color: "hsl(var(--primary))" },
      { name: "Developers (40%)", value: totalRevenue * 0.4, color: "hsl(var(--chart-2))" },
      { name: "Sales (30%)", value: totalRevenue * 0.3, color: "hsl(var(--chart-3))" },
    ];
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Sub Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Compensation Portal</h1>
              <p className="text-muted-foreground text-sm">Track salaries, commissions & company earnings</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(yearlyTotals.totalRevenue)}</div>
              <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+12.5% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Company Profit (30%)</CardTitle>
              <Briefcase className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(yearlyTotals.companyProfit)}</div>
              <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>Net income after commissions</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Commissions</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(yearlyTotals.totalCommissions)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span>Dev: 40% | Sales: 30%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects Completed</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{yearlyTotals.projectCount}</div>
              <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+3 from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue & Profit Trend
              </CardTitle>
              <CardDescription>
                {timePeriod === "week" ? "Weekly" : timePeriod === "month" ? "Monthly" : "Yearly"} breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {timePeriod === "week" ? (
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₱${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                      <Area type="monotone" dataKey="companyProfit" stroke="hsl(142, 76%, 36%)" fill="url(#colorProfit)" strokeWidth={2} name="Company Profit" />
                    </AreaChart>
                  ) : (
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₱${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area type="monotone" dataKey="totalRevenue" stroke="hsl(var(--primary))" fill="url(#colorRevenue2)" strokeWidth={2} name="Revenue" />
                      <Area type="monotone" dataKey="companyProfit" stroke="hsl(142, 76%, 36%)" fill="url(#colorProfit2)" strokeWidth={2} name="Company Profit" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
              <CardDescription>How revenue is split</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {distributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Profiles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Employee Earnings
            </CardTitle>
            <CardDescription>Commission breakdown per employee</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {employeeEarnings.map((emp) => (
                <Card key={emp.id} className="bg-muted/30 border-muted">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-14 w-14 bg-primary/20">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {emp.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{emp.name}</h3>
                        <Badge variant={emp.role === "Web Developer" ? "default" : "secondary"}>
                          {emp.role}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Commission Rate</span>
                        <span className="font-semibold text-primary">{emp.rate * 100}%</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Projects</span>
                        <span className="font-semibold">{emp.projectCount}</span>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Earnings</span>
                          <span className="font-bold text-lg text-green-500">
                            {formatCurrency(emp.totalEarnings)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress to ₱50,000</span>
                          <span>{Math.min(100, Math.round((emp.totalEarnings / 50000) * 100))}%</span>
                        </div>
                        <Progress value={Math.min(100, (emp.totalEarnings / 50000) * 100)} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Detailed revenue and commission data per month</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Company Profit (30%)</TableHead>
                  <TableHead className="text-right">Dev Commissions (40%)</TableHead>
                  <TableHead className="text-right">Sales Commissions (30%)</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month} 2024</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-green-500">{formatCurrency(row.companyProfit)}</TableCell>
                    <TableCell className="text-right text-blue-500">{formatCurrency(row.developerCommissions)}</TableCell>
                    <TableCell className="text-right text-purple-500">{formatCurrency(row.salesCommissions)}</TableCell>
                    <TableCell className="text-right">{row.projects}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total (YTD)</TableCell>
                  <TableCell className="text-right">{formatCurrency(yearlyTotals.totalRevenue)}</TableCell>
                  <TableCell className="text-right text-green-500">{formatCurrency(yearlyTotals.companyProfit)}</TableCell>
                  <TableCell className="text-right text-blue-500">
                    {formatCurrency(salesData.reduce((sum, s) => sum + s.amount * 0.4, 0))}
                  </TableCell>
                  <TableCell className="text-right text-purple-500">
                    {formatCurrency(salesData.reduce((sum, s) => sum + s.amount * 0.3, 0))}
                  </TableCell>
                  <TableCell className="text-right">{yearlyTotals.projectCount}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sales History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Project sales history with commission breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Sales Agent</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Dev Commission</TableHead>
                  <TableHead className="text-right">Sales Commission</TableHead>
                  <TableHead className="text-right">Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.slice(-10).reverse().map((sale) => {
                  const developer = employees.find((e) => e.id === sale.developerId);
                  const salesAgent = employees.find((e) => e.id === sale.salesAgentId);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="font-medium">{sale.projectName}</TableCell>
                      <TableCell>{developer?.name}</TableCell>
                      <TableCell>{salesAgent?.name}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(sale.amount)}</TableCell>
                      <TableCell className="text-right text-blue-500">{formatCurrency(sale.amount * 0.4)}</TableCell>
                      <TableCell className="text-right text-purple-500">{formatCurrency(sale.amount * 0.3)}</TableCell>
                      <TableCell className="text-right text-green-500">{formatCurrency(sale.amount * 0.3)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Compensation;
