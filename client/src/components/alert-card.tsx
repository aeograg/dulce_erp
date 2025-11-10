import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AlertCardProps {
  title: string;
  items: Array<{
    id: string;
    name: string;
    details: string;
  }>;
  type?: "warning" | "info";
  viewAllLink?: string;
}

export function AlertCard({ title, items, type = "warning", viewAllLink }: AlertCardProps) {
  const Icon = type === "warning" ? AlertTriangle : Info;
  const borderColor = type === "warning" ? "border-l-amber-500" : "border-l-primary";

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${type === "warning" ? "text-amber-500" : "text-primary"}`} />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {items.length > 0 && (
          <span className="text-sm font-semibold" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-count`}>
            {items.length}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">All clear!</p>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="pb-3 border-b last:border-0 last:pb-0">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
              </div>
            ))}
            {viewAllLink && items.length > 3 && (
              <Link href={viewAllLink}>
                <Button variant="ghost" size="sm" className="w-full" data-testid="button-view-all-alerts">
                  View All ({items.length})
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
