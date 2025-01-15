import { CheckCircle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepProps {
  title: string
  description?: string
  status: "pending" | "in_progress" | "completed"
}

export function Step({ title, description, status }: StepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative flex items-center">
        {status === "completed" ? (
          <CheckCircle className="h-6 w-6 text-primary" />
        ) : status === "in_progress" ? (
          <Circle className="h-6 w-6 text-primary fill-primary/20" />
        ) : (
          <Circle className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col">
        <span className={cn(
          "text-sm font-medium",
          status === "completed" && "text-primary",
          status === "in_progress" && "text-primary",
          status === "pending" && "text-muted-foreground"
        )}>
          {title}
        </span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  )
}

interface StepsProps {
  children: React.ReactNode
  className?: string
}

export function Steps({ children, className }: StepsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  )
} 