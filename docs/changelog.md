# ORBIT — Changelog

Bijgehouden per feature/fix, nieuwste bovenaan. Zie `docs/ORBIT_DESIGN_BIBLE.md` voor de actuele architectuur en ontwerpregels — dit document is de geschiedenis, de Design Bible is de waarheid over de huidige staat.

---

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
