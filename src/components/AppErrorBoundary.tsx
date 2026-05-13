import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    const normalized =
      error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : JSON.stringify(error));
    return { error: normalized };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FFF9FB] p-6 font-sans text-gray-800 dark:bg-[#18181b] dark:text-gray-100">
          <h1 className="text-xl font-bold">StudyBuddy hit a problem</h1>
          <p className="max-w-md text-center text-sm text-gray-600 dark:text-gray-400">
            The app crashed while loading. Try reloading. If this keeps happening, clear site data for this page or
            restore from a backup export.
          </p>
          <pre className="max-h-40 max-w-lg overflow-auto rounded-xl bg-white/80 p-3 text-xs text-red-600 dark:bg-zinc-900 dark:text-red-400">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-pink-500 px-6 py-3 font-bold text-white shadow-lg hover:bg-pink-600"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
