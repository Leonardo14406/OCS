import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { EvidenceItem } from "@/lib/types"
import { FileText, Download, Eye, Calendar } from "lucide-react"
import { format } from "date-fns"

interface EvidenceViewerProps {
  evidence: EvidenceItem[]
}

export function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("image")) return "🖼️"
    if (fileType.includes("zip")) return "📦"
    return "📎"
  }

  if (evidence.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Evidence Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No evidence files submitted with this complaint.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Evidence Files
          <Badge variant="secondary">{evidence.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {evidence.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getFileIcon(file.fileType)}</div>
                <div className="flex-1">
                  <p className="font-medium leading-tight">{file.fileName}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(file.uploadedAt, "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {/* TODO: Replace with real file storage system */}
          Note: File viewing and downloading currently use placeholder URLs. Replace with actual file storage
          integration.
        </p>
      </CardContent>
    </Card>
  )
}
