export class MemoryStorage implements Storage {
  private donnees = new Map<string, string>()
  get length() {
    return this.donnees.size
  }
  clear() {
    this.donnees.clear()
  }
  getItem(cle: string) {
    return this.donnees.get(cle) ?? null
  }
  key(i: number) {
    return [...this.donnees.keys()][i] ?? null
  }
  removeItem(cle: string) {
    this.donnees.delete(cle)
  }
  setItem(cle: string, valeur: string) {
    this.donnees.set(cle, valeur)
  }
}

export class StorageQuiRefuse extends MemoryStorage {
  override setItem(): void {
    throw new DOMException('Quota dépassé', 'QuotaExceededError')
  }
}
