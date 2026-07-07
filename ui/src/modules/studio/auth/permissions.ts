import { auth } from "@/auth";
import type { StudioRole } from "@/generated/prisma/client";

export class StudioAuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "StudioAuthError";
  }
}

export type StudioActor = {
  id: string;
  email: string;
  role: StudioRole;
  name?: string | null;
};

export function unauthorized(): { ok: false; error: string } {
  return { ok: false, error: "Unauthorized" };
}

export function isStudioAuthError(error: unknown): boolean {
  return error instanceof StudioAuthError;
}

async function readSessionUser(): Promise<StudioActor | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email || !session.user.role) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    name: session.user.name,
  };
}

export async function requireAuth(): Promise<StudioActor> {
  const user = await readSessionUser();

  if (!user) {
    throw new StudioAuthError();
  }

  return user;
}

export async function requireAdmin(): Promise<StudioActor> {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    throw new StudioAuthError("Admin access required");
  }

  return user;
}

export async function requireEditor(): Promise<StudioActor> {
  const user = await requireAuth();

  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    throw new StudioAuthError("Editor access required");
  }

  return user;
}

export async function requireModerator(): Promise<StudioActor> {
  const user = await requireAuth();

  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    throw new StudioAuthError("Moderator access required");
  }

  return user;
}

export async function requireEditorOrUnauthorized(): Promise<
  StudioActor | { ok: false; error: string }
> {
  try {
    return await requireEditor();
  } catch (error) {
    if (isStudioAuthError(error)) {
      return unauthorized();
    }
    throw error;
  }
}

export async function requireModeratorOrUnauthorized(): Promise<
  StudioActor | { ok: false; error: string }
> {
  try {
    return await requireModerator();
  } catch (error) {
    if (isStudioAuthError(error)) {
      return unauthorized();
    }
    throw error;
  }
}

export async function requireAdminOrUnauthorized(): Promise<
  StudioActor | { ok: false; error: string }
> {
  try {
    return await requireAdmin();
  } catch (error) {
    if (isStudioAuthError(error)) {
      return unauthorized();
    }
    throw error;
  }
}

export function auditActor(actor: StudioActor): string {
  return actor.email;
}

export function isUnauthorizedResult(
  result: StudioActor | { ok: false; error: string },
): result is { ok: false; error: string } {
  return "ok" in result;
}
