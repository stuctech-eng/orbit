# ORBIT — Design Bible

**Status: ORBIT V1 Foundation ✅ — bevroren.**
Dit document is de grondwet van ORBIT. Elke nieuwe feature wordt hiertegen getoetst voordat hij gebouwd wordt. Wijzigt iets hieraan, dan is dat een bewuste, expliciete beslissing — nooit een bijeffect van een andere wijziging.

---

## 1. Visie

ORBIT is een premium, minimalistische cognitieve geheugengame. Geen tutorial, geen tekst, geen uitleg, geen pijlen tijdens gameplay. De speler begrijpt de game volledig via observatie en herhaling.

De ervaring moet aanvoelen als een Apple-product: extreem eenvoudig aan de oppervlakte, tot in detail afgewerkt eronder. Rustig, bijna meditatief — nooit schreeuwerig.

Het uiteindelijke doel: een speler die na een paar rondes automatisch denkt *"nog één keer"*, zonder dat er ooit een score, streak of extra effect nodig was om dat gevoel op te wekken.

---

## 2. Ontwerpregels

- **Geen tekst, geen tutorial, geen pijlen, geen hints** tijdens de gameplay-loop zelf. (Het welkomstscherm bij hervatten is de uitzondering — dat is app-chrome, geen gameplay.)
- **Zuiver zwart-wit.** OLED-zwarte achtergrond (`#000000`), witte elementen. Geen kleur, ook niet subtiel — dat is bewust afgewezen toen het als optie is voorgelegd.
- **Minder is meer.** Elk visueel element moet zijn bestaansrecht bewijzen. Effecten worden pas toegevoegd als ze een concreet gevoel versterken (zie scanner-geschiedenis: van drie stijlen + texturen terug naar één krachtige streep).
- **Physics boven moeilijkheid.** Vloeiende, voorspelbare beweging weegt zwaarder dan een uitdagender spel. De speler moet een cel kunnen blijven volgen.
- **Eén ding tegelijk perfectioneren.** Nieuwe mechanics worden niet toegevoegd totdat de bestaande laag uitzonderlijk goed aanvoelt (feature freeze-principe).
- **Audio ondersteunt, nooit bepalend.** Geluid mag de pacing van de gameplay nooit vertragen of erop wachten. Klinkt een geluid nog door terwijl de volgende stap al begint (zoals de scan-opstart die overloopt in de scan zelf), dan is dat een bewuste overlap — nooit een wachttijd.
- **De scanner bepaalt het ritme, niet de speler.** De scanner is een apparaat, geen animatie die de speler bestuurt. Hij maakt altijd zijn volledige beweging af, ongeacht wat de speler doet — stopt niet, versnelt niet, verandert niet. Een ronde-beslissende tik tijdens de scan wordt direct vastgelegd, maar de afhandeling ervan (geluid, feedback, volgende ronde) wacht tot de scanner het scherm volledig heeft verlaten.

---

## 3. Architectuur (bevroren)

```
Classic Gameplay Loop
   ↓ (levert ruwe rondes)
Adaptive Memory Ladder   ← vast dataset (LADDER)
   ↓ (bepaalt WAT een ronde is: cellen × cijfers)
Cognitive Engine         ← geïsoleerde beslisser
   ↓ (bepaalt WAAR je zit in de ladder: -1 / 0 / 1)
Save System              ← persistente voortgang
```

**Kernregel:** de Cognitive Engine vervangt de ladder nooit. De ladder bepaalt de trainingsopbouw (inhoud); de engine navigeert er alleen doorheen (positie). Nieuwe functionaliteit wordt toegevoegd door uitbreiding, nooit door vervanging van deze basis.

### 3.1 Adaptive Memory Ladder
Vast dataset, 18 stappen, cyclisch:

| Fase | Cellen | Cijfers | Karakter |
|---|---|---|---|
| A | 3 → 8 | 1 | Tracking |
| B | 5 → 7 | 2 | Memory |
| C | 8 → 10 | 2 | Tracking |
| D | 6 → 8 | 3 | Memory |
| E | 9 → 11 | 3 | Tracking |

Na fase E herhaalt het patroon. De ladder zelf verandert nooit — alleen de positie erin.

### 3.2 Cognitive Engine
Interface-contract (stabiel, mag nooit breken):
```
CognitiveEngine.decide(roundHistory) -> -1 | 0 | 1
```
Huidige versie (V2): kijkt naar de laatste 5 rondes.
- ≥80% correct + gemiddelde reactietijd ≤3500ms → **+1** (vooruit)
- ≥80% correct maar traag, of 60–79% correct → **0** (blijft gelijk)
- <60% correct → **-1** (terug)

Nooit onder ladder-index 0. Toekomstige versies (rolling accuracy, streaks, per-fase gedrag) veranderen alleen de inhoud van `decide()` — nooit de aanroep ervan, nooit de ladder, nooit de gameplay.

**Bugfix:** reactietijd werd aanvankelijk gemeten vanaf het begin van de ronde (`startRound()`), dus inclusief de volledige verplichte scan-duur (~5-7s, ruim boven de 3500ms-drempel). Daardoor kon de speler nooit als "snel genoeg" gelden, ongeacht prestatie — de ladder bleef vastzitten op "blijft gelijk". Reactietijd wordt nu gemeten vanaf `beginMemory()`, het moment waarop de speler daadwerkelijk kan reageren.

### 3.3 Save System
`localStorage`, key `orbit_save_v1`. Opgeslagen na elke ronde en bij het verlaten van de app:
- `ladderIndex`, `highestLadderIndex`
- `score`, `highestScore`
- `totalCorrect`, `totalRounds`
- `totalPlayTimeMs`
- `lastPlayed`

Cognitive Rating (afgeleid, niet opgeslagen): `70% nauwkeurigheid + 30% hoogst bereikte niveau`, 0–100 schaal. Bewust eenvoudig, mag later verfijnd worden zonder de rest te raken.

---

## 4. Gameflow (definitief — "Definitieve Classic Mode")

1. Nieuwe ronde start
2. Scanner beweegt automatisch, vaste snelheid, van onder naar boven
3. De doelcel wordt heel even bijna zwart (zie 5) — ~600ms — op het moment dat de scan haar raakt
4. Scanner verlaat het scherm — licht en (wanneer audio terugkomt) geluid doven rustig uit
5. Pas wanneer de scanner het scherm volledig heeft verlaten begint de geheugenfase — **tikken tijdens de scan doet niets**, dit is bewust: observeren/volgen/onthouden gebeurt uitsluitend tíjdens de scan, herinneren/kiezen uitsluitend érná. Die twee cognitieve taken worden nooit vermengd
6. Cellen zijn tijdens de hele scan gewoon blijven bewegen — dit test puur geheugen, geen reactiesnelheid
7. Speler tikt de juiste cel(len) — bij meerdere symbolen: elke juiste tik geeft eigen feedback, pas de laatste sluit de ronde af
8. Feedback (correct of fout) — de scanner reageert hier nooit op, die is al klaar met zijn taak
9. Direct volgende ronde — geen wachttijd, geen popups

**Vastgezet, wijzigt niet zonder aantoonbare fout:** automatische scan-start, scansnelheid, deze volgorde, en het strikt gescheiden houden van de scan-fase (observeren) en de memory-fase (kiezen).

---

### 4.1 Waarom geen tikken tijdens de scan

Eerder is dit wél gebouwd en weer teruggedraaid. De reden: tikken tijdens de scan verandert een geheugenspel in een reactiespel en maakt de spelregel minder eenduidig. Door de fases hard te scheiden blijft de volledige focus liggen op werkgeheugen, objecttracking en concentratie.

---

## 5. Visuele identiteit

### Kleuren
- Achtergrond: `#000000`
- Cellen en scanner: wit, met transparantie/gloed voor diepte — nooit een tweede kleur

### Scanner ("Scanner 2.0" basis)
- Vlijmscherpe, pixel-gesnapte haarlijn (1px) — geen blur op de rand zelf
- Zachte aura eromheen (blur, apart laagje) voor bloom zonder de rand te vervagen
- Asymmetrische sleep: vrijwel geen gloed vóór de kern (richting beweging), een lange uitwaaierende staart erachter die geleidelijk vervaagt
- Lichte, onregelmatige flikkering (twee overlappende sinusgolven) — energiek zonder storend te zijn
- **Helderheids-opbouw:** exact 350ms (echte milliseconden, niet een fractie van de scanduur), gekoppeld aan het moment dat de kern het zíchtbare speelveld binnenkomt. Eenmalige lichtpuls zodra volledig ingezwollen. Symmetrische 350ms-uitdoof vlak vóór het speelveld verlaten
- Vaste snelheid: 4500ms om het zichtbare scherm te doorkruisen, lineair (geen easing)
- **Onderbreekbaar door niets:** de scanner maakt altijd zijn volledige pass af. Tikken tijdens de scan doet niets — de memory-fase (en dus elke tik) begint pas nadat de scanner het scherm volledig heeft verlaten (zie Gameflow 4.1)

### Cellen ("Soft Pearl")
- Radiale gradient, minimaal contrast, brede zachte sheen — geen scherp glinstertje, geen rim light, geen diepe schaduw
- Lichten op ("lift") tijdens reveal en detectie-burst, richting puur wit
- Grootte schaalt mee met het aantal cellen (32–72px basisstraal, krimpt met `sqrt(3/n)`)
- Meebewegende reflectie: highlight/sheen drijft langzaam rond, eigen fase per cel (`c.id`)

### Verborgen inhoud — de cel wordt donker, niet lichter
De scanner leest een cel niet uit door hem te verlichten, maar door hem bijna zwart te laten worden — alsof de scanner de energie uit de cel trekt om hem te lezen. Op een witte-cellen/zwarte-achtergrond-wereld is dit een veel unieker signaal dan "nog witter worden". De hele cel dimt (geen apart vormelement — het bestaande materiaal blijft zichtbaar, alleen sterk gedempt, ~82% richting zwart), met een korte fade erin en eruit (geen instant hard-cut, geen langzame animatie). De speler onthoudt niet wát hij zag, maar wélke bewegende cel heel even van uiterlijk veranderde.

**Losgekoppeld van de detectie-burst:** de korte felle flits die al bestond op het moment dat de scanner een cel raakt (materiaal-lift, extra gloed, lichte schaal-pop) is bewust apart gehouden — die brightening blijft, want dat is de scanner die "aankomt", niet de inhoud die onthuld wordt. De donkere reveal zelf brengt geen extra gloed of schaalverandering met zich mee — puur een kleurverandering, verder niets.

### Feedback
- Correct: witte pulse-ring + ±2% schaalpuls, direct terug
- Fout: rode pulse-ring + zachte rode bloom + lichte trilling (~2px, snel dempend)

---

## 6. Geluid & Haptics

**Status: audio volledig verwijderd (tijdelijk).** Na herhaalde iteraties raakte de audio-laag verstrengeld met de ronde-flow-logica en werd het geheel onbetrouwbaar. Op verzoek is alle Web Audio-code (AudioContext, alle `play*()`-functies, de scanner-toon) volledig uit `index.html` gehaald, om eerst weer een aantoonbaar stabiele gameplay-flow te hebben. Haptics (`navigator.vibrate`) zijn wel behouden — dat is geen audio en had geen aandeel in de problemen.

Wanneer audio terugkomt, gebeurt dat als een strikt losstaande laag die alleen op reeds-bepaalde uitkomsten reageert (zie Gameflow hierboven — geluid bepaalt nooit `correct`, nooit de timing van een ronde), en wordt eerst apart getest vóór hij weer in de hoofdflow wordt gehaakt.

Haptics: licht, kort. Correct = enkele tik (`haptic(12)`). Fout = kort patroon (`haptic([10,40,10])`). Interim juiste tik (bij meerdere cijfers) = korte tik (`haptic(10)`).

---

## 7. Performance-uitgangspunten

- Doel: stabiele 60 FPS, 120 FPS waar het toestel het toelaat
- Geverifieerd op iPhone 13: soepel
- Canvas-gradients en shadowBlur zijn de duurste operaties — bij toekomstige uitbreidingen met veel meer visuele lagen, hergebruik gradients waar mogelijk in plaats van ze elke frame opnieuw te construeren

---

## 7a. Motion Design (Sprint 3)

Puur visuele verfijning, geen enkele wijziging aan bevroren mechanics (gameplay-loop, scannersnelheid, physics-regels, ladder, engine):

- **Nieuwe cellen vloeien in** (550ms, ease-out) wanneer de ladder meer cellen nodig heeft — mirror van de bestaande fade-out voor cellen die wegvallen.
- **Feedback-puls (correct/fout) is ease-out** i.p.v. lineair: multiplicatieve decay (`×0.90`/frame voor de puls, `×0.85`/frame voor de detectie-burst).
- **Welkomstscherm faded zachtjes in/uit** (0.4s) i.p.v. een harde `display:none`-wissel.
- **Scanner-entree**: exacte 350ms opbouw naar volledige helderheid, gemeten in echte milliseconden en gekoppeld aan het moment dat de kern het zíchtbare speelveld binnenkomt — niet aan een fractie van de totale scanduur (die anders per schermgrootte varieerde).
- **Scanner-lichtpuls**: een eenmalige, korte (220ms) extra gloed-flits exact op het moment dat de scanner volledig is ingezwollen — "de scanner komt aan".
- **Scanner-exit**: symmetrische 350ms-uitdoof vlak vóór de kern het speelveld verlaat, in plaats van abrupt te verdwijnen.
- **Cellen — meebewegende reflectie**: de specular highlight en sheen drijven langzaam rond (per cel een eigen fase, gebaseerd op `c.id`), in plaats van een vaste positie — geeft een gevoel van een levend oppervlak zonder iets opvallends te doen.
- **Correct-feedback**: ±2% schaalpuls die direct meegaat met de bestaande witte ring, terug naar normaal zodra de puls wegebt.
- **Fout-feedback**: lichte trilling (~2px, snel dempend) bovenop de bestaande rode ring/bloom — een zachte "flinch", geen schok.

Nog bewust niet gedaan: het scannergeluid synchroon laten meezwellen — audio is verwijderd (zie boven) tot de stabiliteit elders is bevestigd.

---

## 7b. In-Game Navigatie

Minimalistisch principe: tijdens gameplay is er precies **één** subtiel interactiepunt, geen klassieke Home/Back/Save-knoppen.

- **Scanner-indicator**: dunne witte lijn (1px, lage opaciteit, zachte gloed) bovenaan het scherm, altijd zichtbaar tijdens gameplay, stijl van de scanner zelf — geen herkenbaar UI-icoon. 44px onzichtbaar tikgebied eromheen voor bereikbaarheid. **Activatie via kort ingedrukt houden (350ms), niet via een gewone tik** — een tik op een bal die toevallig hoog zweeft mag het menu nooit per ongeluk openen. Een snelle tik doet niets; alleen een bewuste, korte hold opent het pauzemenu.
- **Tik erop** → pauzeert het spel (physics, scan, timers bevriezen exact; canvas blijft het laatste beeld tonen) en opent het pauzemenu met een zachte fade (0.35s), geen harde overgang.
- **Pauzemenu** (precies 4 opties): ▶ Verder spelen · 🏠 Home · ↺ Nieuwe sessie · ⚙ Instellingen.
- **Verder spelen**: fade-out, gameplay hervat exact waar die was — `phaseStart` en `roundStartTime` schuiven op met precies de gepauzeerde duur, dus de scan springt niet vooruit en geen enkele timer "ontploft" na een lange pauze. Geen laadscherm.
- **Home**: hergebruikt het bestaande welkomstscherm (met stats), nu uitgebreid met Nieuwe sessie en Instellingen als losse knoppen.
- **Nieuwe sessie**: reset alleen de huidige ladder-positie en score van de lopende run (`ladderIndex`, `roundHistory`, `score` terug naar 0). Lifetime-stats (hoogste level/score, totalCorrect, speeltijd) blijven staan — geen destructieve reset van prestaties.
- **Instellingen**: momenteel minimaal (alleen Trilling aan/uit), omdat audio-instellingen zijn verwijderd samen met de audio-laag zelf.

**Auto-save, geen handmatige Save-knop.** Slaat op bij: einde van elke ronde (al bestaand), het openen van het pauzemenu, terug naar Home, en het naar de achtergrond gaan van de app (`pagehide`/`visibilitychange`, al bestaand).

---



Dingen die bewust zijn afgewezen of uitgesteld, zodat ze niet per ongeluk terugkomen://
- Kleur (ook niet subtiel cyaan/teal — expliciet overwogen en afgewezen)
- Score/streak-weergave tíjdens gameplay
- Tekst, HUD-elementen, of uitleg tijdens het spelen
- Verplicht alle cellen aantikken vóór de scan start (overwogen, expliciet verworpen — scanner blijft altijd automatisch)
- Device-specifieke edge cases (safe-area, canvas-randen) worden pas na de Premium Experience-fase verder verfijnd, niet ervoor

---

*Dit document wordt bijgewerkt zodra een architectuurkeuze bewust verandert — nooit stilzwijgend als bijeffect van een feature.*
