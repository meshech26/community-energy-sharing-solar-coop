import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ResultsDonutChart from '../../components/community/ResultsDonutChart';
import AccessibleModal from '../../components/AccessibleModal.web';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { NavigationFocusBoundary } from '../../navigation/NavigationFocusLayout.web';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let container;
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  // jsdom has no top layer. Keep these stubs narrowly scoped to focus lifecycle;
  // real-browser Tab containment/inertness is provided by HTMLDialogElement.
  HTMLDialogElement.prototype.showModal = jest.fn(function () { this.setAttribute('open', ''); });
  HTMLDialogElement.prototype.close = jest.fn(function () { this.removeAttribute('open'); });
});
afterEach(async () => {
  await act(async () => root.unmount());
  document.body.replaceChildren(); jest.restoreAllMocks();
});

test('real web SVG has valid transform and decorative DOM attributes with a named chart', async () => {
  const errors = jest.spyOn(console, 'error');
  await act(async () => root.render(<ResultsDonutChart yesVotes={5} noVotes={2} abstainVotes={1} totalVotes={8} />));
  const svg = container.querySelector('svg');
  expect(svg.getAttribute('aria-hidden')).toBe('true');
  expect(svg.getAttribute('tabindex')).toBe('-1');
  expect(svg.hasAttribute('accessible')).toBe(false);
  expect(svg.querySelector('g').getAttribute('transform')).toBe('rotate(-90 94 94)');
  expect(svg.querySelector('g').hasAttribute('transform-origin')).toBe(false);
  expect(container.querySelector('[role="img"]').getAttribute('aria-label')).toBe('8 total votes: 5 yes, 2 no, 1 abstain');
  expect(errors.mock.calls).toEqual([]);
});

test('navigation moves focus before aria-hidden is applied and then focuses the new heading', async () => {
  const failures = [];
  const original = Element.prototype.setAttribute;
  jest.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (name, value) {
    if (name === 'aria-hidden' && String(value) === 'true' && this.contains(document.activeElement)) failures.push(this);
    return original.call(this, name, value);
  });
  const screens = (route) => <NavigationFocusBoundary routeKey={route}>
    <section aria-hidden={route !== 'list'}><h1>Proposals</h1><button>View proposal</button></section>
    <section aria-hidden={route !== 'details'}><h1>Proposal Details</h1><button>Back</button></section>
  </NavigationFocusBoundary>;
  await act(async () => root.render(screens('list')));
  container.querySelector('button').focus();
  await act(async () => root.render(screens('details')));
  expect(failures).toEqual([]);
  expect(document.activeElement.textContent).toBe('Proposal Details');
  expect(document.activeElement.closest('[aria-hidden="true"]')).toBeNull();
  container.querySelectorAll('button')[1].focus();
  await act(async () => root.render(screens('list')));
  expect(failures).toEqual([]);
  expect(document.activeElement.textContent).toBe('Proposals');
});

test('dialog focuses its heading and restores the visible opener after closing', async () => {
  const opener = document.createElement('button'); document.body.appendChild(opener); opener.focus();
  await act(async () => root.render(<AccessibleModal visible accessibilityLabel="Publish proposal?"><h2>Publish proposal?</h2><button>Keep Editing</button><button>Publish</button></AccessibleModal>));
  expect(document.activeElement.textContent).toBe('Publish proposal?');
  expect(document.querySelector('dialog').getAttribute('aria-label')).toBe('Publish proposal?');
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
  await act(async () => root.render(<AccessibleModal visible={false} />));
  expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(opener);
});

test.each(['hidden', 'removed'])('dialog does not restore a %s opener after navigation', async (state) => {
  const screen = document.createElement('section'); const opener = document.createElement('button');
  screen.appendChild(opener); document.body.appendChild(screen); opener.focus();
  const next = document.createElement('h1'); next.textContent = 'Proposal Details'; document.body.appendChild(next);
  await act(async () => root.render(<AccessibleModal visible accessibilityLabel="Publish"><h2>Publish</h2><button>Confirm</button></AccessibleModal>));
  if (state === 'hidden') screen.setAttribute('aria-hidden', 'true'); else screen.remove();
  await act(async () => root.render(<AccessibleModal visible={false} />));
  expect(document.activeElement).toBe(next);
  expect(document.activeElement.closest('[aria-hidden="true"]')).toBeNull();
});

test('Escape requests dismissal but does not bypass a busy dialog', async () => {
  const cancel = jest.fn();
  await act(async () => root.render(<AccessibleModal visible accessibilityLabel="Calendar" onRequestClose={cancel}><h2>Voting starts</h2><button>Cancel</button></AccessibleModal>));
  const event = new Event('cancel', { bubbles: false, cancelable: true });
  await act(async () => document.querySelector('dialog').dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true); expect(cancel).toHaveBeenCalledTimes(1);
  await act(async () => root.render(<AccessibleModal visible accessibilityLabel="Calendar"><h2>Saving</h2></AccessibleModal>));
  const busyEvent = new Event('cancel', { cancelable: true });
  await act(async () => document.querySelector('dialog').dispatchEvent(busyEvent));
  expect(busyEvent.defaultPrevented).toBe(true);
  expect(HTMLDialogElement.prototype.close).not.toHaveBeenCalled();
});

test('Tab and Shift+Tab wrap inside the modal rather than entering background content', async () => {
  await act(async () => root.render(<AccessibleModal visible accessibilityLabel="Confirm"><h2>Confirm</h2><button>Cancel</button><button>Confirm</button></AccessibleModal>));
  const buttons = document.querySelectorAll('dialog button');
  buttons[1].focus();
  const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  await act(async () => buttons[1].dispatchEvent(tab));
  expect(tab.defaultPrevented).toBe(true); expect(document.activeElement).toBe(buttons[0]);
  const back = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
  await act(async () => buttons[0].dispatchEvent(back));
  expect(back.defaultPrevented).toBe(true); expect(document.activeElement).toBe(buttons[1]);
});

test('real confirmation backdrop is not a keyboard stop and actions remain reachable', async () => {
  await act(async () => root.render(<ConfirmationDialog visible title="Publish proposal?" onCancel={jest.fn()} onConfirm={jest.fn()}>Review before publishing.</ConfirmationDialog>));
  const stops = [...document.querySelectorAll('dialog button, dialog [tabindex]')].filter((element) => element.tabIndex >= 0);
  expect(stops.map((element) => element.textContent)).toEqual(['Cancel', 'Confirm']);
});
