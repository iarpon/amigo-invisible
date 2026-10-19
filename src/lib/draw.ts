export interface DrawResult {
  giverId: string;
  receiverId: string;
}

export type ExclusionsMap = Record<string, string[]>;

/**
 * Calculates a valid Secret Santa assignment respecting exclusion rules.
 * Uses a randomized backtracking algorithm with MRV (Minimum Remaining Values) heuristic.
 * 
 * Guarantees:
 * 1. Nobody gives to themselves (giverId !== receiverId).
 * 2. Nobody gives to anyone in their exclusion list.
 * 3. Everyone gives to exactly one person.
 * 4. Everyone receives from exactly one person.
 * 5. Uniformly randomized across attempts.
 */
export function calculateDraw(
  participantIds: string[],
  exclusionsMap: ExclusionsMap = {}
): DrawResult[] {
  if (participantIds.length < 2) {
    throw new Error('Se necesitan al menos 2 participantes para realizar el sorteo.');
  }

  // Pre-validate individual candidate sets
  for (const giver of participantIds) {
    const excluded = new Set(exclusionsMap[giver] || []);
    const validReceivers = participantIds.filter(
      (receiver) => receiver !== giver && !excluded.has(receiver)
    );
    if (validReceivers.length === 0) {
      throw new Error(
        `El participante con ID ${giver} tiene tantas exclusiones que no tiene a quién regalar.`
      );
    }
  }

  const MAX_RESTARTS = 200;

  for (let attempt = 0; attempt < MAX_RESTARTS; attempt++) {
    const solution = trySolveDraw(participantIds, exclusionsMap);
    if (solution) {
      return solution;
    }
  }

  throw new Error(
    'No ha sido posible encontrar una asignación válida con las exclusiones actuales. Por favor, relaja alguna de las restricciones e inténtalo de nuevo.'
  );
}

function trySolveDraw(
  participantIds: string[],
  exclusionsMap: ExclusionsMap
): DrawResult[] | null {
  const givers = [...participantIds];
  const assignedReceivers = new Set<string>();
  const assignment: Record<string, string> = {};

  function backtrack(): boolean {
    if (Object.keys(assignment).length === participantIds.length) {
      return true;
    }

    // MRV Heuristic: choose the unassigned giver with the least remaining candidate receivers
    let chosenGiver: string | null = null;
    let minCandidates = Infinity;
    let bestCandidates: string[] = [];

    // Shuffle unassigned givers to break ties randomly
    const unassignedGivers = givers.filter((g) => !(g in assignment));
    shuffle(unassignedGivers);

    for (const giver of unassignedGivers) {
      const excluded = new Set(exclusionsMap[giver] || []);
      const candidates = participantIds.filter(
        (receiver) =>
          receiver !== giver &&
          !assignedReceivers.has(receiver) &&
          !excluded.has(receiver)
      );

      if (candidates.length === 0) {
        // Dead end reached
        return false;
      }

      if (candidates.length < minCandidates) {
        minCandidates = candidates.length;
        chosenGiver = giver;
        bestCandidates = candidates;
      }
    }

    if (!chosenGiver) return false;

    // Shuffle the candidate receivers to ensure uniform distribution
    shuffle(bestCandidates);

    // Optional tie-breaker: if N >= 4, deprioritize immediate reciprocal pairing (A->B if B->A)
    if (participantIds.length >= 4) {
      bestCandidates.sort((a, b) => {
        const aIsReciprocal = assignment[a] === chosenGiver ? 1 : 0;
        const bIsReciprocal = assignment[b] === chosenGiver ? 1 : 0;
        return aIsReciprocal - bIsReciprocal;
      });
    }

    for (const receiver of bestCandidates) {
      assignment[chosenGiver] = receiver;
      assignedReceivers.add(receiver);

      if (backtrack()) {
        return true;
      }

      // Backtrack
      delete assignment[chosenGiver];
      assignedReceivers.delete(receiver);
    }

    return false;
  }

  if (backtrack()) {
    return Object.entries(assignment).map(([giverId, receiverId]) => ({
      giverId,
      receiverId,
    }));
  }

  return null;
}

function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
