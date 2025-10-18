import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: LucideIcon
}

export function KPICard({ title, value, change, changeType, icon: Icon }: KPICardProps) {
  const changeColor = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-sky-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className={`text-xs ${changeColor[changeType]}`}>
          {change}
        </p>
      </CardContent>
    </Card>
  )
}
