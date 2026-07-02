export class PostPolicy {
  canCreate(_user: { id: number; role: string }) {
    return true;
  }

  canView() {
    return true;
  }

  canUpdate(user: { id: number; role: string }, authorId: number) {
    return user.id === authorId || user.role === 'admin';
  }

  canDelete(user: { id: number; role: string }, authorId: number) {
    return user.id === authorId || user.role === 'admin';
  }
}
