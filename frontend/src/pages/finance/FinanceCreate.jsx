import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFinance } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, MinusIcon, DollarSignIcon, CalendarIcon } from "lucide-react";

export default function FinanceCreate() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = localStorage.getItem("role");

  const [form, setForm] = useState({
    service_name: "",
    service_date: "",
    venue: "",
    host: "",
    hours: 0,
    offerings: 0,
    partnership_offering: 0,
    extra_details: {},
    church_id: user?.church_id || null,
  });

  const [extraKey, setExtraKey] = useState("");
  const [extraValue, setExtraValue] = useState("");
  const [extraType, setExtraType] = useState("None");

  if (role !== "HEAD_A") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSignIcon className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">Only HEAD_A can create finance records.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? (value === "" ? "" : Number(value)) : value;
    setForm({ ...form, [name]: val });
  };

  const addExtraDetail = () => {
    if (!extraKey) return;

    let parsedValue = extraValue;
    if (!isNaN(extraValue) && extraValue.trim() !== "") {
      parsedValue = Number(extraValue);
    }

    setForm({
      ...form,
      extra_details: {
        ...form.extra_details,
        [extraKey]: { value: parsedValue, type: extraType },
      },
    });

    setExtraKey("");
    setExtraValue("");
    setExtraType("None");
  };

  const removeExtraDetail = (key) => {
    const updated = { ...form.extra_details };
    delete updated[key];
    setForm({ ...form, extra_details: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        service_date: new Date(form.service_date).toISOString(),
      };
      await createFinance(payload);
      navigate("/finance/list");
    } catch (err) {
      console.error(err.message || "Failed to create finance record");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Finance Record</h1>
          <p className="text-muted-foreground">Record financial details for church services and activities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Service Information
              </CardTitle>
              <CardDescription>Basic details about the church service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="service_name" className="text-sm font-medium">Service Name *</Label>
                  <Input
                    id="service_name"
                    name="service_name"
                    value={form.service_name}
                    onChange={handleChange}
                    required
                    className="h-11 border-border/50 focus:border-primary transition-colors"
                    placeholder="e.g., Sunday Service, Prayer Meeting"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_date" className="text-sm font-medium">Service Date *</Label>
                  <Input
                    id="service_date"
                    type="date"
                    name="service_date"
                    value={form.service_date}
                    onChange={handleChange}
                    required
                    className="h-11 border-border/50 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue" className="text-sm font-medium">Venue</Label>
                  <Input
                    id="venue"
                    name="venue"
                    value={form.venue}
                    onChange={handleChange}
                    className="h-11 border-border/50 focus:border-primary transition-colors"
                    placeholder="Location or venue name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="host" className="text-sm font-medium">Host</Label>
                  <Input
                    id="host"
                    name="host"
                    value={form.host}
                    onChange={handleChange}
                    className="h-11 border-border/50 focus:border-primary transition-colors"
                    placeholder="Host or officiant name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-sm font-medium">Duration (Hours)</Label>
                  <Input
                    id="hours"
                    type="number"
                    name="hours"
                    value={form.hours}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    className="h-11 border-border/50 focus:border-primary transition-colors"
                    placeholder="Service duration"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSignIcon className="w-5 h-5 text-success" />
                Financial Information
              </CardTitle>
              <CardDescription>Record offerings and donations received</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="offerings" className="text-sm font-medium">Offerings (₦)</Label>
                  <Input
                    id="offerings"
                    type="number"
                    step="0.01"
                    name="offerings"
                    value={form.offerings}
                    onChange={handleChange}
                    min="0"
                    className="h-11 border-border/50 focus:border-primary transition-colors"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnership_offering" className="text-sm font-medium">Partnership Offering (₦)</Label>
                  <Input
                    id="partnership_offering"
                    type="number"
                    step="0.01"
                    name="partnership_offering"
                    value={form.partnership_offering}
                    onChange={handleChange}
                    min="0"
                    className="h-11 border-border/50 focus:border-primary transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-4">
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Add any extra financial details or notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Detail name"
                  value={extraKey}
                  onChange={(e) => setExtraKey(e.target.value)}
                  className="flex-1 h-11 border-border/50 focus:border-primary transition-colors"
                />
                <Input
                  placeholder="Amount or value"
                  value={extraValue}
                  onChange={(e) => setExtraValue(e.target.value)}
                  className="flex-1 h-11 border-border/50 focus:border-primary transition-colors"
                />
                <Select value={extraType} onValueChange={setExtraType}>
                  <SelectTrigger className="w-full sm:w-32 h-11 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Debit">Debit</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={addExtraDetail}
                  className="h-11 px-4 bg-primary hover:bg-primary/90 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>

              {Object.keys(form.extra_details).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Added Details:</h4>
                  <div className="space-y-2">
                    {Object.entries(form.extra_details).map(([key, data]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{key}:</span>
                          <span className="text-muted-foreground">{data.value}</span>
                          <Badge variant={data.type === "Credit" ? "default" : data.type === "Debit" ? "destructive" : "secondary"}>
                            {data.type}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExtraDetail(key)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 sm:flex-none h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Finance Record
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/finance/list")}
              className="h-12 px-6 border-border/50 hover:bg-muted/50 transition-colors"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}