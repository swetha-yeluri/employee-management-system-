// Auth screen shell (login, signup, forgot password). Simple centered form,
// no side branding panel.
export default function AuthLayout({ heading, subheading, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-zinc-900 dark:text-zinc-50">
            {heading}
          </h1>
          {subheading && (
            <p className="mt-1 text-sm text-zinc-500">{subheading}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
