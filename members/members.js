(() => {
  const config = window.realmPrivateConfig || {};
  const message = document.querySelector('#member-message');
  const setupPanel = document.querySelector('#setup-panel');
  const loginForm = document.querySelector('#login-form');
  const dashboard = document.querySelector('#member-dashboard');
  const ownerForm = document.querySelector('#owner-form');
  const entryGrid = document.querySelector('#member-entries');
  const roleLabel = document.querySelector('#member-role');
  const editorTitle = document.querySelector('#editor-title');
  const cancelEdit = document.querySelector('#cancel-edit');
  const field = (form, name) => form.elements.namedItem(name);
  const objectUrls = [];
  let client;
  let role = '';
  let editingId = null;
  let entries = [];

  const tell = text => { message.textContent = text; };
  const show = (element, visible) => { element.hidden = !visible; };
  const configured = config.enabled === true && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url || '') && typeof config.publishableKey === 'string' && config.publishableKey.length > 20;

  if (!configured) {
    tell('Private access is being connected.');
    show(setupPanel, true);
    return;
  }
  if (!window.supabase?.createClient) {
    tell('Sign-in could not load. Please try again later.');
    return;
  }
  client = window.supabase.createClient(config.url, config.publishableKey);

  const clearImages = () => { objectUrls.forEach(url => URL.revokeObjectURL(url)); objectUrls.length = 0; };
  const button = (label, action, quiet = false) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.textContent = label;
    if (quiet) node.className = 'quiet-button';
    node.addEventListener('click', action);
    return node;
  };

  async function renderEntries() {
    clearImages();
    entryGrid.replaceChildren();
    const { data, error } = await client.from('realm_entries').select('id,title,summary,body,kind,status,image_path,created_at').order('created_at', { ascending: false });
    if (error) { tell('Private content could not be loaded.'); return; }
    entries = data || [];
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-card';
      const title = document.createElement('h3');
      title.textContent = role === 'owner' ? 'Your workspace is ready.' : 'No private work has been published yet.';
      const copy = document.createElement('p');
      copy.textContent = role === 'owner' ? 'Create a draft below to begin.' : 'Check back for maps and posts shared with members.';
      empty.append(title, copy);
      entryGrid.append(empty);
      return;
    }
    for (const entry of entries) {
      const card = document.createElement('article');
      card.className = 'member-entry';
      const meta = document.createElement('p');
      meta.className = 'entry-meta';
      meta.textContent = `${entry.kind} · ${entry.status}`;
      const title = document.createElement('h3');
      title.textContent = entry.title;
      const summary = document.createElement('p');
      summary.textContent = entry.summary || '';
      const body = document.createElement('p');
      body.textContent = entry.body || '';
      card.append(meta, title, summary);
      if (entry.image_path) {
        const { data: imageBlob } = await client.storage.from('realm-private').download(entry.image_path);
        if (imageBlob) {
          const imageUrl = URL.createObjectURL(imageBlob);
          objectUrls.push(imageUrl);
          const image = document.createElement('img');
          image.src = imageUrl;
          image.alt = entry.title;
          card.append(image);
        }
      }
      card.append(body);
      if (role === 'owner') {
        const actions = document.createElement('div');
        actions.className = 'entry-actions';
        if (entry.status === 'draft') actions.append(button('Edit draft', () => editEntry(entry), true));
        actions.append(button(entry.status === 'draft' ? 'Publish for members' : 'Return to drafts', () => setPublished(entry)));
        card.append(actions);
      }
      entryGrid.append(card);
    }
    tell(role === 'owner' ? 'Owner workspace' : 'Shared with invited members');
  }

  async function render() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) {
      role = '';
      show(loginForm, true);
      show(dashboard, false);
      show(ownerForm, false);
      tell('Sign in with an invited email address.');
      return;
    }
    const membership = await client.from('realm_members').select('role').eq('user_id', session.user.id).maybeSingle();
    if (membership.error || !['owner', 'reader'].includes(membership.data?.role)) {
      await client.auth.signOut();
      show(loginForm, true);
      show(dashboard, false);
      show(ownerForm, false);
      tell('This account does not have access. Ask the site owner for an invitation.');
      return;
    }
    role = membership.data.role;
    roleLabel.textContent = role === 'owner' ? 'OWNER WORKSPACE' : 'INVITED READER';
    show(loginForm, false);
    show(dashboard, true);
    show(ownerForm, role === 'owner');
    await renderEntries();
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = field(loginForm, 'email').value.trim();
    if (!email) return;
    const submit = loginForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.href.split('#')[0] } });
    submit.disabled = false;
    tell(error ? 'The sign-in link could not be sent. Please try again.' : 'If this address has been invited, a sign-in link is on its way.');
  });

  document.querySelector('#sign-out').addEventListener('click', async () => { await client.auth.signOut(); await render(); });

  function editEntry(entry) {
    editingId = entry.id;
    field(ownerForm, 'title').value = entry.title;
    field(ownerForm, 'kind').value = entry.kind;
    field(ownerForm, 'summary').value = entry.summary || '';
    field(ownerForm, 'body').value = entry.body || '';
    editorTitle.textContent = 'Edit draft';
    cancelEdit.hidden = false;
    ownerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetEditor() {
    editingId = null;
    ownerForm.reset();
    editorTitle.textContent = 'Create a draft';
    cancelEdit.hidden = true;
  }
  cancelEdit.addEventListener('click', resetEditor);

  async function setPublished(entry) {
    const status = entry.status === 'draft' ? 'published' : 'draft';
    const { error } = await client.from('realm_entries').update({ status }).eq('id', entry.id);
    if (error) tell('That change could not be saved.');
    else await renderEntries();
  }

  ownerForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (role !== 'owner') return;
    const submit = ownerForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    const title = field(ownerForm, 'title').value.trim();
    const kind = field(ownerForm, 'kind').value;
    const summary = field(ownerForm, 'summary').value.trim();
    const body = field(ownerForm, 'body').value.trim();
    const file = field(ownerForm, 'image').files[0];
    if (!title || !body || !['map', 'post'].includes(kind)) { submit.disabled = false; return; }
    let imagePath = entries.find(item => item.id === editingId)?.image_path || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) { tell('Choose an image smaller than 10 MB.'); submit.disabled = false; return; }
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : '';
      if (!extension) { tell('Choose a PNG, JPEG, or WebP image.'); submit.disabled = false; return; }
      const path = `${crypto.randomUUID()}.${extension}`;
      const upload = await client.storage.from('realm-private').upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error) { tell('The map image could not be uploaded.'); submit.disabled = false; return; }
      imagePath = path;
    }
    const values = { title, kind, summary, body, image_path: imagePath };
    const result = editingId ? await client.from('realm_entries').update(values).eq('id', editingId) : await client.from('realm_entries').insert({ ...values, status: 'draft' });
    submit.disabled = false;
    if (result.error) { tell('The draft could not be saved.'); return; }
    resetEditor();
    await renderEntries();
  });

  client.auth.onAuthStateChange(() => { setTimeout(render, 0); });
  render();
})();
