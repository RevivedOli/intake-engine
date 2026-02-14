export function NotConfigured() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-900 text-zinc-100">
      <h1 className="text-xl font-semibold mb-2">Form not set up</h1>
      <p className="text-zinc-400 text-center max-w-md">
        This form is not set up yet. Please check the URL or contact the site
        administrator.
      </p>
    </main>
  );
}
