import { Component, createRef } from 'react';
import { focusVisibleContent, isVisibleFocusTarget } from '../utils/webFocus';

export class NavigationFocusBoundary extends Component {
  container = createRef();

  getSnapshotBeforeUpdate(previous) {
    const root = this.container.current;
    if (previous.routeKey === this.props.routeKey || !root?.contains(document.activeElement)) return false;
    // Runs BEFORE React writes aria-hidden to the outgoing navigation screen.
    // Move focus to the stable container, which is outside that screen.
    if (!isVisibleFocusTarget(root)) return false;
    root.focus({ preventScroll: true });
    return true;
  }

  componentDidUpdate(_previous, _state, movedFocus) {
    if (movedFocus) focusVisibleContent(this.container.current);
  }

  render() {
    return <div ref={this.container} data-navigation-focus="true" tabIndex={-1}
      onFocusCapture={(event) => {
        // A removed modal must never restore focus into an inactive screen.
        if (!isVisibleFocusTarget(event.target)) focusVisibleContent();
      }}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {this.props.children}
    </div>;
  }
}

export default function navigationFocusLayout({ children, state }) {
  return <NavigationFocusBoundary routeKey={state.routes[state.index].key}>{children}</NavigationFocusBoundary>;
}
