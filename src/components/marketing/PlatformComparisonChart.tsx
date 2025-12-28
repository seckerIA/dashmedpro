import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/currency";

interface PlatformComparisonChartProps {
  data: Array<{
    name: string;
    spend: number;
    revenue: number;
    conversions?: number;
    roas?: number;
  }>;
  title?: string;
  description?: string;
}

export function PlatformComparisonChart({ 
  data, 
  title = "Comparativo de Plataformas",
  description 
}: PlatformComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
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
            <Bar dataKey="spend" fill="#ef4444" name="Gasto" />
            <Bar dataKey="revenue" fill="#10b981" name="Receita" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


