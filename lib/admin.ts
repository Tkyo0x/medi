export const ADMINS = [
  { id: 'user_3D08pnrLjMAqoXqSzTXdrtLfPqX', email: 'jhrodriguez6832@gmail.com' },
  { id: 'user_3D0AaVCGM6j0pt6hpAyH9jOxtvW', email: 'yerikalessandro718@gmail.com' },
  { id: 'user_3DC4XIn7Bh6Ulc16sfN2NSAoDuo', email: 'obs2cuceps@colsanitas.com' },
]

export function isAdmin(userId: string | null): boolean {
  return ADMINS.some(a => a.id === userId)
}