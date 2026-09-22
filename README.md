# SoundWaver

SoundWaver nimmt über das Mikrofon Sound auf und stellt ihn live als kreative, frei einfärbbare Animation dar. Im Nachhinein lässt sich entweder ein **Durchschnittsbild** der aufgenommenen Wellen erzeugen oder die komplette Animation als **Video** exportieren — beide im selben visuellen Stil wie die Live-Ansicht.

## Ausprobieren

Da das Projekt reines Vanilla JS mit ES-Modulen ist, muss es über einen lokalen Webserver aufgerufen werden (nicht per `file://`, sonst blockt der Browser die Modul-Imports):

```bash
# z.B. mit Python
python3 -m http.server 8080
# oder mit Node
npx serve .
```

Dann `http://localhost:8080` öffnen und Mikrofonzugriff erlauben.

## Features

- **5 Animationsstile**, alle live und für das Durchschnittsbild im selben Look:
  - 🌊 Wellenlinie – vertikale Frequenz-Wellenform: die Y-Achse repräsentiert die Wellenlänge (tiefe Töne unten, hohe oben), die horizontale Auslenkung die Lautstärke pro Frequenzband
  - ☀️ Radial-Spektrum – rotierendes Frequenzspektrum um einen glühenden Kern
  - ✨ Partikelschwarm – Partikel, die auf Lautstärke & Frequenzen reagieren
  - 🫧 Organischer Blob – weich pulsierende, organische Form
  - 🔮 Kaleidoskop – rotierendes, gespiegeltes Mandala aus dem Frequenzspektrum
- Alle Stile (außer dem Blob) verwenden einen sanften Motion-Trail statt hartem Clear pro Frame, für ein flüssigeres, moderneres Bild.
- **Farb-Customization**: Einfarbig, Verlauf oder reaktiver Regenbogen-Modus, freie Hintergrundfarbe oder transparenter Hintergrund (für Export mit Alphakanal), Glow-Intensität und Empfindlichkeit einstellbar.
- **Export**:
  - Durchschnittsbild (PNG, inkl. Transparenz) aus dem Mittel der Wellenformen der laufenden Session
  - Video-Aufnahme (WebM, inkl. Ton) der Live-Animation
- 100 % clientseitig, kein Backend nötig.

## Projektstruktur

```
index.html          Einstiegspunkt & UI
css/style.css        Gesamtes Styling
js/audio.js           Mikrofon-Aufnahme & Web Audio Analyse
js/colors.js          Farbverläufe / Farbmodus-Hilfsfunktionen
js/averager.js        Akkumuliert Wellenform-/Frequenzdaten für das Durchschnittsbild
js/recorder.js         Canvas+Audio Video-Aufnahme via MediaRecorder
js/styles/             Ein Modul pro Animationsstil (gemeinsames Interface)
js/main.js             UI-Wiring & Render-Loop
```

## Neue Animationsstile hinzufügen

Jeder Stil in `js/styles/` exportiert `id`, `label`, `engine` (aktuell nur `"2d"`) und eine `create(canvas)`-Funktion, die ein Objekt mit `render(frame)`, `renderAverage(frame)`, `resize(w, h)` und `destroy()` zurückgibt. Einfach in `js/styles/index.js` eintragen.
