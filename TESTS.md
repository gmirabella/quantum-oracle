# Test Property-Based: Riconoscimento Gesti (Vision)

Questo documento descrive la logica di validazione per l'algoritmo di riconoscimento del gesto, fondamentale per distinguere correttamente tra "Accumulo" (Pugno) e "Esplosione" (Mano Aperta).

## Obiettivo
Assicurare che l'algoritmo geometrico non produca "falsi positivi" (es. rilevare un pugno quando la mano è aperta) indipendentemente dalla posizione della mano nello spazio, dalla rotazione o dalla distanza dalla camera (invarianza di scala).

## Proprietà Definite

### 1. Invarianza del Pugno (The Fist Invariant)
**Assioma:** Una mano è considerata "Pugno" se e solo se le punte delle dita sono significativamente più vicine al polso rispetto alle nocche principali (MCP joints).

**Generatore Dati (Arbitrary):**
- Generare un set di landmark della mano (21 punti 3D).
- Vincolo: La distanza Euclidea `dist(Tip, Wrist)` deve essere `< k * dist(MCP, Wrist)` per tutte le dita (Indice, Medio, Anulare, Mignolo), dove `k` è un fattore di chiusura (es. 0.6).

**Proprietà:**
Per ogni set di landmark generato con il vincolo sopra:
- `detectGesture(landmarks)` DEVE restituire `'CLOSED_FIST'`.
- NON DEVE mai restituire `'OPEN_HAND'`.

### 2. Invarianza della Mano Aperta (The Open Hand Invariant)
**Assioma:** Se le dita sono estese, le punte sono i punti più distanti dal polso.

**Generatore Dati (Arbitrary):**
- Generare landmark dove `dist(Tip, Wrist) > dist(PIP, Wrist) > dist(MCP, Wrist)`.

**Proprietà:**
Per ogni set generato:
- `detectGesture(landmarks)` DEVE restituire `'OPEN_HAND'` (o `'POINTING'` se specificato).
- NON DEVE mai restituire `'CLOSED_FIST'`.

### 3. Invarianza di Scala (Scale Invariance)
**Assioma:** La classificazione non deve cambiare se la mano è più vicina o più lontana dalla telecamera.

**Generatore Dati:**
- Prendere un set valido di landmark per `CLOSED_FIST`.
- Moltiplicare tutte le coordinate (x,y,z) per un fattore scalare `S` (es. da 0.5x a 2.0x).

**Proprietà:**
- `detectGesture(scaledLandmarks)` === `detectGesture(originalLandmarks)`.

## Pseudo-Codice di Implementazione (Fast-Check)

```typescript
import fc from 'fast-check';
import { detectHandGesture } from './vision';

test('Fist detection is scale invariant', () => {
  fc.assert(
    fc.property(validFistLandmarks(), fc.float(0.5, 2.0), (landmarks, scale) => {
        const scaled = landmarks.map(p => ({x: p.x * scale, y: p.y * scale, z: p.z * scale}));
        return detectHandGesture(scaled) === 'CLOSED_FIST';
    })
  );
});
```