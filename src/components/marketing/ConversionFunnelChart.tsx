import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

interface ConversionFunnelChartProps {
  data: Array<{
    stage: string;
    value: number;
    percentage?: number;
  }>;
  title?: string;
  description?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function ConversionFunnelChart({ 
  data, 
  title = "Funil de Conversão",
  description 
}: ConversionFunnelChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="stage" type="category" width={100} />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => {
                const percentage = props.payload.percentage;
                return [
                  `${value.toLocaleString()}${percentage ? ` (${percentage.toFixed(1)}%)` : ''}`,
                  name
                ];
              }}
              labelStyle={{ color: '#000' }}
            />
            <Bar dataKey="value" name="Quantidade">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

