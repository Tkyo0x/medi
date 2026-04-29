export const ADMINS = [
  { id: 'user_3D08pnrLjMAqoXqSzTXdrtLfPqX', email: 'jhrodriguez6832@gmail.com' },
  { id: 'user_3D0AaVCGM6j0pt6hpAyH9jOxtvW', email: 'yerikalessandro718@gmail.com' },
]

export function isAdmin(userId: string | null): boolean {
  return ADMINS.some(a => a.id === userId)
}