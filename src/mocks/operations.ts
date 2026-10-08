/** Registry of mocked operations, used by failure rules and the control panel. */
export interface OperationInfo {
  id: string
  label: string
  method: string
  path: string
}

const operations = new Map<string, OperationInfo>()

export function registerOperation(info: OperationInfo) {
  operations.set(info.id, info)
}

export function listOperations() {
  return [...operations.values()].sort((a, b) => a.id.localeCompare(b.id))
}
