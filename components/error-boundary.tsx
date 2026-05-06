"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught:", error);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-md space-y-4 rounded-xl border bg-card p-8 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Algo salió mal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ocurrió un error inesperado al renderizar esta pantalla.
              </p>
            </div>
            {process.env.NODE_ENV !== "production" ? (
              <pre className="overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            ) : null}
            <Button onClick={this.reset} variant="outline">
              <RefreshCcw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
