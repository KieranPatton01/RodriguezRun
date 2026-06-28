// =============================================================
// ObjectPool.js — Generic object pool to eliminate GC pressure
// Acquire objects from the pool; release them when done.
// =============================================================

export class ObjectPool {
  /**
   * @param {Function} factory  - () => object  Called when pool is empty
   * @param {Function} reset    - (obj) => void  Resets obj state on acquire
   * @param {number}   initial  - Pre-allocate this many objects upfront
   */
  constructor(factory, reset, initial = 0) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];
    this._active = new Set();

    for (let i = 0; i < initial; i++) {
      this._pool.push(this._factory());
    }
  }

  /** Take an object from the pool (or create a new one) */
  acquire() {
    const obj = this._pool.length > 0
      ? this._pool.pop()
      : this._factory();
    this._reset(obj);
    this._active.add(obj);
    return obj;
  }

  /** Return an object to the pool */
  release(obj) {
    if (!this._active.has(obj)) return;
    this._active.delete(obj);
    this._pool.push(obj);
  }

  /** Release all active objects at once */
  releaseAll() {
    this._active.forEach(obj => this._pool.push(obj));
    this._active.clear();
  }

  get activeCount() { return this._active.size; }
  get poolSize()    { return this._pool.length; }
  get active()      { return this._active; }
}
