# Portfolio website

A minimal, monochrome one-page portfolio: plain HTML, CSS and JavaScript.
There is no framework and no build step, so there's nothing to install and very little to break.

```
index.html          all the page text (name, headings, about, contact, socials)
css/style.css       all styling; colors and fonts are at the top in :root
js/projects.js      ✏️ your projects (the only JS file you need to edit)
js/main.js          builds the ring, project list and grid; scroll reveals
js/fx.js            extras: intro loader, draggable ring, text scramble,
                    clock, counters, footer letters (the site still works without it)
assets/             portrait, favicon, project screenshots, CV
```

## 1. Preview it on your computer

Opening `index.html` directly works, but a local server behaves like the real site:

```
npx http-server -p 5173 -c-1
```

Then open http://127.0.0.1:5173. (In VS Code you can also use the "Live Server" extension.)

## 2. Updating it

Your name, email, LinkedIn, projects and photos are already in. To change things later:

- **Text:** edit `index.html`. Spots you may want to revisit are marked ✏️ (toolkit, CV, extra socials).
- **Add a project:** add an entry to `js/projects.js`, plus a 4:3 screenshot (about 1200×900,
  `.jpg`, under ~250 KB) in `assets/projects/`. 6 projects fill the grid as two rows of three.
- **Hero portrait:** `assets/portrait.png` is a black-and-white cut-out with a transparent
  background. To swap it, use another cut-out PNG (remove.bg works) and update the
  `width`/`height` on the `<img>` in `index.html`.
- **About photo:** `assets/about.jpg` (4:5 ratio). It is shown in black and white automatically.
- **CV (optional):** add `assets/yash-desai-cv.pdf` and uncomment the "Download CV" link.
- **Share image (optional):** add `assets/og-image.jpg` (1200×630) and uncomment the
  `og:image` line in the `<head>`, using your full domain in the URL.

## 3. Before you publish: checklist

- [ ] The toolkit list matches your real skills
- [ ] Every project link works
- [ ] Tested on a phone (or Chrome DevTools → device toolbar) at 375px wide
- [ ] Images are compressed, so the whole page is ideally under ~3 MB
- [ ] Lighthouse (Chrome DevTools → Lighthouse) scores 90+ for Performance and Accessibility
- [ ] The email link opens your mail app

## 4. Publish it (free)

Any static host works. The easiest options:

- **Netlify Drop**: go to https://app.netlify.com/drop and drag this folder in. Done.
- **Vercel / Netlify with GitHub**: push the folder to a GitHub repo, then import it. Every
  `git push` redeploys automatically.
- **GitHub Pages**: push to a repo → Settings → Pages → deploy from the `main` branch, root folder.

A custom domain (`yourname.com`, around $10–15/year) can be connected in your host's settings.

## Notes

- Animations are switched off automatically for visitors who enable "reduce motion".
- The spinning ring pauses when it's off screen, to save battery.
- Fonts: [Archivo](https://fonts.google.com/specimen/Archivo) from Google Fonts.
- To change the color scheme, edit the variables at the top of `css/style.css`.
