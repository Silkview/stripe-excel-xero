import Button from '@/components/ui/Button';

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="/" className="text-lg font-bold tracking-tight text-text">
          Silkview <span className="text-stripe">Sync</span>
        </a>
        <nav className="flex items-center gap-3">
          <a href="/auth/login" className="text-sm font-medium text-text-2 hover:text-text">
            Sign in
          </a>
          <Button href="/auth/signup" variant="primary" className="!py-2 !px-4">
            Get started
          </Button>
        </nav>
      </div>
    </header>
  );
}
