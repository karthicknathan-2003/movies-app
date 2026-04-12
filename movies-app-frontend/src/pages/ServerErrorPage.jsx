import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, SearchX } from "lucide-react";

const ICONS = {
  SERVER_DOWN: AlertTriangle,
  SERVER_ERROR: AlertTriangle,
  TIMEOUT: Clock,
  NOT_FOUND: SearchX,
};

export default function ServerErrorPage({ error }) {
  const Icon = ICONS[error.type] || AlertTriangle;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center space-y-4">
          <Icon className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-xl font-semibold">
            {error.title}
          </h1>

          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>

          <Button className="w-full" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}