# Map My Realm

A personal website for maps, coding projects, tutorials, a blog, and an invitation-only Members area. The live site is [DarenCJones.github.io/MapMyRealmProd](https://darencjones.github.io/MapMyRealmProd/). The public site is plain HTML, CSS, and JavaScript, so there is no build step.

## Make it yours

Edit `content.js` to set your site title and about text. Add entries to the `maps`, `projects`, `tutorials`, or `blog` arrays using the commented examples. Every entry can have a title, description, category, and URL. Images are optional; when you add one, put it in `assets/` and set `image` to a relative path such as `./assets/my-map.jpg`. Give informative images an `imageAlt` description. Edit the GitHub and LinkedIn links in `index.html` if they change.

For an interactive map, copy its exported HTML/CSS/JS files into `maps/my-map/` and link to `./maps/my-map/index.html`. For a static map, add the image to `assets/` and link directly to it, or create a page with context around it. For a tutorial, create an HTML page in `tutorials/` and link to it from `content.js`. URLs in `content.js` are relative to the site root, so they work whether GitHub Pages hosts this at a username domain or under a repository path.

The home page is an introduction. Maps, code projects, tutorials, Blog, Members, and About each have their own page. Their navigation links are in each HTML file; edit those pages if you rename a section.

## Private Members area

GitHub Pages publishes its files openly. **Never put private posts, drafts, map images, passwords, or service-role keys in this repository.** The Members page uses Supabase Auth, database Row Level Security, and a private Storage bucket to protect the actual content. The Supabase project, owner role, and sign-in redirect are configured. The owner invitation was sent to `DarenCjones@gmail.com`; accept that email invitation to sign in.

The database was initialized with [`members/setup.sql`](members/setup.sql). Supabase Authentication is configured with site URL `https://darencjones.github.io/MapMyRealmProd/` and allowed redirect `https://darencjones.github.io/MapMyRealmProd/members/`. Public signups are disabled. The project URL and browser-safe publishable key are in [`members/config.js`](members/config.js); **never put a secret or service-role key there**.

To add a reader, invite their email in **Supabase → Authentication → Users**, then assign the `reader` role to that invited account with a SQL query like this (replace the address):

```sql
insert into public.realm_members (user_id, role)
select id, 'reader' from auth.users where lower(email) = lower('reader@example.com')
on conflict (user_id) do update set role = 'reader';
```

After accepting the owner invitation, test creating and publishing a private entry. With an invited-reader account, check that published entries appear and drafts remain hidden.

Private map images are uploaded to the `realm-private` bucket from the owner workspace. Interactive map exports made of HTML and JavaScript cannot be kept private by merely placing them in the GitHub Pages repository; those would need a separate protected hosting solution.

To preview locally, serve this folder with a static web server and open its local URL. A server is needed for the navigation between pages. For example, if Python is installed, run `python -m http.server 8000` in this directory and open `http://localhost:8000/`.

## Publish with GitHub Pages

The site is in the **new** repository [`DarenCJones/MapMyRealmProd`](https://github.com/DarenCJones/MapMyRealmProd), with GitHub Actions as its Pages source. The older `DarenCjones/MapmyRealm` repository remains untouched. The custom domain is not assigned to this repository; for now use the live GitHub Pages URL above. Each push to `main` triggers `.github/workflows/pages.yml` and publishes the public site.

The workflow uses GitHub's official Pages actions and needs no secret or personal access token.

GitHub Pages serves all public pages, CSS, JavaScript, and images from this repository. Supabase only handles sign-in and content in the private Members area. The public site keeps working if Supabase is temporarily unavailable.
