# cenjhihli.github.io

Personal academic website of Cen-Jhih Li. Plain HTML/CSS/JS, no build step.

```
index.html               all page content
Cen_Jhih_Li_CV.pdf       CV (kept at the top level so its public URL never changes)
assets/
  css/style.css          styles, light and dark mode; the color palette is the "Palette" block at the top
  js/main.js             page behavior: Abstract/BibTeX panels, Copy buttons, section reveals,
                         the dog on the waves, the "Last updated" date
  img/profile.jpg        photo
  img/malamute.png       the dog that rides the waves under the photo
  img/cursor.svg         pointer cursor for links and buttons
  img/favicon/           tab icon in three versions: cl (in use), dog, dog-photo
```

## Updating

- **News**: add a new `<li>` at the top of the `news` list in `index.html`.
- **Publications**: copy an existing `<li>` in the `pubs` list and edit it.
- **Photo**: overwrite `assets/img/profile.jpg` (4:5 portrait, about 500×625 px).
- **CV**: overwrite `Cen_Jhih_Li_CV.pdf` with the new version. Keep the same name and place, since the link may already be shared elsewhere.
- **Tab icon**: to switch versions, change `cl` in the three icon lines at the top of `index.html` to `dog` or `dog-photo` (`dog-photo` has no `.svg`, so drop that line).
- **After editing `style.css` or `main.js`**: bump the `?v=` number on both in `index.html` so returning visitors get the new files.
- **Images used from CSS** (cursor, dog) are written as `../img/...`, because CSS paths are relative to the stylesheet's own folder.
- **"Last updated"** in the footer fills itself in from the publish date; no need to edit it.
- **Icons** (envelope, GitHub, arrow, …) are inline SVG, defined once in the hidden `<svg class="icon-sprite">` at the top of `index.html` and used as `<svg class="icon" viewBox="…"><use href="#i-…"/></svg>`. To add one, copy its path from fontawesome.com (Free icons, CC BY 4.0) into a new `<symbol>`.
- **Adding analytics, an embed, or another CDN**: also add its domain to the `Content-Security-Policy` line at the top of `index.html`, or the browser will block it.

Commit and push; GitHub Pages republishes within a minute or two.
