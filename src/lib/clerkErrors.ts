/** Extract a human message from a Clerk API error. */
export function clerkErrorMessage(e: unknown): string {
  const errs = (e as { errors?: { longMessage?: string; message?: string }[] })?.errors;
  if (errs && errs.length) return errs[0].longMessage ?? errs[0].message ?? "Something went wrong";
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}
