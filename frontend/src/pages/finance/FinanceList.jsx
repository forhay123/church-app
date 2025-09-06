import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFinances, fetchChurches, confirmFinance } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircleIcon, XCircleIcon, EditIcon, FilterIcon, DollarSignIcon, CalendarIcon, TrendingUp, PieChart } from "lucide-react";

export default function FinanceList() {
  const [finances, setFinances] = useState([]);
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    date: "",
    churchId: "all",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const updatedFilters = { ...filters };
        if (updatedFilters.churchId === "all") {
          updatedFilters.churchId = null;
        }

        const [financesData, churchesData] = await Promise.all([
          fetchFinances(updatedFilters),
          role !== "HEAD_A" ? fetchChurches() : Promise.resolve([]),
        ]);
        setFinances(Array.isArray(financesData) ? financesData : financesData?.data || []);
        setChurches(Array.isArray(churchesData) ? churchesData : churchesData?.data || []);
      } catch (err) {
        console.error(err.message || "Failed to load finance records");
        toast({
          title: "Error",
          description: err.message || "Failed to load finance records.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters, role, toast, refreshTrigger]);

  const handleConfirm = async (id) => {
    try {
      await confirmFinance(id);
      setRefreshTrigger((prev) => prev + 1);
      toast({
        title: "Success",
        description: "Finance record confirmed successfully.",
      });
    } catch (err) {
      console.error(err.message || "Failed to confirm record");
      toast({
        title: "Error",
        description: err.message || "Failed to confirm record.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = (id) => {
    navigate(`/finance/update/${id}`);
  };

  const getChurchName = (id) => churches.find((c) => c.id === id)?.name || "—";

  // Calculate financial statistics
  const financialStats = React.useMemo(() => {
    const totalOfferings = finances.reduce((sum, f) => sum + (f.offerings || 0), 0);
    const totalPartnership = finances.reduce((sum, f) => sum + (f.partnership_offering || 0), 0);
    const confirmedRecords = finances.filter(f => f.confirmed).length;
    const pendingRecords = finances.filter(f => !f.confirmed).length;
    
    return {
      totalOfferings,
      totalPartnership,
      totalIncome: totalOfferings + totalPartnership,
      confirmedRecords,
      pendingRecords,
      totalRecords: finances.length
    };
  }, [finances]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <DollarSignIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading finance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <DollarSignIcon className="w-8 h-8 text-primary" />
            </div>
            Finance Records Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive financial management and analytics</p>
        </div>

        {/* Financial Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Offerings</p>
                  <p className="text-2xl font-bold text-success">₦{financialStats.totalOfferings.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <DollarSignIcon className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Partnership</p>
                  <p className="text-2xl font-bold text-primary">₦{financialStats.totalPartnership.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-warning">₦{financialStats.totalIncome.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl">
                  <PieChart className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Records</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-foreground">{financialStats.totalRecords}</p>
                    <div className="flex gap-1">
                      <Badge variant="default" className="bg-success text-success-foreground text-xs">
                        {financialStats.confirmedRecords}
                      </Badge>
                      <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">
                        {financialStats.pendingRecords}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-muted/10 rounded-xl">
                  <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-card to-card/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FilterIcon className="w-5 h-5 text-primary" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="h-11 border-border/50 focus:border-primary transition-colors"
                />
              </div>
              {role !== "HEAD_A" && (
                <div className="space-y-2 flex-1">
                  <Label className="text-sm font-medium">Church</Label>
                  <Select value={filters.churchId} onValueChange={(value) => handleSelectFilterChange("churchId", value)}>
                    <SelectTrigger className="h-11 border-border/50 focus:border-primary">
                      <SelectValue placeholder="All Churches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Churches</SelectItem>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {finances.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Records Found</h3>
                <p className="text-muted-foreground">No finance records found for the selected filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Service</TableHead>
                      <TableHead className="font-semibold">Host</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold text-right">Offerings</TableHead>
                      <TableHead className="font-semibold text-right">Partnership</TableHead>
                      <TableHead className="font-semibold">Church</TableHead>
                      <TableHead className="font-semibold text-center">Status</TableHead>
                      <TableHead className="font-semibold">Extra Details</TableHead>
                      {(role === "ADMIN" || role === "HEAD_A") && (
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finances.map((f) => (
                      <TableRow key={f.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{f.service_name}</TableCell>
                        <TableCell className="text-muted-foreground">{f.host || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(f.service_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{f.offerings?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{f.partnership_offering?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{getChurchName(f.church_id)}</TableCell>
                        <TableCell className="text-center">
                          {f.confirmed ? (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Confirmed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                              <XCircleIcon className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {f.extra_details && Object.keys(f.extra_details).length > 0 ? (
                            <div className="space-y-1 max-w-xs">
                              {Object.entries(f.extra_details).map(([key, val]) => (
                                <div key={key} className="text-sm">
                                  <span className="font-medium text-foreground">{key}:</span>{" "}
                                  <span className="text-muted-foreground">
                                    {typeof val === "object" && val !== null
                                      ? `${val.value?.toLocaleString?.() ?? val.value}`
                                      : String(val)}
                                  </span>
                                  {typeof val === "object" && val?.type && val.type !== "None" && (
                                    <Badge 
                                      variant={val.type === "Credit" ? "default" : "destructive"} 
                                      className="ml-1 text-xs"
                                    >
                                      {val.type}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {(role === "ADMIN" || (role === "HEAD_A" && !f.confirmed)) && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {role === "ADMIN" && !f.confirmed && (
                                <Button
                                  onClick={() => handleConfirm(f.id)}
                                  size="sm"
                                  className="bg-success hover:bg-success/90 text-success-foreground h-8 px-3"
                                >
                                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                                  Confirm
                                </Button>
                              )}
                              {role === "HEAD_A" && !f.confirmed && (
                                <Button
                                  onClick={() => handleUpdate(f.id)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 border-primary/20 text-primary hover:bg-primary/10"
                                >
                                  <EditIcon className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}