/**
 * Strategy base: each assistant platform implements `getFiles(config)`.
 */
export class Platform {
  /**
   * @param {string} key
   * @param {string} label
   */
  constructor(key, label) {
    this.key = key;
    this.label = label;
  }

  /** @param {Record<string, unknown>} _config */
  async getFiles(_config) {
    throw new Error(`${this.key}: getFiles() not implemented`);
  }
}
