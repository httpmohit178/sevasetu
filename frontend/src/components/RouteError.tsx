import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status}: ${error.statusText || 'This page could not be opened.'}`
    : error instanceof Error ? error.message : 'An unexpected error interrupted this page.';

  return <main className="grid min-h-screen place-items-center bg-background px-4 py-12 text-foreground">
    <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-800"><AlertTriangle size={25}/></div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">SevaSetu</p>
      <h1 className="mt-2 text-2xl font-black">This page hit a problem</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Your account and other pages are safe. Reload this page or return to the home screen.</p>
      <details className="mt-5 rounded-xl bg-muted p-3 text-left text-xs text-muted-foreground"><summary className="cursor-pointer font-semibold">Technical details</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap">{message}</pre></details>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"><RefreshCw size={15}/>Reload</button><Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold"><Home size={15}/>Home</Link></div>
    </section>
  </main>;
}
