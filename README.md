# Zusammenarbeit der Mitglieder des National- & Ständerats

Die Visualisierung zeigt die Aktivitäten und Zusammenarbeit von Mitgliedern des Nationalrats und des Ständerats im Rahmen von parlamentarischen Vorstössen. Diese werden als Netzwerkansicht dargestellt, mit den Ratsmitgliedern als Knoten und den gemeinsam eingereichten Vorstössen als Verbindungen. Die verfügbaren Daten decken den Zeitraum ab der 47. Legislaturperiode (Wintersession 2003) ab.

Die für die Visualisierung berücksichtigten Vorstösse können nach Art und Thema gefiltert werden. Um einen Einstieg in die Mehrdimensionalität der dargestellten Informationen zu ermöglichen, sind weiter unten einige Beobachtungen beschrieben, die durch Links auf der Visualisierung sichtbar gemacht werden können. 

Die Daten zu den Ratsmitgliedern und den Vorstössen wurden von der API der Parlamentsdienste bezogen: https://ws.parlament.ch/odata.svc.
Die dort verfügbaren Daten können in für Menschen lesbarer Form gesichtet und abgefragt werden in dem z.B. die Metadaten-URL (https://ws.parlament.ch/odata.svc/$metadata) im Onlinetool von PragmatiQa eingegeben wird.

Die Daten wurden mithilfe eines Python-Skripts von der API der Parlamentsdienste abgefragt und verarbeitet. Kleine Regionalparteien wurden der bundesweiten Mutterpartei zugeordnet, wo eine solche existiert.
Vergangene Parteifusionen oder Umbenennungen (z.B. CVP und BDP zu Mitte) wurden manuell für die gesamte entsprechende Legislaturperiode erfasst.
Seltene Parteiwechsel innerhalb einer Legislaturperiode können zur Darstellung von inkonsistenten Parteizugehörigkeiten führen, da die Daten keine Information über das genaue Datum des Parteiwechsels beinhalten.
Nach der Datenverarbeitung wurden die für die Netzwerkvisualisierung relevanten Daten pro Legislatur in ein Netzwerk JSON-Formt (bestehend aus Knoten und Verbindungen) umstrukturiert. 

Die interaktive Visualisierung wurde hauptsächlich mit der Javaskript Bibliothek D3.js gebaut. Darüber hinaus wurde D3-legend.js verwendet, um die Legenden zu erstellen, jQuery für einzelne Komfortfunktionen und Bootstrap beim Design der Webseite.
Die Visualisierung und die Webseite sind eine Adaption einer ähnlichen Visualisierung der Zusammenarbeit im Grossen Rat von Thurgau: https://github.com/JurekMueller/vorstoesse_grosser_rat_thurgau. 
