interface AttestationResult {
  verified: boolean;
  nodeId: string;
  challenge: string;
  response: string;
  timestamp: number;
}

const KEY_REGISTRY: Map<string, string> = new Map();

export function registerKey(nodeId: string, keyId: string): void {
  KEY_REGISTRY.set(nodeId, keyId);
}

export function isRegistered(nodeId: string): boolean {
  return KEY_REGISTRY.has(nodeId);
}

export function performAttestation(nodeId: string, keyId: string): AttestationResult {
  const challenge = generateChallenge();
  const response = signChallenge(challenge, keyId);
  const verified = KEY_REGISTRY.get(nodeId) === keyId;

  return {
    verified,
    nodeId,
    challenge,
    response,
    timestamp: Date.now(),
  };
}

function generateChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function signChallenge(challenge: string, keyId: string): string {
  const data = challenge + keyId;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `sig_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export function verifyEventSignature(event: { nodeId: string; signature: string; data: string }, keyId: string): boolean {
  const expected = signChallenge(event.data, keyId);
  return event.signature === expected;
}
