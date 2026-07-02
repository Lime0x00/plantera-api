export class ArticlePolicy {
  canCreate(user: { id: number; role: string }) {
    return user.role === 'admin';
  }

  canView() {
    return true;
  }

  canUpdate(user: { id: number; role: string }, authorId?: number) {
    return user.role === 'admin' || user.id === authorId;
  }

  canDelete(user: { id: number; role: string }, authorId?: number) {
    return user.role === 'admin' || user.id === authorId;
  }
}
