import { useEffect, useState } from "react";
import { fetchFinanceSummary, fetchChurches } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSignIcon, 
  TrendingUpIcon, 
  BuildingIcon, 
  CalendarIcon, 
  FilterIcon,
  PieChartIcon,
  CalculatorIcon
} from "lucide-react";

export default function FinanceSummaryPage({ role }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    date: "",
    churchId: "all",
  });

  const [churches, setChurches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const updatedFilters = { ...filters };
        if (updatedFilters.churchId === "all") {
          updatedFilters.churchId = null;
        }

        const [churchesData, summaryData] = await Promise.all([
          role !== "HEAD_A" ? fetchChurches() : Promise.resolve([]),
          fetchFinanceSummary(updatedFilters),
        ]);

        if (role !== "HEAD_A") {
          setChurches(Array.isArray(churchesData) ? churchesData : churchesData?.data || []);
        }

        const totalExtra = {};
        let netExtra = 0;

        summaryData.church_extra_details?.forEach((church) => {
          Object.entries(church.extra_details).forEach(([key, value]) => {
            const numericValue = Number(value) || 0;
            if (!totalExtra[key]) totalExtra[key] = 0;
            totalExtra[key] += numericValue;
            netExtra += numericValue;
          });
        });

        setSummary({
          ...summaryData,
          total_extra_details: totalExtra,
          net_income:
            (summaryData.total_offerings || 0) +
            (summaryData.total_partnership || 0) +
            netExtra,
        });
      } catch (err) {
        console.error("Failed to fetch data:", err);
        const errorMessage = err.response?.data?.detail || err.message || "Failed to load data. Please try again.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, toast, filters]);

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
            <PieChartIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading financial summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSignIcon className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChartIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
              <p className="text-muted-foreground">No financial data available for the selected criteria.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalExtraValue = Object.values(summary.total_extra_details).reduce((sum, value) => sum + value, 0);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Financial Summary</h1>
          <p className="text-muted-foreground">Comprehensive overview of church financial activities</p>
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

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSignIcon className="w-5 h-5 text-success" />
                Total Offerings
              </CardTitle>
              <CardDescription>Regular service offerings collected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success mb-4">
                ₦{summary.total_offerings.toLocaleString()}
              </div>
              {summary.church_offerings?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">By Church:</h4>
                  <div className="space-y-2">
                    {summary.church_offerings.map((c) => (
                      <div key={c.church_id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-sm font-medium">{c.church_name}</span>
                        <span className="text-sm text-success font-medium">₦{c.offerings.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-accent" />
                Partnership Offerings
              </CardTitle>
              <CardDescription>Special partnership contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-4">
                ₦{summary.total_partnership.toLocaleString()}
              </div>
              {summary.church_partnerships?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">By Church:</h4>
                  <div className="space-y-2">
                    {summary.church_partnerships.map((c) => (
                      <div key={c.church_id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-sm font-medium">{c.church_name}</span>
                        <span className="text-sm text-accent font-medium">₦{c.partnership.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5 text-primary" />
              Additional Financial Details
            </CardTitle>
            <CardDescription>Extra contributions and miscellaneous items</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(summary.total_extra_details).length > 0 ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(summary.total_extra_details).map(([k, v]) => (
                    <div key={k} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{k}</span>
                        <span className={`font-bold ${v >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {v >= 0 ? '+' : '-'}₦{Math.abs(v).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {role !== "HEAD_A" && summary.church_extra_details?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Details by Church:</h4>
                      <div className="space-y-4">
                        {summary.church_extra_details.map((c) => (
                          <div key={c.church_id} className="p-4 bg-muted/20 rounded-lg">
                            <h5 className="font-semibold text-foreground mb-2">{c.church_name}</h5>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {Object.entries(c.extra_details).map(([k, v]) => (
                                <div key={k} className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">{k}:</span>
                                  <span className={`font-medium ${v >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {v >= 0 ? '+' : '-'}₦{Math.abs(v).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSignIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No additional details recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-success">
                <CalculatorIcon className="w-5 h-5" />
                Net Income
              </CardTitle>
              <CardDescription>Total financial income for the period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success mb-4">
                ₦{summary.net_income.toLocaleString()}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Total Offerings:</span>
                  <span>₦{summary.total_offerings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Partnership Offerings:</span>
                  <span>₦{summary.total_partnership.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Extra Details:</span>
                  <span className={totalExtraValue >= 0 ? 'text-success' : 'text-destructive'}>
                    {totalExtraValue >= 0 ? '+' : ''}₦{totalExtraValue.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total Net Income:</span>
                  <span className="text-success">₦{summary.net_income.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-primary">
                <CalendarIcon className="w-5 h-5" />
                Records Summary
              </CardTitle>
              <CardDescription>Financial record statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-4">
                {summary.number_of_records}
              </div>
              <p className="text-muted-foreground">
                Total number of finance records for the selected period
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}