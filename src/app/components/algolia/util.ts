export function parseNumberInput(input?: number | string) {
  return typeof input === 'string' ? parseInt(input, 10) : input;
}

export function noop(...args: any[]): void {
  /**/
}
