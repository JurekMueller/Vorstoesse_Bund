## Allgemeine Kommentare zur Datenverarbeitung

Um die API Infrastruktur zu sehen: https://pragmatiqa.com/xodata/# aufrufen, "Stay here with XOData" auswählen und dann unter "Choose acdess option" folgende Metadata URL eingeben: https://ws.parlament.ch/odata.svc/$metadata

**Allgemeine Kommentare**  
* Daten über Vorstösse existieren seit dem Winter 1995. Das heisst die Analyse beschränkt sich auf die Legislaturen 45 (Start 1995-12-04) bis heute.
* **Nur Daten ab der Leg 47 werden genutzt:**  
  - TagNames (Themenfelder) gibt es erst seit 2000
  - 2003 wurden Einfache Anfragen zu Anfragen umbenannt
* Es gibt doppelte Einträge in MemberCouncilHist (ZB wenn sich irgendwas anderes geändert hat: Mitglied zu Präsident)
* Es gibt Einträge in MemberCouncilHist die mehrere Legislaturen umfassen
* Manchmal werden die Geschäfte von Kommissionen etc eingereicht. Dann gibt es keine MemberCouncilNumber

**Geschäftsarten:**
- 2003 wurden Einfache Anfragen zu Anfragen umbenannt
- Empfehlung gibt es nicht (für Nationalrat)

Interessant: ['Motion','Parlamentarische Initiative','Postulat','Interpellation','Dringliche Interpellation','Einfache Anfrage','Dringliche Einfache Anfrage','Fragestunde. Frage','Anfrage','Dringliche Anfrage']  
Nicht interessant: ['Petition','Empfehlung','Geschäft des Bundesrates','Geschäft des Parlaments','Standesinitiative']  
Dringliche und normale Geschäfte wurden der Einfachheit halber zusammengenommen.


**Probleme:**
* 249 hat sein Austrittsdatum aus Legislatur 44 am 1995-12-05 obwohl die Legislatur 45 schon am 1995-12-04 begonnen hat. Für Legislatur 45 hat er nochmal einen separaten Eintrag  
  -> **Hack durch Abziehen von einem Tag bei DateLeaving bei der Auswertung.** Sollte keinen Unterschied machen bei allen anderen.

* Wenn es zwei Einträge in Hist gibt (zb. Fraktionswechsel). 
  - Parteiwechsel in der aktuellen Legislatur tauchen nicht in Hist auf -> Bei Aktueller Leg Partei aus Member Liste nehmen
  - Bei früheren Parteiwechseln gibt es MANCHMAL mehrere Einträge in Hist, die aber nicht geordnet sind..
Wie soll entschieden werden welchen man nimmt?  
Oder noch schlimmer Beispiel Werner Carobbio (39): 
  - Bis 1992 in der Partei PSA (Fraktion mit PdA) danach SP
  - In Hist steht Partei PdA (Falsch). Fraktion wechselt (aber ohne datum) aber Partei nicht.
  - In Member steht Partei SP (erst ab 1992)
  - PSA kommt gar nicht vor

  Grundsätzlich würde ich eher immer die letzte Parteizugehörigkeit nehmen.
    
  **Für den MOMENT nehme ich einfach mal den obersten Eintrag. Aber eine bessere Lösung wäre gut.**
  - Wie wurde die Liste von Daniel erstellt? -> per Hand

* Die API ist sehr empfindlich auf die abgefragten Filter und die Menge an abgefragten Daten
  - Bei einer Abfrage kommen bei bei MemberCouncilHistory nur max 1500 Einträge zurück und bei den anderen max 1000. Deshalb braucht es eine Loop die mit den Argumenten "top" und "skip" arbeitet.
  - Bei grossen Datensätzen (>6000 Einträge) tauchen aber gegen Ende immer mehr Timeoutprobleme auf Seiten des Servers auf und es braucht mehrere Anläufe um die Einträge abzurufen. Das Problem wird etwas kleiner wenn die Anzahl an gleichzeitig abgefragten Einträgen reduziert wird, aber wenn der Datensatz zu gross ist dauert es sehr lange und hängt sich dann doch irgendwann auf. Dieses Problem existiert vor allem bei den Vorstössen, da dass der grösste Datensatz ist.
  - Die Lösung ist also die Datensätze durch filter einzugrenzen. Erste Versuche Vorstösse nach Legislatur und Vorstossart abzufragen und darüber zu loopen haben gut funktioniert.
  - Allerdings hat die selbe Abfrage ein paar Wochen später auf einmal nicht mehr funktioniert. Bei der Kombination von den Filtern "Type" und "Legislatur" war der Server anscheinend überfordert und hat von Anfang an interne Timeoutfehler zurück geschickt.
  - Die jetzige Lösung ist alle Vorstossarten gleichzeitig abzufragen, aber dafür die Legislatur in zwei Hälften zu teilen, damit der abgefragte Datensatz wieder klein genug wird.