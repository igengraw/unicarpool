const auditRecords = [];

export async function writeAuditRecord(record) {
  auditRecords.push(record);
  return record;
}

export function getAuditRecords() {
  return [...auditRecords];
}
