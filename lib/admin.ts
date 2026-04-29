export const ADMIN_USER_ID = 'user_3D08pnrLjMAqoXqSzTXdrtLfPqX'
export const ADMIN_EMAIL = 'jhrodriguez6832@gmail.com'

export function isAdmin(userId: string | null): boolean {
  return userId === ADMIN_USER_ID
}
