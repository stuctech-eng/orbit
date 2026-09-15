# ORBIT — Changelog

Bijgehouden per feature/fix, nieuwste bovenaan. Zie `docs/ORBIT_DESIGN_BIBLE.md` voor de actuele architectuur en ontwerpregels — dit document is de geschiedenis, de Design Bible is de waarheid over de huidige staat.

---

## Cognitive Engine — plateau-assist toegevoegd

- **Idee:** als een speler lang op hetzelfde niveau blijft steken (niet vooruit, niet terug), moet de engine daar zelf iets aan doen — anders blijft iemand precies onder zijn skill-plafond vastzitten zonder ooit de Flow Zone te verlaten.
- Nieuw: `save.plateauRounds` telt opeenvolgende "blijft gelijk"-beslissingen op hetzelfde niveau. Na 8 rondes versoepelt de snelheids-eis geleidelijk (0,75× → max 0,90× verwachte tijd) — nooit de nauwkeurigheids-eis, dat zou fouten belonen in plaats van tempo.
- Reset zodra het level verandert (vooruit of terug) of bij een nieuwe sessie; blijft wél intact bij pauzeren/hervatten of het herstarten van de app, want de speler zit dan nog steeds op hetzelfde niveau.
- Gevalideerd met een gesimuleerd hang-patroon (~63% nauwkeurigheid, nooit een reeks van 3): zonder assist bleef de speler na 80 rondes nog vast, met assist brak hij er na 68 rondes uit.

## Moeilijkheidscurve — de grote terugval gefixt

- **Root cause:** de ladder liep van stap 18 via `% LADDER.length` weer terug naar stap 1 — van 11 cellen/3 symbolen (zwaarst) naar 3 cellen/1 symbool (lichtst). Veruit de grootste moeilijkheidsdaling in het spel, precies op het moment dat een sterke speler zou afhaken.
- **Fix:** ladder uitgebreid van 18 naar 29 stappen (fases F/G/H toegevoegd: 4 en 5 onthoudpunten, tot 13 cellen), en de wrap-around vervangen door een clamp — de zwaarste stap herhaalt zichzelf i.p.v. terug te vallen
- Volledige curve doorgerekend: geen enkele moeilijkheidsdaling meer, plafond nu ~11× zwaarder dan de start (was ~6,5×)
- Level-wissel wordt nu visueel gesignaleerd: de eerstvolgende scan kleurt groen (omhoog) of rood (omlaag). Bewust géén extra scans — dat zou ~9s dode tijd per level-wissel toevoegen en botst met de "geen wachttijd"-regel
- Tutorial-fixes: Home-scherm bleef zichtbaar onder de transparante tutorial-overlay (tekst en menuknoppen liepen door elkaar), tekst kreeg een donkere achtergrond-pil (witte tekst op witte ballen was onleesbaar), begeleiding toegevoegd bij elke stap inclusief het pauzemenu, en de tutorial-overlay opgehoogd naar z-index 30 zodat begeleiding boven het pauzemenu zichtbaar blijft

## Number Tracking — Home-knop op Game Over-scherm

- Terecht gevonden gat: het Game Over-scherm dekte de scanner-indicator zelfs visueel af (hogere z-index), dus er was geen enkele weg terug naar Home — alleen "Opnieuw proberen".
- "🏠 Home"-knop toegevoegd, secundair aan de retry-knop.
- `updateIndicatorVisibility()` houdt nu ook rekening met het Game Over-scherm, zodat de scanner-indicator nooit meer onbedoeld interactief blijft onder een volledig-scherm-overlay.

## Number Tracking — definitieve fout-/Game Over-flow (aanvulling)

Op basis van een definitief document van de gebruiker, dat het eerdere BEST/HUIDIG-paneel-ontwerp expliciet afkeurt en een echte Game Over-structuur vastlegt:

- **Fouten zijn nu sessie-breed** (niet meer per ronde): 1e en 2e fout gaan door met hetzelfde doelnummer, de 3e fout beëindigt de hele sessie. `trackingSessionErrors` vervangt het oude per-ronde `trackingErrors`.
- **BEST/HUIDIG-paneel tijdens het spel verwijderd** — rondes lopen nu direct door naar de volgende zonder onderbreking of statistieken-weergave. Dit brak met het principe dat er tijdens het spelen geen scores zichtbaar zijn.
- **Nieuw Game Over-scherm**: Ballen / Fouten / Tijd (bewust géén Score-regel — die formule is nog niet vastgesteld, expliciet uitgesteld tot na een echte speeltest), plus "NIEUW RECORD" of "BESTE: X ballen", plus een "Opnieuw proberen"-knop.
- **Geen apart levelsysteem** — "Ballen" is de enige voortgangsmaat, zoals besloten ("Level = aantal ballen" was het alternatief, maar zelfs die naam is niet gebruikt — gewoon "Ballen").
- Record-vergelijking is nu puur op hoogste bereikte ballen-aantal (geen tijd-tiebreak meer nodig, aangezien er geen score is om op te optimaliseren).
- **Getest:** drie scenario's — (1) 1e/2e fout gaan door met hetzelfde doel, 3e fout triggert Game Over exact bij fout-teller 3; (2) fouten resetten niet tussen geslaagde rondes (sessie-breed bevestigd); (3) ballen-aantal loopt correct op zonder onderbreking tussen rondes (3→4→5→...→11 geverifieerd).

## Number Tracking — Fase 6 + 7 (foutenstatistiek + BEST/CURRENT-weergave)

- **Fase 6 compleet:** gemiddelde tijd per correcte selectie wordt nu berekend en bijgehouden (`avgMs`), naast de al bestaande fouten-telling die de ronde niet meer beëindigt.
- **Fase 7 compleet:** het tussenscherm tussen rondes toont nu een echt BEST/HUIDIG-paneel (donker, afgerond, zelfde visuele taal als de rest van ORBIT), precies zoals het voorbeeld in de spec. Bij een nieuw record staat er expliciet "Nieuw record!" in plaats van "Huidig".
- BEST wordt bijgewerkt op basis van: eerst meeste ballen, dan (bij gelijke ballen) snelste tijd — exact zoals gespecificeerd.
- **Getest:** vijf scenario's doorgerekend (nieuw record bij meer ballen, nieuw record bij zelfde ballen maar sneller, géén record bij minder ballen ook al was die ronde sneller, nieuw record bij weer meer ballen, gemiddelde-tijd-berekening) — allemaal correct.

## Number Tracking — vervaging iets langer

- Hold-periode 2,5s → 3,5s, vervaagtijd 3s → 4s. Cijfer nu volledig verdwenen na 7,5s (was 5,5s).

## Number Tracking — Fase 5 (nummers geleidelijk vervagen)

- Elk cijfer blijft 2,5s volledig helder na verschijnen, vervaagt daarna geleidelijk over 3s tot onzichtbaar. De bal zelf blijft te allen tijde volledig zichtbaar — alleen het cijfer dooft. Beweging gaat gewoon door.
- Introduceert de geheugendimensie: de speler moet op een gegeven moment onthouden waar welk nummer zat, in plaats van het steeds te kunnen aflezen.
- **Getest:** vervaagcurve doorgerekend — geen enkele sprong (max 0,00033 opaciteitsverandering per ms), volledig verdwenen na exact 5,5s.

## Number Tracking — Fase 4 (bewegingssnelheid)

- Snelheid schaalt nu geleidelijk mee met dezelfde teller als het aantal ballen (+4% per bal boven het startaantal van 3), geplafonneerd op 1,8× de basissnelheid — nooit chaotisch, nooit een sprong.
- **Getest:** progressie doorgerekend van 3 t/m 40 ballen — elke stap is exact +4%, plafond wordt bereikt rond 23 ballen, daarna blijft snelheid gelijk terwijl alleen het aantal verder groeit. Geen enkele sprong groter dan de vaste stapgrootte.

## Number Tracking — rood ook sprankelend, kleinere ballen groter

- Sprankel-lijntjes gelden nu ook bij een foute tik (rood i.p.v. wit) — was alleen bij correct.
- Ondergrens balgrootte verder omhoog: 38px → 43px, zodat ballen na de overgang naar hogere aantallen niet meer zo klein aanvoelen. Getest tot 15 ballen — plaatsing blijft altijd lukken.

## Number Tracking — sterkere correct/fout-feedback

- **Correct:** materiaal licht nu echt op richting puur wit (zelfde "lift"-principe als Classic Mode's detectie-burst), plus zes korte sprankel-lijntjes die kort naar buiten stralen, plus een dikkere/helderdere ring en iets meer schaal-pop (0,02 → 0,05).
- **Fout:** directe rode wassing over de bal zelf, niet meer alleen een dun randje — in één oogopslag duidelijk zonder het cijfer te hoeven lezen. Ring ook dikker/feller.
- Bewust ingetogen gehouden (dun, weinig stralen, geen confetti) — past bij de rest van ORBIT's rustige, premium visuele taal.

## Number Tracking — ballen groter (correctie)

- Vorige aanpassing ging de verkeerde kant op — "iets grote nog" was bedoeld als "iets groter", niet "te groot". Rechtgezet: max-straal nu 48px (was 42px origineel, 36px na de misinterpretatie), ondergrens 38px. Groter dan waar we begonnen, niet kleiner.
- Geverifieerd dat plaatsing bij 3 t/m 12 ballen nog steeds altijd lukt met de grotere maat.

## Number Tracking — ballen iets kleiner

- Terugkoppeling: nog iets te groot. Max-straal 42px → 36px, ondergrens 34px → 29px, krimpformule proportioneel meegeschaald. ~15% kleiner over de hele linie, zelfde verhoudingen.

## Number Tracking — overlap-bug + te-kleine-ballen gefixt

- **Root cause overlap:** ballen hadden alleen wand-botsing, geen botsing tussen elkaar — konden dus gewoon door elkaar heen bewegen zodra ze dicht bij elkaar kwamen. Zichtbaar in een screenshot (bal 2 en 3 overlappend).
- **Root cause gemiste tikken bij 6 ballen:** rechtstreeks gevolg van de overlap — bij overlappende ballen wordt precies de juiste raken lastig tot onmogelijk, wat aanvoelde als "reageert niet meer".
- **Fix:** paarsgewijze botsing toegevoegd aan `stepTrackingPhysics`, letterlijk dezelfde bewezen aanpak als Classic Mode's cellen (scheiden langs de contactnormaal, elastische snelheidsuitwisseling).
- **Ondergrens bal-grootte verhoogd** van 26px naar 34px, en de krimpformule iets afgevlakt — moeilijkheid bij meer ballen moet uit het volgen/onthouden komen, niet uit steeds kleiner wordende tikdoelen.
- **Getest:** 50 gesimuleerde seconden fysica per aantal ballen (3, 6, 9, 12, 15) — nul overlap-frames in alle gevallen, minimale middelpunt-afstand blijft altijd ruim boven de vereiste grens.

## Number Tracking — Fase 3 (moeilijkheidsopbouw)

- **Enige moeilijkheidsfactor deze fase:** één bal erbij per geslaagde ronde (3 → 4 → 5 → ...), exact zoals de spec vraagt — snelheid en zichtbaarheid blijven onaangeroerd tot de basis goed speelbaar is gebleken.
- Bal-straal schaalt nu mee met het aantal (zelfde `sqrt(3/n)`-aanpak als Classic Mode's celgrootte), met een ondergrens van 26px zodat ballen altijd comfortabel aan te tikken blijven.
- **Getest:** 15 opeenvolgende perfecte rondes gesimuleerd — plaatsing slaagt elke keer, radius schaalt vloeiend mee (42px → 26px, bereikt de vloer rond 9 ballen), alle ballen blijven binnen de grenzen. Stress-test tot 63 ballen over 60 rondes: geen enkele plaatsingsfout: het systeem degradeert netjes (iets minder perfecte spreiding bij extreme aantallen) in plaats van vast te lopen.
- Geen kunstmatig plafond toegevoegd — 60+ opeenvolgende perfecte rondes is praktisch nooit haalbaar, en het systeem breekt sowieso niet als het wel gebeurt.

## Nieuwe spelmodus — Moving Number Tracking (Fase 2, basisversie)

- **Nieuwe modus naast Classic Mode**, volledig gescheiden: eigen state (`trackingBalls`), eigen physics-stap (`stepTrackingPhysics`), eigen tekenfunctie, eigen tik-afhandeling. Classic Mode's `handleTap`, `resolveRound`, `startRound`, `cells`-array — geen letter aangeraakt, geverifieerd met een grep-check op de functie-bodies.
- `frame()` vertakt eenmaal, helemaal bovenaan, naar `frameTracking()` als `currentMode === 'tracking'` — de rest van de game-loop wordt dan niet eens bereikt.
- Spelregels (Fase 2, exact zoals gespecificeerd): 3 witte ballen, elk met een uniek zichtbaar nummer (1-3), continu bewegend, stuiterend tegen de randen. Speler tikt 1 → 2 → 3 in volgorde. Fout tikken telt als fout maar beëindigt de ronde niet (Fase 6-principe alvast toegepast in de basisversie). Ronde compleet → resultaat kort getoond → volgende ronde (nog met hetzelfde aantal ballen; Fase 3-progressie is bewust nog niet gebouwd).
- Minimale Fase 7-subset: `save.trackingBest`/`save.trackingLast` (aantal ballen, tijd, fouten) — geen UI ervoor gebouwd, puur de databasis alvast aanwezig.
- Toegang: nieuwe knop "🔢 Getallen volgen" op het Home-scherm. Pauzemenu en Instellingen werken automatisch mee (pause/resume was al mode-onafhankelijk); "Nieuwe sessie" is bewust modus-bewust gemaakt zodat 'ie in tracking-modus een tracking-ronde herstart in plaats van Classic Mode's ladder te resetten.
- **Getest, niet alleen gebouwd:** een losstaande Node-simulatie van de exacte spawn/physics/tik-logica (6 scenario's: spawn-integriteit over 3-12 ballen, 1000 frames physics-grenscontrole, volledige juiste reeks, foute tik zonder ronde-einde, al-getikte bal genegeerd, tik na ronde-einde genegeerd) — alle zes geslaagd.

**Nog open (Fase 3+, bewust niet gebouwd in deze levering):** moeilijkheidsopbouw (meer ballen, snelheid, vervagende nummers), volledige foutstatistieken-weergave, uitgebreide Score/PR-UI, meerdere moeilijkheidsassen los van elkaar regelbaar.

## First Launch Tutorial

- Interactieve onboarding, alleen bij een écht eerste bezoek (`save.tutorialCompleted`)
- Hergebruikt de echte gameplay-functies (`adjustCellCount`, `beginScan`, `updateScan`, `handleTap`, `resolveRound`) — geen aparte tutorial-code, `resolveRound()` heeft alleen één vroege `if (tutorialActive) return;`-tak
- Zes stappen: Welkom → Ronde A (3 cellen) → Ronde B (4 cellen) → Navigatie-demo → Klaar → echte eerste ladder-ronde
- Overslaanbaar, en opnieuw te bekijken via Instellingen
- Bestaande spelers bij deze update worden niet retroactief getrakteerd op de tutorial (`tutorialCompleted` wordt bij het laden op `true` gezet als de save al sporen van eerder spelen toont)

## Cognitive Engine — snelheid bijgesteld

- `ADVANCE_THRESHOLD` van 80 naar 70, punten per correct antwoord van 3 naar 4 — ongeveer 2× zo snel voor een consistent goede speler (doorgerekend met simulatie)
- `currentStreak`/`currentErrorStreak` resetten nu bij hervatten na pauze én bij het heropenen van de app — voorkomt dat een "roestig" foutje na een pauze meetelt als voortzetting van een oude foutenreeks (was de oorzaak van te ver terugzakken)

## Audio — volledig herbouwd met event-architectuur

- `GameEvents` (minimale pub/sub) + `AudioManager` (volledig losstaande listener) — harde regel: gameplay stuurt audio, audio stuurt nooit gameplay
- Zes observatiepunten: `scannerStarted`, `scannerReveal`, `scannerFinished`, `correctAnswer`, `wrongAnswer`, `levelUp` — elk één regel op een bestaand beslismoment, geen bestaande regel gewijzigd
- **Bugfix:** `pulseFound()` (tussentijdse juiste tik bij meerdere symbolen) miste het `correctAnswer`-event — alleen de laatste tik gaf geluid. Gefixt.
- **Bugfix:** audio-unlock hing aan een `window`-listener terwijl het geluid-triggerende event aan de canvas-listener hing, die altijd eerder afgaat — eerste tik(ken) waren daardoor stil. Nu unlockt de canvas-handler zelf eerst.
- **Bugfix:** een vers aangemaakte AudioContext kan een opstart-vertraging hebben waardoor het eerste geluid verloren gaat — opgelost met een onhoorbare "priming"-oscillator direct bij aanmaak
- iOS-stille-schakelaar-fix: een korte, stille `<audio>`-tag "ontgrendelt" de audio-sessie voor oscillators (bekend WebKit-eigenaardigheid)
- Geluidsset: na A/B/C-vergelijking gekozen voor Set B "Ademend" — lagere tonen, tragere aanzwelling, lowpass-gefilterd voor warmte (`tone()` heeft nu een `filterHz`-parameter)
- Scanner-toon: sine i.p.v. triangle (triangle klonk zoemerig/alarmerend bij 44Hz, vergeleken met een auto-deurtje-piepje)
- Instellingen: Geluid aan/uit toegevoegd naast Trilling

## In-Game Navigatie (Sprint 4)

- Scanner-indicator bovenaan: dunne witte lijn, geactiveerd via **kort ingedrukt houden** (350ms), niet een gewone tik — een tik op een hoog zwevende bal mag het menu nooit per ongeluk openen
- Pauzemenu: Verder spelen / Home / Nieuwe sessie / Instellingen — pauze bevriest physics/scan/timers exact, hervatten schuift de klokken op met precies de gepauzeerde duur
- Home = uitgebreid welkomstscherm met stats + Nieuwe sessie + Statistieken + Instellingen
- Nieuwe sessie reset alleen de huidige ladder-positie en score — lifetime-stats blijven staan
- Statistieken-scherm: Hoogste level, Hoogste score, Cognitive Rating, Correcte antwoorden, Speeltijd, Sessies, Laatste keer gespeeld
- Auto-save uitgebreid: ook bij pauzeren, naar Home gaan, en app-achtergrond

## Cognitive Engine V2.0 — Confidence Score

- Interne, nooit-getoonde Confidence Score (0–100, start 50) vervangt het eerdere vaste raam van 5 rondes
- Vijf factoren per ronde: correctheid, reactietijd (tegen de eigen verwachte tijd per ladder-stap, niet een vaste limiet), streak-bonus, foutenreeks-straf, extreme-prestatie-boost
- Vermoeidheidsfactor: na ~15 min onafgebroken spelen vervalt de trage-reactie-straf
- **Bugfix:** reactietijd werd gemeten vanaf ronde-start (inclusief de volledige verplichte scan van 5-7s), waardoor een speler nooit als "snel genoeg" kon gelden — nu gemeten vanaf `beginMemory()`

## Stabiliteitsfix — de echte oorzaak van inconsistente tikken

- **Root cause:** `roundTargets` sloeg doelcellen op als array-*index*, maar het cellen-array werd middenin een ronde gemuteerd (vervagende cellen die eruit werden gefilterd) — indices konden daardoor naar de verkeerde cel gaan wijzen
- **Fix:** elke cel kreeg een stabiel, uniek `id`; alle rondelogica draait nu op dat ID i.p.v. array-positie

## Definitieve Classic Mode

- Symbolen i.p.v. cijfers als scanner-inhoud → later vervangen door: de hele cel wordt bijna zwart bij reveal (i.p.v. lichter — op een wit-op-zwart wereld is donker worden unieker dan lichter worden)
- Tikken tijdens de scan doet niets — geheugenfase begint pas als de scanner het scherm volledig heeft verlaten (eerder gebouwde "tik tijdens scan"-functie weer teruggedraaid, bewust: observeren en kiezen blijven twee gescheiden cognitieve taken)
- Volledige-scherm-flits (220ms) als non-verbaal "ga"-signaal zodra de geheugenfase begint

## Motion Design (Sprint 3) + In-Game Navigatie basis

- Nieuwe cellen vloeien in (ease-out) i.p.v. instant verschijnen, symmetrisch met de bestaande fade-out
- Feedback-puls ease-out i.p.v. lineair
- Scanner-lichtpuls bij volledig binnenkomen, exacte 350ms opbouw/afbouw gekoppeld aan echte speelveld-aanwezigheid
- Cellen: langzaam meebewegende reflectie, ±2% schaalpuls bij correct, lichte trilling bij fout
- Eerste versie van pauzemenu/Home/Instellingen (later verder uitgebreid)

## Adaptive Memory Ladder + Cognitive Engine V1 + Save System

- Ladder: 18 stappen, fases A–E, afwisselend meer cellen (tracking) en meer onthoudpunten (werkgeheugen)
- Cognitive Engine V1: raam van laatste 5 rondes, accuracy/snelheid-drempels → -1/0/+1
- Save System: level, hoogste level/score, Cognitive Rating, speeltijd, correcte antwoorden, automatisch opslaan, hervatten via Welkom-terug-scherm
- **Bugfix:** cel-array-mutatie-bug (zie hierboven) bestond hier al, viel toen niet op omdat celaantal nog vast stond

## ORBIT V1 Foundation

- Classic Gameplay Loop bevroren: scanner (vaste snelheid, vlijmscherpe kern + uitwaaierende sleep, geen easing), physics (zachte botsingen, edge-safety), Soft Pearl cel-materiaal
- Refactor-pas: dode code verwijderd, dubbele wand-clamp-logica samengevoegd, magic numbers naar configuratie-constanten
- PWA-fundament: manifest, service worker (network-first), iconen

---

*Dit document wordt bijgehouden bij elke levering — staande opdracht, geen aparte aankondiging nodig.*
