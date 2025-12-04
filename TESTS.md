
# Test Property-Based: Riconoscimento Gesti & Transizioni

Questo documento descrive la logica di validazione per l'algoritmo di riconoscimento del gesto. Sebbene la fisica sia cambiata (dispersione randomica), la correttezza del riconoscimento del gesto rimane il fattore critico per abilitare l'esperienza.

## Obiettivo
Assicurare che l'algoritmo geometrico non produca "falsi positivi" (es. rilevare un pugno quando la mano è aperta) indipendentemente dalla posizione della mano nello spazio.

## Proprietà Definite

### 1. Invarianza del Pugno (The Fist Invariant)
**Assioma:** Una mano è considerata "Pugno" se e solo se le punte delle dita sono significativamente più vicine al polso rispetto alle nocche principali (MCP joints).

**Generatore Dati (Arbitrary):**
- Generare un set di landmark della mano (21 punti 3D).
- Vincolo: La distanza Euclidea `dist(Tip, Wrist)` deve essere `< k * dist(MCP, Wrist)` per tutte le dita.

**Proprietà:**
- `detectGesture(landmarks)` DEVE restituire `'CLOSED_FIST'`.
- **Effetto Fisico Atteso:** Convergenza rapida e turbolenta verso il centroide (Fireball effect). Le particelle vibrano attorno a un nucleo denso.

### 2. Invarianza della Mano Aperta (The Open Hand Invariant)
**Assioma:** Se le dita sono estese, le punte sono i punti più distanti dal polso.

**Generatore Dati (Arbitrary):**
- Generare landmark dove `dist(Tip, Wrist) > dist(PIP, Wrist) > dist(MCP, Wrist)`.

**Proprietà:**
- `detectGesture(landmarks)` DEVE restituire `'OPEN_HAND'`.
- **Effetto Atteso:** Al rilevamento di questo stato (se precedente == Fist), il sistema deve scatenare l'evento `SOFT_EXPLOSION` disperdendo le particelle randomicamente.

### 3. Invarianza di Scala (Scale Invariance)
**Assioma:** La classificazione non deve cambiare se la mano è più vicina o più lontana dalla telecamera.

**Proprietà:**
- `detectGesture(scaledLandmarks)` === `detectGesture(originalLandmarks)`.

## Note sul Testing Fisico (Visuale)
Poiché l'esplosione è ora "randomica", i test visivi manuali devono verificare:
1.  Che le particelle non formino pattern riconoscibili (es. anelli o linee) dopo l'esplosione.
2.  Che l'accumulo (Charging) mostri evidente turbolenza (jitter) per simulare l'energia, non solo movimento lineare.
