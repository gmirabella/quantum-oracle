
# Specifiche Tecniche: Modalità EVOCA

## 1. Panoramica
La modalità **EVOCA** è una nuova interfaccia di interazione basata sui gesti (Gesture-Based Interaction) che permette all'utente di manipolare le particelle quantiche simulando l'accumulo e il rilascio di energia cinetica/spirituale.

## 2. Interfaccia Utente (UI)
- **Menu:** Aggiunta voce `EVOCA` nel menu di navigazione principale.
- **Feedback:** Quando la modalità è attiva, vengono mostrate istruzioni contestuali: "CHIUDI LA MANO per accumulare. APRI per esplodere."
- **Stato Camera:** Richiede accesso alla webcam.

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

### A. Stato IDLE (Ritorno all'Universo)
- **Trigger:** Mano Aperta (dopo esplosione) o Nessuna Mano rilevata.
- **Comportamento:** Flusso Organico & Ritorno.
- **Dinamica:** Le particelle fluttuano seguendo un campo vettoriale ("Flow Field") randomico e dolce. Esiste una debole forza di richiamo verso la nuvola originale per evitare dispersione totale, ma il movimento principale è libero e slegato dalla mano.
- **Sensazione:** Universo vivo, pulviscolo che danza liberamente.

### B. Stato CHARGING (Effetto Palla di Fuoco)
- **Trigger:** Utente mantiene `CLOSED_FIST`.
- **Dinamica:**
    - **Attrazione Forte:** Le particelle vengono risucchiate velocemente verso il centro della mano.
    - **Densità Core:** Formano una sfera molto compatta e densa (raggio ridotto), simile a un nucleo di plasma.
    - **Turbolenza Termica:** Aggiunta di vettori randomici ad alta frequenza per simulare la combustione/vibrazione del fuoco. Non è più una sfera statica ma una massa ribollente.
    - **Transizione Rapida:** L'accumulo raggiunge il picco in pochi frame per massimizzare la reattività.
    - **Visuals:** Colori intensi (Viola/Rosso) mantenuti come da specifica.

### C. Stato CASTING (Soft Explosion)
- **Trigger:** Transizione `CLOSED_FIST` -> `OPEN_HAND`.
- **Obiettivo:** Dispersione totale nello spazio (Entropia Massima).
- **Dinamica:**
    - **Vettori Random:** Ogni particella riceve una velocità elevata in una direzione casuale 3D.
    - **Effetto Nube:** Le particelle riempiono istantaneamente l'intero viewport.
    - **Colore:** Flash di luce bianca pura al momento del rilascio.
