import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/app/studio/login/actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StudioLoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function StudioLoginPage({
  searchParams,
}: StudioLoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/studio";
  const showError = params.error === "invalid";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="border-border/70 bg-card w-full max-w-md rounded-xl border p-8 shadow-sm">
        <div className="mb-8 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Balık Oltamda Studio
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in with your Studio account.
          </p>
        </div>

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {showError ? (
            <p className="text-coral text-sm">Invalid email or password.</p>
          ) : null}

          <button
            type="submit"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
