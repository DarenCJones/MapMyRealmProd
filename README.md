# Map My Realm

A personal website for maps, coding projects, tutorials, a blog, and an invitation-only Members area, prepared for `www.mapmyrealm.com`. The public site is plain HTML, CSS, and JavaScript, so there is no build step.

## Make it yours

Edit `content.js` to set your site title and about text. Add entries to the `maps`, `projects`, `tutorials`, or `blog` arrays using the commented examples. Every entry can have a title, description, category, and URL. Images are optional; when you add one, put it in `assets/` and set `image` to a relative path such as `./assets/my-map.jpg`. Give informative images an `imageAlt` description. Edit the GitHub and LinkedIn links in `index.html` if they change.

For an interactive map, copy its exported HTML/CSS/JS files into `maps/my-map/` and link to `./maps/my-map/index.html`. For a static map, add the image to `assets/` and link directly to it, or create a page with context around it. For a tutorial, create an HTML page in `tutorials/` and link to it from `content.js`. URLs in `content.js` are relative to the site root, so they work whether GitHub Pages hosts this at a username domain or under a repository path.

The home page is an introduction. Maps, code projects, tutorials, Blog, Members, and About each have their own page. Their navigation links are in each HTML file; edit those pages if you rename a section.

## Activate the private Members area

GitHub Pages publishes its files openly. **Never put private posts, drafts, map images, passwords, or service-role keys in this repository.** The Members page uses Supabase Auth, database Row Level Security, and a private Storage bucket to protect the actual content. Until a Supabase project is connected, the page shows a setup message and does not claim that login is active.

1. Create a Supabase account and project at [supabase.com/dashboard](https://supabase.com/dashboard). Use a strong database password and keep it out of this repository.
2. In the Supabase SQL Editor, run [`members/setup.sql`](members/setup.sql). This creates membership roles, private entries, a private image bucket, and access rules.
3. In **Authentication → URL Configuration**, set the site URL to `https://www.mapmyrealm.com` and allow `https://www.mapmyrealm.com/members/` as a redirect URL. Add the local preview URL only while testing locally.
4. In **Authentication → Users**, invite your own email. Once that user exists, run the commented owner-role `insert` at the end of `members/setup.sql`, replacing `OWNER_EMAIL_HERE` with your email. Invite readers in the same place and add each one to `realm_members` with role `reader`. Leave public signups disabled; the site also sends magic links with `shouldCreateUser: false`.
5. The project URL and publishable key are already in [`members/config.js`](members/config.js). These are browser-facing values; **never use a secret or service-role key there**. After the SQL, redirects, and owner role are set, change `enabled` to `true` and publish the site again.
6. Test with your owner account and one invited-reader account. The owner should see drafts and be able to create, edit, and publish them. The reader should see only published private entries. An uninvited account should see no content.

Private map images are uploaded to the `realm-private` bucket from the owner workspace. Interactive map exports made of HTML and JavaScript cannot be kept private by merely placing them in the GitHub Pages repository; those would need a separate protected hosting solution.

To preview locally, serve this folder with a static web server and open its local URL. A server is needed for the navigation between pages. For example, if Python is installed, run `python -m http.server 8000` in this directory and open `http://localhost:8000/`.

## Publish with GitHub Pages

1. Create a **new** GitHub repository, such as `DarenCjones/mapmyrealm-site`. Keep the existing `DarenCjones/MapmyRealm` repository unchanged. Upload these files to the new repository's `main` branch, keeping `.github/workflows/pages.yml` and `.nojekyll`.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. In **Settings → Pages**, enter `www.mapmyrealm.com` as the custom domain. The `CNAME` file is included for portability, but GitHub Pages uses the setting when publishing through GitHub Actions. Point the domain's `www` CNAME record to `DarenCjones.github.io` at your DNS provider. Turn on **Enforce HTTPS** once GitHub makes it available.
4. Open **Actions → Publish to GitHub Pages** to follow the deployment. The deployment URL appears in the workflow result and in **Settings → Pages**.

Each later push to `main` publishes the site again. The workflow uses GitHub's official Pages actions and needs no secret or personal access token.

GitHub Pages serves all public pages, CSS, JavaScript, and images from this repository. Supabase only handles sign-in and content in the private Members area. The public site keeps working if Supabase is temporarily unavailable.
