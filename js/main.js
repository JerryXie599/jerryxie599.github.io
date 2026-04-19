(() => {
  const root = document.documentElement;
  const THEME_KEY = 'jerryxie-theme';

  function normalizeHref(path) {
    if (!path) return '/';
    return path.startsWith('/') ? path : `/${path}`;
  }

  function formatLanguageLabel(language) {
    const value = String(language || '').trim().toLowerCase();

    if (!value) return 'Code';

    const labels = {
      bash: 'Shell',
      shell: 'Shell',
      sh: 'Shell',
      zsh: 'Shell',
      powershell: 'PowerShell',
      pwsh: 'PowerShell',
      ps1: 'PowerShell',
      plain: 'Plain text',
      plaintext: 'Plain text',
      text: 'Plain text',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      json: 'JSON',
      yaml: 'YAML',
      markdown: 'Markdown',
      python: 'Python',
      sql: 'SQL',
      html: 'HTML',
      css: 'CSS',
      cpp: 'C++',
      csharp: 'C#',
      php: 'PHP',
      rust: 'Rust',
      java: 'Java',
      go: 'Go',
      xml: 'XML',
    };

    if (labels[value]) {
      return labels[value];
    }

    return value.replace(/(^|-)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
  }

  function findFigureLanguage(figure) {
    if (!figure) return '';

    const explicit = figure.getAttribute('data-language');
    if (explicit) return explicit.toLowerCase();

    const classes = Array.from(figure.classList);
    if (!classes.includes('highlight')) return '';

    const languageClass = classes.find((item) => item !== 'highlight');
    return languageClass ? languageClass.toLowerCase() : '';
  }

  function findPreLanguage(pre) {
    if (!pre) return '';

    const explicit = pre.getAttribute('data-language');
    if (explicit) return explicit.toLowerCase();

    const className = pre.className || '';
    const match = className.match(/\blanguage-([A-Za-z0-9#+._-]+)/i);
    return match ? match[1].toLowerCase() : '';
  }

  function applyCodeMetadata() {
    document.querySelectorAll('figure.highlight').forEach((figure) => {
      const language = findFigureLanguage(figure) || 'plaintext';
      figure.dataset.language = language;
      figure.dataset.languageLabel = formatLanguageLabel(language);
    });

    document.querySelectorAll('pre[data-language], pre[class*="language-"]').forEach((pre) => {
      const language = findPreLanguage(pre);
      if (!language) return;
      pre.dataset.language = language;
      pre.dataset.languageLabel = formatLanguageLabel(language);
    });
  }

  function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', nextTheme);

    const icon = document.querySelector('[data-theme-icon]');
    if (icon) {
      icon.textContent = nextTheme === 'dark' ? 'Light' : 'Dark';
    }
  }

  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme) {
    applyTheme(storedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  const themeToggle = document.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  const progressBar = document.querySelector('[data-scroll-progress]');
  const updateProgress = () => {
    if (!progressBar) return;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = total > 0 ? (scrollTop / total) * 100 : 0;
    progressBar.style.width = `${percent}%`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menuPanel = document.querySelector('[data-menu-panel]');
  if (menuToggle && menuPanel) {
    menuToggle.addEventListener('click', () => {
      menuPanel.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-search-root]').forEach((searchRoot) => {
    const input = searchRoot.querySelector('[data-search-input]');
    const count = searchRoot.querySelector('[data-search-count]');
    const cards = Array.from(searchRoot.querySelectorAll('[data-search-target]'));

    if (!input || !cards.length) return;

    const update = () => {
      const query = input.value.trim().toLowerCase();
      let visibleCount = 0;

      cards.forEach((card) => {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const category = (card.getAttribute('data-category') || '').toLowerCase();
        const matched = !query || title.includes(query) || category.includes(query);
        card.style.display = matched ? '' : 'none';
        if (matched) visibleCount += 1;
      });

      if (count) {
        count.textContent = `${visibleCount} posts`;
      }
    };

    input.addEventListener('input', update);
    update();
  });

  document.querySelectorAll('img').forEach((image) => {
    if (!image.src || !/^https?:\/\//i.test(image.src)) return;
    image.referrerPolicy = 'no-referrer';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.classList.add('external-image');
  });

  applyCodeMetadata();

  const folderIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 7.25A2.25 2.25 0 0 1 5.25 5h4.18a2.25 2.25 0 0 1 1.63.7l.67.7c.28.29.66.45 1.06.45h6.97A2.25 2.25 0 0 1 22 9.1v8.65A2.25 2.25 0 0 1 19.75 20H5.25A2.25 2.25 0 0 1 3 17.75Z"></path>
    </svg>
  `;
  const fileIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.25 3h6.88c.6 0 1.17.24 1.6.66l4.6 4.6c.42.43.67 1 .67 1.6v9.89A2.25 2.25 0 0 1 18.75 22h-11.5A2.25 2.25 0 0 1 5 19.75V5.25A2.25 2.25 0 0 1 7.25 3Z"></path>
      <path d="M14 3.5V8a1 1 0 0 0 1 1h4.5"></path>
    </svg>
  `;
  const arrowIcon = `
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="m7 4 6 6-6 6"></path>
    </svg>
  `;

  document.querySelectorAll('[data-folder-browser]').forEach((browser) => {
    const rawTree = browser.getAttribute('data-tree');
    if (!rawTree) return;

    let tree;
    try {
      tree = JSON.parse(rawTree);
    } catch (error) {
      console.error('Failed to parse folder tree', error);
      return;
    }

    const breadcrumbsEl = browser.querySelector('[data-folder-breadcrumbs]');
    const columnsEl = browser.querySelector('[data-folder-columns]');
    const explicitSelection = (browser.getAttribute('data-selection') || '').split('/').filter(Boolean);

    function buildDefaultSelection(node) {
      const chain = [];
      let current = node;

      while (current && Array.isArray(current.children) && current.children.length) {
        const next = current.children[0];
        chain.push(next.name);
        current = next;
      }

      return chain;
    }

    let selectedChain = explicitSelection.length ? explicitSelection : buildDefaultSelection(tree);

    function resolveNodes() {
      const nodes = [tree];
      let current = tree;

      selectedChain.forEach((name) => {
        if (!current || !Array.isArray(current.children)) return;
        const next = current.children.find((item) => item.name === name);
        if (!next) return;
        nodes.push(next);
        current = next;
      });

      return nodes;
    }

    function renderBreadcrumbs(nodes) {
      if (!breadcrumbsEl) return;

      breadcrumbsEl.innerHTML = nodes
        .map((node, index) => {
          const isLast = index === nodes.length - 1;
          return `<span class="finder-crumb${isLast ? ' is-active' : ''}">${node.name}</span>`;
        })
        .join('<span class="finder-crumb-sep">/</span>');
    }

    function folderRowMarkup(item, depth, selectedName) {
      const isActive = selectedName === item.name;
      return `
        <button
          type="button"
          class="finder-row folder${isActive ? ' is-active' : ''}"
          data-folder-select
          data-depth="${depth}"
          data-name="${item.name}"
        >
          <span class="finder-icon" aria-hidden="true">${folderIcon}</span>
          <span class="finder-label">${item.name}</span>
          <span class="finder-meta">${item.total}</span>
          <span class="finder-arrow" aria-hidden="true">${arrowIcon}</span>
        </button>
      `;
    }

    function postRowMarkup(post) {
      return `
        <a class="finder-row file" href="${normalizeHref(post.path)}" data-folder-post>
          <span class="finder-icon" aria-hidden="true">${fileIcon}</span>
          <span class="finder-label">${post.title}</span>
          <span class="finder-meta">${post.readingTime}</span>
          <span class="finder-arrow" aria-hidden="true">${arrowIcon}</span>
        </a>
      `;
    }

    function renderColumn(node, depth, selectedName) {
      const folders = Array.isArray(node.children) ? node.children : [];
      const posts = Array.isArray(node.posts) ? node.posts : [];
      const folderRows = folders.map((item) => folderRowMarkup(item, depth, selectedName)).join('');
      const postRows = posts.map((post) => postRowMarkup(post)).join('');
      const emptyMarkup = folders.length || posts.length
        ? ''
        : '<div class="finder-empty">This folder is empty.</div>';
      const openLink = node.path
        ? `<a class="finder-column-link" href="${normalizeHref(node.path)}">Open folder</a>`
        : '';

      return `
        <section class="finder-column">
          <header class="finder-column-header">
            <div>
              <strong>${node.name}</strong>
              <span>${folders.length} folders / ${posts.length} posts</span>
            </div>
            ${openLink}
          </header>
          <div class="finder-list">
            ${folderRows}
            ${postRows}
            ${emptyMarkup}
          </div>
        </section>
      `;
    }

    function render() {
      const nodes = resolveNodes();
      renderBreadcrumbs(nodes);

      columnsEl.innerHTML = nodes
        .map((node, depth) => renderColumn(node, depth, selectedChain[depth]))
        .join('');

      columnsEl.querySelectorAll('[data-folder-select]').forEach((button) => {
        button.addEventListener('click', () => {
          const depth = Number(button.getAttribute('data-depth'));
          const name = button.getAttribute('data-name');
          selectedChain = selectedChain.slice(0, depth);
          selectedChain[depth] = name;
          render();
        });
      });
    }

    render();
  });
})();
