import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global error boundary — catches unhandled JavaScript exceptions in the
 * React component tree and displays a friendly fallback UI instead of a
 * white screen of death.
 *
 * Why a class component? React's `componentDidCatch` lifecycle hook is only
 * available in class components (as of React 18). There's no hooks-based
 * equivalent for error boundaries yet.
 *
 * Common crash scenarios this catches:
 * - Recharts throwing on malformed data (InsightsPage)
 * - Confetti library failing on unsupported browsers
 * - Supabase returning unexpected null values that cause runtime TypeErrors
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // In production, this is where you'd send to an error reporting service
        // like Sentry or LogRocket. For now, we log to console for debugging.
        console.error("[ErrorBoundary]", error, errorInfo.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
                        <p className="max-w-md text-sm text-muted-foreground">
                            An unexpected error occurred. Your data is safe — this is just a display issue.
                        </p>
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </button>
                    {process.env.NODE_ENV === "development" && this.state.error && (
                        <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
