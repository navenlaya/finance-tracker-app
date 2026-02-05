import { ArrowRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnterDemoButton } from "@/components/landing/enter-demo-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Finance Tracker</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <EnterDemoButton variant="outline" size="sm" />
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground mb-3">
              Personal finance tracking demo
            </p>
            
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Track spending, set budgets, connect your bank.
            </h1>
            
            <p className="text-muted-foreground mb-8 max-w-lg">
              A full-stack finance app built with Next.js, Supabase, and Plaid. 
              No signup required to explore.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <EnterDemoButton>
                Enter Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </EnterDemoButton>
              <Button variant="ghost" asChild>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source Code
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Built with Next.js, TypeScript, Tailwind, Supabase, Plaid</p>
            <p>Demo project</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
