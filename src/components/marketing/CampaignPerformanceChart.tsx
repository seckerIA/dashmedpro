import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/currency";

interface CampaignPerformanceChartProps {
  data: Array<{
    date: string;
    spend: number;
    revenue: number;
    impressions?: number;
    clicks?: number;
  }>;
  title?: string;
  description?: string;
}

export function CampaignPerformanceChart({ 
  data, 
  title = "Performance da Campanha",
  description 
}: CampaignPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'spend' || name === 'revenue') {
                  return formatCurrency(value);
                }
                return value.toLocaleString();
              }}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="spend" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Gasto"
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Receita"
            />
            {data[0]?.impressions !== undefined && (
              <Line 
                type="monotone" 
                dataKey="impressions" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Impressões"
                yAxisId="right"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

