# Spike Hu — Resume

Personal resume website for Spike Hu, built with static HTML, CSS, and JavaScript.

The homepage opens in **English** by default. Use the **中文 / English** button to switch languages. A URL with `?lang=zh` opens the Chinese edition directly; section anchors are preserved when switching. The downloadable `resume.pdf` remains the original Chinese CV.

## Local preview

Open `index.html` directly, or run a local static server from this directory:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8765/`. No build step or package installation is required.

## Files

- `index.html`: resume content, project experience, and base styles.
- `translations.js`: English content and accessibility labels; the original markup supplies the Chinese edition.
- `site.js`: language selection, metadata, and browser-history handling.
- `site.css`: English typography and responsive language controls.
- `field.js`: local Canvas particle loop for the opening screen; respects reduced motion and pauses offscreen.

Hu Lai is included in the StepFun project list under work experience. Its resume bullets describe system design, session routing and isolation, context management, concurrent execution, and artifact delivery.

The screen layout uses a dark research-inspired theme, green accents, a responsive opening screen, and a section-aware resume index. Print styles retain a light document layout. All visuals are generated locally, with no external font or animation dependencies.

## Deployment

GitHub Pages serves the `main` branch of `MadarameHu/MadarameHu.github.io`. Local changes require a separate commit and push to publish.
