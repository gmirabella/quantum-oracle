# Specifiche Tecniche: Modalità EVOCA

## 1. Panoramica
La modalità **EVOCA** è una nuova interfaccia di interazione basata sui gesti (Gesture-Based Interaction) che permette all'utente di manipolare le particelle quantiche simulando l'accumulo e il rilascio di energia cinetica/spirituale.

## 2. Interfaccia Utente (UI)
- **Menu:** Aggiunta voce `EVOCA` nel menu di navigazione principale.
- **Feedback:** Quando la modalità è attiva, vengono mostrate istruzioni contestuali: "CHIUDI LA MANO per accumulare. APRI per esplodere."
- **Stato Camera:** Richiede accesso alla webcam (come la modalità SINTESI).

## 3. Riconoscimento Gesti (Vision Service)
Il sistema di computer vision deve classificare la mano in tre stati mutuamente esclusivi:
1.  **CLOSED_FIST (Pugno Chiuso):**
    - Rilevato quando le punte delle dita sono ripiegate verso il palmo.
    - Funzione: "Magnete". Attira le particelle.
2.  **OPEN_HAND (Mano Aperta):**
    - Rilevato quando le dita sono estese.
    - Funzione: "Trigger". Se rilevato immediatamente dopo un Pugno, innesca l'esplosione.
3.  **UNKNOWN / OTHER:**
    - Transizioni o gesti non chiari. Le particelle fluttuano inerti.

## 4. Fisica delle Particelle (Physics Engine)
La simulazione fisica opera su una macchina a stati:

### A. Stato IDLE (Default)
- **Comportamento:** Moto browniano leggero, orbitale.
- **Colore:** Bianco/Grigio (Neutro).

### B. Stato CHARGING (Accumulo)
- **Trigger:** Utente mantiene `CLOSED_FIST`.
- **Dinamica:**
    - Attrazione gravitazionale esponenziale verso il centroide della mano (`Force = k / distance^2`).
    - Smorzamento (Damping) elevato per evitare che le particelle "schizzino" via all'infinito.
    - **Jitter:** Vibrazione ad alta frequenza proporzionale alla vicinanza al centro (simulazione compressione energetica).
- **Visuals:**
    - Le particelle virano verso colori "caldi" o "energetici" (Viola/Arancio) man mano che si addensano.

### C. Stato CASTING (Esplosione)
- **Trigger:** Transizione `CLOSED_FIST` -> `OPEN_HAND`.
- **Dinamica:**
    - Applicazione impulsiva di un vettore velocità radiale (`Velocity += Normalize(Pos - Hand) * Force`).
    - L'impulso è istantaneo (1 frame).
- **Decadimento:** Dopo l'esplosione, l'attrito dell'aria rallenta le particelle fino al ritorno allo stato IDLE.