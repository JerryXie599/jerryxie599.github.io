(() => {
  const root = document.documentElement;
  const THEME_KEY = 'jerryxie-theme';

  function normalizeHref(path) {
    if (!path) return '/';
    return path.startsWith('/') ? path : `/${path}`;
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    const icon = document.querySelector('[data-theme-icon]');
    if (icon) {
      icon.textContent = theme === 'dark' ? 'Light' : 'Dark';
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
        count.textContent = `Showing ${visibleCount} posts`;
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

  function normalizeStandaloneMathBlocks(container) {
    container.querySelectorAll('p').forEach((paragraph) => {
      if (paragraph.children.length) return;

      const text = (paragraph.textContent || '').trim();
      if (!text || !text.startsWith('$') || !text.endsWith('$')) return;
      if (text.startsWith('$$') && text.endsWith('$$')) return;

      const match = text.match(/^\$([\s\S]+)\$$/);
      if (!match || !match[1].trim()) return;

      paragraph.textContent = `$$${match[1].trim()}$$`;
      paragraph.setAttribute('data-math-block', 'true');
    });
  }

  function initMathRendering() {
    if (typeof window.renderMathInElement !== 'function') return;

    document.querySelectorAll('.article-content').forEach((articleContent) => {
      if (articleContent.dataset.mathReady === 'true') return;

      normalizeStandaloneMathBlocks(articleContent);
      window.renderMathInElement(articleContent, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
        strict: 'ignore',
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoredClasses: ['katex'],
      });

      articleContent.dataset.mathReady = 'true';
    });

    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }

  function copyIconMarkup(isCopied = false) {
    if (isCopied) {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
          <path d="M4.5 10.25 8 13.75 15.5 6.25" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <rect x="7" y="3.5" width="8.5" height="11" rx="1.8" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5.5 6H4.8A1.8 1.8 0 0 0 3 7.8v7.4C3 16.2 3.8 17 4.8 17h6.4A1.8 1.8 0 0 0 13 15.2v-.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
  }

  function setCopyButtonState(button, isCopied) {
    button.dataset.copyState = isCopied ? 'copied' : 'idle';
    button.setAttribute('aria-label', isCopied ? 'Copied' : 'Copy code');
    button.setAttribute('title', isCopied ? 'Copied' : 'Copy code');
    button.innerHTML = copyIconMarkup(isCopied);
  }

  function normalizeCopiedText(text) {
    return String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n$/, '');
  }

  function extractCodeText(block) {
    const highlighted = block.matches('figure.highlight')
      ? block.querySelector('.code pre')
      : null;
    const source = highlighted || block.querySelector('code') || block;
    return normalizeCopiedText(source.innerText || source.textContent || '');
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        const isSuccessful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (isSuccessful) {
          resolve();
        } else {
          reject(new Error('Copy command was rejected.'));
        }
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
      }
    });
  }

  function initCodeCopyButtons() {
    document.querySelectorAll('.article-content figure.highlight, .article-content pre').forEach((block) => {
      if (block.tagName.toLowerCase() === 'pre' && block.closest('figure.highlight')) return;
      if (block.dataset.copyReady === 'true') return;

      const codeText = extractCodeText(block);
      if (!codeText.trim()) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      setCopyButtonState(button, false);

      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
          await copyText(codeText);
          setCopyButtonState(button, true);
          window.clearTimeout(button.__copyResetTimer);
          button.__copyResetTimer = window.setTimeout(() => {
            setCopyButtonState(button, false);
          }, 1600);
        } catch (error) {
          setCopyButtonState(button, false);
          console.error('Failed to copy code block', error);
        }
      });

      block.classList.add('has-copy-button');
      block.dataset.copyReady = 'true';
      block.appendChild(button);
    });
  }

  function initArticleTocSync() {
    document.querySelectorAll('.article-layout').forEach((articleLayout) => {
      const tocShell = articleLayout.querySelector('.toc-shell');
      const articleContent = articleLayout.querySelector('.article-content');
      if (!tocShell || !articleContent) return;

      const tocLinks = Array.from(tocShell.querySelectorAll('.toc-list-link[href^="#"], a[href^="#"]'))
        .filter((link) => !link.classList.contains('headerlink'));
      if (!tocLinks.length) return;

      const decodeHash = (link) => {
        const rawHash = (link.getAttribute('href') || '').replace(/^#/, '');
        if (!rawHash) return '';
        try {
          return decodeURIComponent(rawHash);
        } catch (error) {
          return rawHash;
        }
      };

      const tocItems = tocLinks
        .map((link) => ({
          link,
          listItem: link.closest('.toc-list-item'),
          target: decodeHash(link) ? document.getElementById(decodeHash(link)) : null,
        }))
        .filter((item) => item.target);

      if (!tocItems.length) return;

      let activeIndex = -1;
      let ticking = false;
      const visibleIndices = new Set();

      const activationOffset = () => {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
        return Math.max(120, Math.min(220, Math.round(viewportHeight * 0.28)));
      };

      function clearActiveState() {
        tocShell.querySelectorAll('.is-active').forEach((node) => {
          node.classList.remove('is-active');
        });
      }

      function keepActiveLinkVisible(link, behavior = 'auto') {
        const shellRect = tocShell.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const topBuffer = 28;
        const bottomBuffer = 36;

        if (
          linkRect.top >= shellRect.top + topBuffer
          && linkRect.bottom <= shellRect.bottom - bottomBuffer
        ) {
          return;
        }

        const nextTop = tocShell.scrollTop + (linkRect.top - shellRect.top) - (tocShell.clientHeight * 0.34);
        tocShell.scrollTo({
          top: Math.max(0, nextTop),
          behavior,
        });
      }

      function setActiveIndex(index, options = {}) {
        const { ensureVisible = true, behavior = 'auto' } = options;
        if (index < 0 || index >= tocItems.length) return;
        if (index === activeIndex) {
          if (ensureVisible) {
            keepActiveLinkVisible(tocItems[index].link, behavior);
          }
          return;
        }

        clearActiveState();

        const current = tocItems[index];
        current.link.classList.add('is-active');

        let currentListItem = current.listItem;
        while (currentListItem) {
          currentListItem.classList.add('is-active');
          currentListItem = currentListItem.parentElement
            ? currentListItem.parentElement.closest('.toc-list-item')
            : null;
        }

        activeIndex = index;
        if (ensureVisible) {
          keepActiveLinkVisible(current.link, behavior);
        }
      }

      function nearestIndexByScrollPosition() {
        const threshold = activationOffset();
        let candidate = 0;
        let nearest = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        tocItems.forEach((item, index) => {
          const rect = item.target.getBoundingClientRect();
          const distance = Math.abs(rect.top - threshold);
          if (rect.top <= threshold) {
            candidate = index;
          }
          if (distance < nearestDistance) {
            nearest = index;
            nearestDistance = distance;
          }
        });

        return candidate >= 0 ? candidate : nearest;
      }

      function syncTocWithScroll() {
        ticking = false;
        const fallbackIndex = nearestIndexByScrollPosition();

        if (visibleIndices.size) {
          const threshold = activationOffset();
          const visible = Array.from(visibleIndices).sort((left, right) => left - right);
          let candidate = fallbackIndex;

          visible.forEach((index) => {
            if (tocItems[index].target.getBoundingClientRect().top <= threshold) {
              candidate = index;
            }
          });

          setActiveIndex(candidate);
          return;
        }

        setActiveIndex(fallbackIndex);
      }

      function requestSync() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(syncTocWithScroll);
      }

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const index = Number(entry.target.getAttribute('data-toc-index'));
            if (Number.isNaN(index)) return;

            if (entry.isIntersecting) {
              visibleIndices.add(index);
            } else {
              visibleIndices.delete(index);
            }
          });

          requestSync();
        }, {
          root: null,
          rootMargin: '-12% 0px -62% 0px',
          threshold: [0, 0.1, 0.25, 0.5, 1],
        });

        tocItems.forEach((item, index) => {
          item.target.setAttribute('data-toc-index', String(index));
          observer.observe(item.target);
        });
      }

      tocItems.forEach((item, index) => {
        item.link.addEventListener('click', () => {
          setActiveIndex(index, { behavior: 'smooth' });
          window.setTimeout(requestSync, 160);
          window.setTimeout(requestSync, 420);
        });
      });

      articleContent.querySelectorAll('img').forEach((image) => {
        if (!image.complete) {
          image.addEventListener('load', requestSync);
          image.addEventListener('error', requestSync);
        }
      });

      window.addEventListener('scroll', requestSync, { passive: true });
      window.addEventListener('resize', requestSync);
      window.addEventListener('hashchange', requestSync);
      window.addEventListener('load', requestSync);

      requestSync();
    });
  }

  function initFolderBrowsers() {
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

      function folderIconMarkup() {
        return `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M3.75 7.5a2.25 2.25 0 0 1 2.25-2.25h4.1c.5 0 .97.2 1.31.56l1.28 1.33c.34.35.81.56 1.3.56H18A2.25 2.25 0 0 1 20.25 9v7.5A2.25 2.25 0 0 1 18 18.75H6A2.25 2.25 0 0 1 3.75 16.5V7.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M3.75 9.75h16.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        `;
      }

      function fileIconMarkup() {
        return `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M8.25 3.75h5.38c.4 0 .78.16 1.06.44l4.12 4.12c.28.28.44.66.44 1.06v8.88A2.25 2.25 0 0 1 17 20.5H8.25A2.25 2.25 0 0 1 6 18.25v-12A2.25 2.25 0 0 1 8.25 4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M14.25 3.75v4.5h4.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M9 13.25h6M9 16.25h4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        `;
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
            <span class="finder-icon" aria-hidden="true">${folderIconMarkup()}</span>
            <span class="finder-label">${item.name}</span>
            <span class="finder-meta">${item.total}</span>
            <span class="finder-arrow">&gt;</span>
          </button>
        `;
      }

      function postRowMarkup(post) {
        return `
          <a class="finder-row file" href="${normalizeHref(post.path)}" data-folder-post>
            <span class="finder-icon" aria-hidden="true">${fileIconMarkup()}</span>
            <span class="finder-label">${post.title}</span>
            <span class="finder-meta">${post.readingTime}</span>
            <span class="finder-arrow">-&gt;</span>
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
          : '<div class="finder-empty">No posts in this folder yet.</div>';
        const openLink = node.path
          ? `<a class="finder-column-link" href="${normalizeHref(node.path)}">Open folder page</a>`
          : '';

        return `
          <section class="finder-column">
            <header class="finder-column-header">
              <div>
                <strong>${node.name}</strong>
                <span>${folders.length} subfolders / ${posts.length} notes</span>
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
  }

  initMathRendering();
  initCodeCopyButtons();
  initArticleTocSync();
  initFolderBrowsers();
})();
