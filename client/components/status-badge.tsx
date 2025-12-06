import { Badge } from "@/components/ui/badge"
import type { ComplaintStatus } from "@/lib/types"
import { Clock, Eye, Search, CheckCircle, XCircle, Archive } from "lucide-react"

interface StatusBadgeProps {
  status: ComplaintStatus
  showIcon?: boolean
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = {
    submitted: {
      label: "Submitted",
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    under_review: {
      label: "Under Review",
      variant: "secondary" as const,
      icon: Eye,
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    },
    investigating: {
      label: "Investigating",
      variant: "default" as const,
      icon: Search,
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    },
    resolved: {
      label: "Resolved",
      variant: "default" as const,
      icon: CheckCircle,
      className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    closed: {
      label: "Closed",
      variant: "outline" as const,
      icon: Archive,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
      icon: XCircle,
      className: "",
    },
  }

  const { label, variant, icon: Icon, className } = config[status]

  return (
    <Badge variant={variant} className={`${className} flex items-center gap-1 w-fit`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  )
}
