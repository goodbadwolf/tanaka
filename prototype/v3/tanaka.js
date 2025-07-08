// Tanaka Extension - Common JavaScript Functions

// ===== Toggle Functions =====
function toggleClass(element, className) {
  element.classList.toggle(className);
}

function toggleElement(element, forceState = null) {
  if (forceState !== null) {
    element.style.display = forceState ? 'block' : 'none';
  } else {
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleActive(element, parent = null, singleSelect = true) {
  if (singleSelect && parent) {
    parent.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
  }
  element.classList.toggle('active');
}

// ===== Tab Navigation =====
function initTabNavigation(tabSelector = '.nav-tab', contentSelector = '.tab-content') {
  const tabs = document.querySelectorAll(tabSelector);
  const contents = document.querySelectorAll(contentSelector);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // Add active to clicked
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      const content = document.getElementById(`${tabName}-tab`);
      if (content) content.classList.add('active');
    });
  });
}

// ===== Form Handling =====
function validateForm(formElement) {
  const inputs = formElement.querySelectorAll('input[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
  });

  return isValid;
}

function clearForm(formElement) {
  formElement.querySelectorAll('input, textarea').forEach(input => {
    input.value = '';
    input.classList.remove('error');
  });
}

function makeEditable(element, onSave) {
  element.addEventListener('click', (e) => {
    if (element.classList.contains('editing')) return;

    const originalText = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = element.dataset.inputClass || 'edit-input';
    input.value = originalText;

    element.classList.add('editing');
    element.style.display = 'none';
    element.parentNode.insertBefore(input, element.nextSibling);
    input.focus();
    input.select();

    const saveEdit = () => {
      const newText = input.value.trim() || originalText;
      element.textContent = newText;
      element.style.display = '';
      element.classList.remove('editing');
      input.remove();
      if (onSave) onSave(newText, originalText);
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        input.value = originalText;
        saveEdit();
      }
    });
  });
}

// ===== Animation Triggers =====
function animateElement(element, animationClass, duration = 1000) {
  element.classList.add(animationClass);
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, duration);
}

function slideIn(element, direction = 'right') {
  element.style.animation = `slideIn${direction} 0.3s ease-out forwards`;
}

function slideOut(element, direction = 'right', onComplete) {
  element.style.animation = `slideOut${direction} 0.3s ease-out forwards`;
  if (onComplete) {
    setTimeout(onComplete, 300);
  }
}

// ===== Local Storage Utilities =====
const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};

// ===== Event Handlers =====
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function onClickOutside(element, callback) {
  document.addEventListener('click', (e) => {
    if (!element.contains(e.target)) {
      callback(e);
    }
  });
}

function onEscapeKey(callback) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      callback(e);
    }
  });
}

// ===== Selection Management =====
class SelectionManager {
  constructor() {
    this.selected = new Set();
  }

  toggle(id, element) {
    if (this.selected.has(id)) {
      this.selected.delete(id);
      element.classList.remove('selected');
    } else {
      this.selected.add(id);
      element.classList.add('selected');
    }
    this.updateUI();
  }

  selectAll(elements) {
    elements.forEach(el => {
      const id = el.dataset.id || Math.random().toString();
      this.selected.add(id);
      el.classList.add('selected');
    });
    this.updateUI();
  }

  clearAll() {
    this.selected.clear();
    document.querySelectorAll('.selected').forEach(el => {
      el.classList.remove('selected');
    });
    this.updateUI();
  }

  updateUI() {
    const count = this.selected.size;
    const countEl = document.querySelector('[data-selection-count]');
    if (countEl) {
      countEl.textContent = count;
    }
  }
}

// ===== Toast Notifications =====
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${getToastIcon(type)}</div>
    <span class="toast-message">${message}</span>
  `;

  const container = document.getElementById('toastContainer') || createToastContainer();
  container.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  };
  return icons[type] || icons.info;
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ===== Search Functionality =====
function initSearchInput(inputSelector, onSearch) {
  const input = document.querySelector(inputSelector);
  if (!input) return;

  const clearBtn = input.parentElement.querySelector('.search-clear');
  const debouncedSearch = debounce(onSearch, 300);

  input.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
    if (clearBtn) {
      clearBtn.style.display = e.target.value ? 'block' : 'none';
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.focus();
      onSearch('');
      clearBtn.style.display = 'none';
    });
  }
}

// ===== Modal/Overlay Management =====
function showOverlay(contentElement, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.appendChild(contentElement);

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Animate in
  setTimeout(() => overlay.classList.add('show'), 10);

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
      if (onClose) onClose();
    }, 300);
  };

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Close on escape
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  return { close };
}

// ===== Utility Functions =====
function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

async function copyToClipboard(text, onSuccess) {
  try {
    await navigator.clipboard.writeText(text);
    if (onSuccess) onSuccess();
    showToast('Copied to clipboard!', 'success');
  } catch (err) {
    showToast('Failed to copy', 'error');
  }
}

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ===== Theme Management =====
function toggleTheme() {
  const currentTheme = storage.get('theme', 'dark');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.body.classList.remove(`theme-${currentTheme}`);
  document.body.classList.add(`theme-${newTheme}`);
  storage.set('theme', newTheme);

  return newTheme;
}

function initTheme() {
  const savedTheme = storage.get('theme', 'dark');
  document.body.classList.add(`theme-${savedTheme}`);
}

// ===== Initialization Helper =====
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// Initialize all common components
function initTanaka() {
  ready(() => {
    // Initialize theme
    initTheme();

    // Initialize tabs
    if (document.querySelector('.nav-tab')) {
      initTabNavigation();
    }

    // Initialize all search inputs
    document.querySelectorAll('[data-search]').forEach(input => {
      initSearchInput(`#${input.id}`, (query) => {
        console.log('Search:', query);
      });
    });

    // Initialize editable elements
    document.querySelectorAll('[data-editable]').forEach(el => {
      makeEditable(el);
    });

    // Initialize toggles
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('click', () => toggleClass(toggle, 'active'));
    });

    // Initialize tooltips
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = el.dataset.tooltip;
      el.style.position = 'relative';
      el.appendChild(tooltip);

      el.addEventListener('mouseenter', () => tooltip.classList.add('show'));
      el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    });
  });
}

// ===== Section Management =====
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
  });
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.style.display = 'block';
  }
}

// ===== Window Management =====
function trackWindow(windowId, element) {
  const isTracked = element.classList.contains('active');

  if (isTracked) {
    element.classList.remove('active');
    storage.set(`window-${windowId}-tracked`, false);
    showToast('Window tracking disabled', 'info');
  } else {
    element.classList.add('active');
    storage.set(`window-${windowId}-tracked`, true);
    showToast('Window tracking enabled', 'success');
  }
}

// ===== Form Utilities =====
function serializeForm(formElement) {
  const data = {};
  const inputs = formElement.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    if (input.name) {
      if (input.type === 'checkbox') {
        data[input.name] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          data[input.name] = input.value;
        }
      } else {
        data[input.name] = input.value;
      }
    }
  });

  return data;
}

// ===== List Management =====
function filterList(searchTerm, listSelector, itemSelector = '.list-item') {
  const list = document.querySelector(listSelector);
  if (!list) return;

  const items = list.querySelectorAll(itemSelector);
  const term = searchTerm.toLowerCase();

  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(term) ? '' : 'none';
  });
}

// ===== Sorting =====
function sortList(listSelector, sortBy = 'name', order = 'asc') {
  const list = document.querySelector(listSelector);
  if (!list) return;

  const items = Array.from(list.children);

  items.sort((a, b) => {
    const aValue = a.dataset[sortBy] || a.textContent;
    const bValue = b.dataset[sortBy] || b.textContent;

    if (order === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  items.forEach(item => list.appendChild(item));
}

// ===== Progress Utilities =====
function updateProgress(progressElement, value, max = 100) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  progressElement.style.width = `${percentage}%`;

  const label = progressElement.parentElement.querySelector('.progress-label');
  if (label) {
    label.textContent = `${Math.round(percentage)}%`;
  }
}

// ===== Export for use =====
window.Tanaka = {
  // Toggle functions
  toggleClass,
  toggleElement,
  toggleActive,
  toggleTheme,

  // Navigation
  initTabNavigation,
  showSection,

  // Forms
  validateForm,
  clearForm,
  makeEditable,
  serializeForm,

  // Animations
  animateElement,
  slideIn,
  slideOut,

  // Storage
  storage,

  // Events
  debounce,
  onClickOutside,
  onEscapeKey,

  // Selection
  SelectionManager,

  // Notifications
  showToast,
  showOverlay,

  // Utilities
  timeAgo,
  copyToClipboard,
  generateId,
  filterList,
  sortList,
  updateProgress,

  // Search
  initSearchInput,

  // Window management
  trackWindow,

  // Init
  ready,
  initTanaka
};
