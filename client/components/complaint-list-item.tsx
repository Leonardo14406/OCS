import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import type { Complaint } from "@/lib/types"
import { Calendar, Building2, AlertCircle, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ComplaintListItemProps {
  complaint: Complaint
  viewMode?: "citizen" | "officer"
}

export function ComplaintListItem({ complaint, viewMode = "citizen" }: ComplaintListItemProps) {
  const priorityColors = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  }

  const href = viewMode === "officer" ? `/officer/complaint/${complaint.id}` : `/track?id=${complaint.id}`

  return (
    <Link href={href}>
      <Card className="p-4 transition-all hover:border-primary hover:shadow-md">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-muted-foreground">{complaint.id}</span>
                <StatusBadge status={complaint.status} />
                <Badge className={priorityColors[complaint.priority]} variant="secondary">
                  {complaint.priority}
                </Badge>
              </div>
              <h3 className="line-clamp-1 font-semibold leading-tight text-balance">{complaint.subject}</h3>
            </div>
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">{complaint.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>{complaint.ministry}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{complaint.category}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDistanceToNow(complaint.submittedAt, { addSuffix: true })}</span>
            </div>
            {viewMode === "officer" && complaint.assignedOfficer && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>{complaint.assignedOfficer}</span>
              </div>
            )}
          </div>

          {complaint.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {complaint.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
