import { buttonVariants } from "@/components/ui/button";
import { studioLogout } from "@/modules/studio/actions/auth-actions";
import { cn } from "@/lib/utils";

export function StudioLogoutButton() {
  return (
    <form action={studioLogout}>
      <button
        type="submit"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-muted-foreground hover:text-foreground h-8 w-full justify-start px-2.5 text-xs",
        )}
      >
        Sign out
      </button>
    </form>
  );
}
