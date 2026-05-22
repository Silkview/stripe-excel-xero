export default function Footer() {
  return (
    <footer className="border-t border-border px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-text-3">
          © {new Date().getFullYear()} Silkview Sync
        </p>
        <nav className="flex gap-6 text-sm text-text-2">
          <a href="/auth/login" className="hover:text-text">
            Sign in
          </a>
          <a href="/auth/signup" className="hover:text-text">
            Sign up
          </a>
        </nav>
      </div>
    </footer>
  );
}
