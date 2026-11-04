# Siłownia: plan i dziennik

Aplikacja w przeglądarce do planu Upper / Lower × 2: trening z zapisem serii, timer przerwy, historia, postęp siły, pomiary ciała oraz cała wiedza z planu (kalorie, jadłospis, progresja, boczki, kroki, suplementy).

Dane zapisują się tylko w pamięci przeglądarki na Twoim urządzeniu. Nic nie trafia na serwer.

## Pliki

| Plik | Co to jest |
|---|---|
| `index.html` | Strona aplikacji |
| `style.css` | Wygląd (szkło, tryb jasny i ciemny) |
| `app.js` | Logika, plan treningowy, obliczenia |
| `manifest.webmanifest` | Dane do instalacji na ekranie telefonu |
| `sw.js` | Działanie offline |
| `icons/` | Ikony aplikacji |

## Wrzucenie na GitHub Pages

1. Na github.com utwórz nowe repozytorium, np. `silownia`. Może być prywatne tylko na płatnym planie; na darmowym Pages wymaga repozytorium publicznego. Twoje dane i tak nie są w repozytorium, tylko na telefonie.
2. Wgraj wszystkie pliki z tego folderu (razem z folderem `icons`), np.:
   ```bash
   cd silownia
   git init
   git add .
   git commit -m "Aplikacja treningowa"
   git branch -M main
   git remote add origin https://github.com/TWOJ_LOGIN/silownia.git
   git push -u origin main
   ```
   Albo przez stronę: **Add file → Upload files** i przeciągnij pliki.
3. W repozytorium: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, wybierz `main` i `/ (root)`, zapisz.
4. Po 1–2 minutach aplikacja będzie pod adresem `https://TWOJ_LOGIN.github.io/silownia/`.

## Instalacja na telefonie

**iPhone (Safari):** otwórz adres, stuknij **Udostępnij → Do ekranu początkowego**. Aplikacja otwiera się jak zwykła, na pełnym ekranie i działa bez internetu.

**Android (Chrome):** otwórz adres, menu **⋮ → Zainstaluj aplikację** (lub „Dodaj do ekranu głównego”).

Ważne na iPhonie: aplikacja z ekranu początkowego ma osobną pamięć niż ta sama strona w Safari. Zapisuj treningi zawsze w jednym miejscu, najlepiej w aplikacji z ekranu.

## Timer przerwy i Zegar

Timer zostaje na ekranie, dopóki nie stukniesz **OK**. Przetrwa też zminimalizowanie i zamknięcie aplikacji. Podczas treningu ekran nie gaśnie.

Żeby przerwa była widoczna w Dynamic Island i dzwoniła przy zablokowanym telefonie, zrób w aplikacji **Skróty** skrót „Przerwa” (instrukcja w **Plan → Timer w Zegarze**). Wtedy przycisk ⏱ przy timerze, albo automatycznie każda odhaczona seria, uruchamia systemowy minutnik.

## Kopia zapasowa

Zakładka **Plan → Kopia zapasowa → Pobierz kopię (JSON)**. Zrób ją co kilka tygodni i przed zmianą telefonu. Na nowym urządzeniu: **Wczytaj kopię**.

## Aktualizacja aplikacji

Po zmianie plików w repozytorium podbij wersję w `sw.js` (`silownia-v1` → `silownia-v2`). Telefon pobierze nową wersję przy następnym otwarciu z internetem. Dane zostają.

## Uruchomienie lokalnie na komputerze

```bash
cd silownia
python3 -m http.server 8000
```
Potem otwórz `http://localhost:8000`.

## Zmiany w planie

Ćwiczenia, serie, przerwy i ciężary startowe są na górze pliku `app.js` (`SESSIONS`). Procenty cyklu: `SCHEME` i `DEFAULT_PCT`. Twoje maksy i dane do kalorii zmieniasz w samej aplikacji, w zakładce **Plan**.
