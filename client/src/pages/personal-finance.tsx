import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PieChart, 
  Wallet, 
  CreditCard,
  Plus,
  Receipt,
  Banknote,
  Gift,
  Clock
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import Header from "@/components/header";
import { useAuth } from "@/hooks/useAuth";

type Period = 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
type FinancialType = 'tips' | 'paycheck' | 'bonus' | 'overtime' | 'personal_expense';
type ExpenseCategory = 'food' | 'transportation' | 'housing' | 'utilities' | 'entertainment' | 'shopping' | 'healthcare' | 'education' | 'savings' | 'other';

interface PersonalFinancialSummary {
  periodStart: string;
  periodEnd: string;
  totalEarnings: number;
  totalExpenses: number;
  netIncome: number;
  breakdown: {
    tips: number;
    paychecks: number;
    bonus: number;
    overtime: number;
    personalExpenses: number;
    workExpenses: number;
  };
  expensesByCategory: Record<string, number>;
}

export default function PersonalFinance() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('weekly');
  const [addRecordDialogOpen, setAddRecordDialogOpen] = useState(false);
  const [recordType, setRecordType] = useState<FinancialType>('tips');
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [shiftType, setShiftType] = useState<"day" | "night">("night");
  const { toast } = useToast();

  // Check if user has access to personal finance features
  const workerRoles = ['dancer', 'bartender', 'server', 'dj', 'host', 'floor_host', 'front_door', 'barback', 'house_mom', 'house_dad'];
  const hasAccess = user && workerRoles.includes(user.role as string);

  // Show access denied message for non-workers
  if (!hasAccess) {
    return (
      <>
        <Header title="Personal Finance" />
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
                <p className="text-gray-600 max-w-md">
                  Personal finance tracking is only available for workers. This feature helps staff members track their personal earnings and expenses.
                </p>
                <p className="text-sm text-gray-500">
                  Your current role: <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const { data: personalSummary, isLoading: summaryLoading, error: summaryError } = useQuery<PersonalFinancialSummary>({
    queryKey: ['/api/financial/personal/summary', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/financial/personal/summary?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch personal financial summary');
      }
      return response.json();
    },
    enabled: hasAccess,
  });

  const { data: expensesByCategory, error: expensesError } = useQuery<Record<string, number>>({
    queryKey: ['/api/financial/personal/expenses-by-category'],
    enabled: hasAccess,
  });

  const { data: records } = useQuery<any[]>({
    queryKey: ['/api/financial/records'],
  });

  const addRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/financial/records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial'] });
      setAddRecordDialogOpen(false);
      setAmount("");
      setDescription("");
      toast({ title: "Success", description: "Financial record added successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleAddRecord = () => {
    if (!amount) return;
    
    const recordData: any = {
      type: recordType,
      amount: parseFloat(amount),
      description,
      isPersonal: recordType === 'personal_expense'
    };

    if (recordType === 'personal_expense') {
      recordData.category = category;
    }

    if (['tips', 'bonus', 'overtime'].includes(recordType)) {
      recordData.shiftType = shiftType;
    }

    addRecordMutation.mutate(recordData);
  };

  const getPeriodLabel = (period: Period) => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'bi_weekly': return 'Last 2 Weeks';
      case 'monthly': return 'This Month';
      default: return 'This Week';
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'tips': return <DollarSign className="w-4 h-4" />;
      case 'paycheck': return <Banknote className="w-4 h-4" />;
      case 'bonus': return <Gift className="w-4 h-4" />;
      case 'overtime': return <Clock className="w-4 h-4" />;
      case 'personal_expense': return <CreditCard className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tips': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'paycheck': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'bonus': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'overtime': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'personal_expense': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Header title="Personal Finance" />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Period Selector and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">My Financial Tracker</h1>
            <Select value={selectedPeriod} onValueChange={(value: Period) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="bi_weekly">Last 2 Weeks</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={addRecordDialogOpen} onOpenChange={setAddRecordDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="add-record-description">
              <DialogHeader>
                <DialogTitle>Add Financial Record</DialogTitle>
                <p id="add-record-description" className="text-sm text-muted-foreground">
                  Track your earnings and expenses with detailed categorization.
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={recordType} onValueChange={(value: FinancialType) => setRecordType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tips">Tips</SelectItem>
                      <SelectItem value="paycheck">Paycheck</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="overtime">Overtime</SelectItem>
                      <SelectItem value="personal_expense">Personal Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {recordType === 'personal_expense' && (
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={(value: ExpenseCategory) => setCategory(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="housing">Housing</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {['tips', 'bonus', 'overtime'].includes(recordType) && (
                  <div>
                    <Label htmlFor="shift">Shift</Label>
                    <Select value={shiftType} onValueChange={(value: "day" | "night") => setShiftType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day Shift</SelectItem>
                        <SelectItem value="night">Night Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes about this transaction..."
                  />
                </div>

                <Button 
                  onClick={handleAddRecord} 
                  disabled={addRecordMutation.isPending || !amount}
                  className="w-full"
                >
                  {addRecordMutation.isPending ? "Adding..." : "Add Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Financial Summary Cards */}
        {summaryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : personalSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(personalSummary.totalEarnings)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(personalSummary.totalExpenses)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Net Income</p>
                    <p className={`text-2xl font-bold ${personalSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(personalSummary.netIncome)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${personalSummary.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Wallet className={personalSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Period</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {getPeriodLabel(selectedPeriod)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(personalSummary.periodStart)} - {formatDate(personalSummary.periodEnd)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Detailed Breakdown */}
        <Tabs defaultValue="breakdown" className="space-y-6">
          <TabsList>
            <TabsTrigger value="breakdown">Income Breakdown</TabsTrigger>
            <TabsTrigger value="expenses">Expense Categories</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle>Income Breakdown - {getPeriodLabel(selectedPeriod)}</CardTitle>
              </CardHeader>
              <CardContent>
                {personalSummary && personalSummary.breakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Tips</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(personalSummary.breakdown.tips || 0)}
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Banknote className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Paychecks</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(personalSummary.breakdown.paychecks || 0)}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Bonuses</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(personalSummary.breakdown.bonus || 0)}
                      </p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-orange-800">Overtime</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(personalSummary.breakdown.overtime || 0)}
                      </p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">Personal Expenses</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(personalSummary.breakdown.personalExpenses || 0)}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-800">Work Expenses</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-600">
                        {formatCurrency(personalSummary.breakdown.workExpenses || 0)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Personal Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {personalSummary && Object.keys(personalSummary.expensesByCategory).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(personalSummary.expensesByCategory).map(([category, amount]) => (
                      <div key={category} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <PieChart className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-800 capitalize">
                            {category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xl font-bold text-gray-600">
                          {formatCurrency(amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No personal expenses recorded yet</p>
                    <p className="text-sm">Add some expense records to see your spending breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records?.slice(0, 10).map((record: any) => (
                        <tr key={record.id} className="border-b">
                          <td className="py-3 text-sm text-gray-600">
                            {formatDateTime(record.createdAt)}
                          </td>
                          <td className="py-3">
                            <Badge className={getTypeColor(record.type)}>
                              <div className="flex items-center gap-1">
                                {getRecordIcon(record.type)}
                                {record.type.replace('_', ' ')}
                              </div>
                            </Badge>
                          </td>
                          <td className="py-3 font-medium">
                            {record.type === 'personal_expense' ? '-' : '+'}
                            {formatCurrency(Number(record.amount))}
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                            {record.description || '-'}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}