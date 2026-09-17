'use strict';

// Contact details in index.html are demonstrative. This static page does not send data to a server.
document.body.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const desktop = window.matchMedia('(min-width: 1200px)');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  navigation.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
}

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
desktop.addEventListener('change', () => setMenu(false));
document.addEventListener('keydown', event => {
  if (menuButton.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') {
    setMenu(false);
    menuButton.focus();
  }
  if (event.key === 'Tab') {
    const items = [menuButton, ...navigation.querySelectorAll('a')];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => {
    const siblings = [...element.parentElement.children].filter(child => child.classList.contains('reveal'));
    element.style.setProperty('--reveal-delay', `${(siblings.indexOf(element) % 3) * 85}ms`);
    element.classList.add('reveal-pending');
    observer.observe(element);
  });
  // Changing the OS preference must also reveal content still waiting offscreen.
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    document.querySelectorAll('.reveal-pending').forEach(element => {
      element.classList.remove('reveal-pending');
    });
  });
}

document.querySelectorAll('.comparison input').forEach(slider => {
  slider.addEventListener('input', () => slider.parentElement.style.setProperty('--position', `${slider.value}%`));
});

const questions = document.querySelectorAll('.faq-list details');
questions.forEach(question => question.addEventListener('toggle', () => {
  if (question.open) questions.forEach(other => { if (other !== question) other.open = false; });
}));

const form = document.querySelector('#booking-form');
const service = document.querySelector('#service');
document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    service.value = link.dataset.service;
    setFieldError(service, '');
    if (!errorSummary.hidden) showErrors();
  });
});

const fields = [...form.querySelectorAll('[required]')];
const errorSummary = document.querySelector('#form-errors');
const dialog = document.querySelector('#booking-dialog');
const draft = document.querySelector('#booking-draft');
const copyStatus = document.querySelector('#copy-status');

function validate(field) {
  const value = field.value.trim();
  if (field.id === 'name' && (value.length < 2 || !/\p{L}/u.test(value))) return 'Вкажіть ім’я: щонайменше 2 символи та одну літеру.';
  if (field.id === 'phone') {
    const digits = value.replace(/[\s()+-]/g, '');
    if (!/^(?:0\d{9}|380\d{9})$/.test(digits)) return 'Вкажіть український номер: +380 і 9 цифр або 0 і 9 цифр.';
  }
  if (field.id === 'service' && !value) return 'Оберіть послугу або консультацію.';
  return '';
}

function setFieldError(field, message) {
  document.querySelector(`#${field.id}-error`).textContent = message;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}

function showErrors() {
  errorSummary.replaceChildren();
  const invalid = fields.filter(field => field.getAttribute('aria-invalid') === 'true');
  errorSummary.hidden = invalid.length === 0;
  if (!invalid.length) return;
  const title = document.createElement('strong');
  title.textContent = 'Перевірте, будь ласка, дані:';
  errorSummary.append(title);
  invalid.forEach(field => {
    const link = document.createElement('a');
    link.href = `#${field.id}`;
    link.textContent = document.querySelector(`#${field.id}-error`).textContent;
    link.addEventListener('click', event => { event.preventDefault(); field.focus(); });
    errorSummary.append(link);
  });
}

fields.forEach(field => field.addEventListener('input', () => {
  if (field.getAttribute('aria-invalid') !== 'true') return;
  setFieldError(field, validate(field));
  showErrors();
}));

form.addEventListener('submit', event => {
  event.preventDefault();
  fields.forEach(field => setFieldError(field, validate(field)));
  showErrors();
  if (!errorSummary.hidden) { errorSummary.focus(); return; }
  const name = form.elements.name.value.trim();
  const phone = form.elements.phone.value.trim();
  const comment = form.elements.comment.value.trim();
  draft.value = `Вітаю! Хочу записатися до FORMA Detailing.\nІм’я: ${name}\nТелефон: ${phone}\nПослуга: ${service.value}${comment ? `\nПро авто та побажання: ${comment}` : ''}\nПідкажіть, будь ласка, вільний час і вартість.`;
  document.querySelector('#share-booking').href = `https://wa.me/?text=${encodeURIComponent(draft.value)}`;
  copyStatus.textContent = '';
  dialog.showModal();
});

document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
document.querySelector('#copy-booking').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(draft.value);
    copyStatus.textContent = 'Текст заявки скопійовано. Надішліть його контакту студії.';
  } catch {
    draft.focus();
    draft.select();
    copyStatus.textContent = 'Браузер обмежив копіювання. Текст виділено — скопіюйте його вручну.';
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
