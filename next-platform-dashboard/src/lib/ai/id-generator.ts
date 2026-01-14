// Generate unique IDs for Craft.js nodes
let counter = 0;

export function generateNodeId(): string {
  counter++;
  return `node_${Date.now()}_${counter}_${Math.random().toString(36).substr(2, 9)}`;
}

export function resetIdGenerator(): void {
  counter = 0;
}
