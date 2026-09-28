(() => {
  const content = window.siteContent || {};
  const page = document.body.dataset.page || "home";
  const pageNames = { maps: "Maps", projects: "Code projects", tutorials: "Tutorials", blog: "Blog", members: "Members", about: "About" };
  const rootUrl = new URL("./", document.querySelector('script[src$="site.js"]').src);
  const labels = { maps: "map", projects: "project", tutorials: "tutorial", blog: "post" };
  const emptyText = {
    maps: ["The map collection starts here.", "New maps will appear as they are published."],
    projects: ["The project shelf is taking shape.", "Code projects will appear here soon."],
    tutorials: ["A library of practical guides is on its way.", "Tutorials will appear here soon."],
    blog: ["The journal begins here.", "New posts will appear as they are published."]
  };

  document.querySelectorAll("[data-site-title]").forEach(node => { node.textContent = content.title || "Map My Realm"; });
  document.title = pageNames[page] ? `${pageNames[page]} — ${content.title || "Map My Realm"}` : `${content.title || "Map My Realm"} — maps, code & tutorials`;
  const about = document.querySelector("[data-about]");
  if (about && content.about) about.textContent = content.about;
  document.querySelector("#copyright").textContent = `© ${new Date().getFullYear()}`;

  const safeUrl = value => {
    if (typeof value !== "string") return "";
    try {
      const url = new URL(value, rootUrl);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  for (const [kind, singular] of Object.entries(labels)) {
    const grid = document.querySelector(`#${kind === "projects" ? "project" : kind === "tutorials" ? "tutorial" : kind === "maps" ? "map" : "blog"}-grid`);
    if (!grid) continue;
    const entries = Array.isArray(content[kind]) ? content[kind] : [];
    if (!entries.length) {
      const card = document.createElement("div");
      card.className = "empty-card";
      const label = document.createElement("span");
      label.className = "empty-label";
      label.textContent = kind === "blog" ? "NO POSTS PUBLISHED YET" : `NO ${kind.toUpperCase()} PUBLISHED YET`;
      const body = document.createElement("div");
      body.className = "empty-content";
      const heading = document.createElement("h3");
      heading.textContent = emptyText[kind][0];
      const description = document.createElement("p");
      description.textContent = emptyText[kind][1];
      body.append(heading, description);
      card.append(label, body);
      grid.append(card);
      continue;
    }
    entries.forEach(entry => {
      if (!entry || !entry.title) return;
      const card = document.createElement("article");
      card.className = "work-card";
      const imageUrl = safeUrl(entry.image);
      if (imageUrl) {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = entry.imageAlt || "";
        img.loading = "lazy";
        card.append(img);
      }
      const body = document.createElement("div");
      body.className = "card-body";
      const meta = document.createElement("p");
      meta.className = "card-meta";
      meta.textContent = entry.category || singular;
      const heading = document.createElement("h3");
      heading.textContent = entry.title;
      const description = document.createElement("p");
      description.textContent = entry.description || "";
      body.append(meta, heading, description);
      const target = safeUrl(entry.url);
      if (target) {
        const link = document.createElement("a");
        link.className = "card-link";
        link.href = target;
        link.textContent = `View ${singular} ↗`;
        if (new URL(target, document.baseURI).origin !== location.origin) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.setAttribute("aria-label", `View ${entry.title} (opens in a new tab)`);
        }
        body.append(link);
      }
      card.append(body);
      grid.append(card);
    });
  }
})();
