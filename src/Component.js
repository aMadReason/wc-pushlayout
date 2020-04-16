/* global ShadyCSS */

/*
Be sure to set the parent styles:
overflow: hidden;
height: 100vh;
*/

const css = `
  :host {
    display: flex;
    height: 100%;
    width: 100%;
    align-items: stretch;
    overflow: hidden;
  }

  :host > * {
    position: relative;
    overflow-y: auto;
  }

  :host > div > div {
    height: 100%;
    min-height: auto;
  }

  :host [data-menu-panel] {
    background: var(--wc-bg-2, #ffffff);
  }

  :host([data-transition="true"]) [data-menu-panel],
  :host([data-transition="true"]) [data-content-panel] {
    transition: flex-basis var(--wc-transition, 0.5s ease), 
      width var(--wc-transition, 0.5s ease),
      box-shadow var(--wc-transition, 0.5s ease);
  }

  ::slotted([slot="content"]),
  ::slotted([slot="menu"]) { 
    min-height: auto;
    height: 100%;
  }

  /* Left & Right */
  :host([data-position="right"]) {
    flex-flow: row nowrap;
  }
  :host([data-position="left"]) {
    flex-flow: row-reverse nowrap;
  }
  :host([data-position="right"]) .inner,
  :host([data-position="left"]) .inner {
    min-width: var(--wc-pushdrawer-minwidth, 200px);
    height: 100%;
  }
  :host([data-position="right"]) [data-content-panel],
  :host([data-position="left"]) [data-content-panel] {
    flex: 2 0;
  }
  :host([data-position="right"]) [data-menu-panel],
  :host([data-position="left"]) [data-menu-panel] {
    width: 0;
  }
  :host([data-open="true"][data-position="right"]) [data-menu-panel],
  :host([data-open="true"][data-position="left"]) [data-menu-panel] {
    width: var(--wc-pushdrawer-maxwidth, 100%);
  }


  /* Top & Bottom */
  :host([data-position="bottom"]) {
    flex-flow: column nowrap;
  }
  :host([data-position="top"]) {
    flex-flow: column-reverse nowrap;
  }
  :host([data-position="bottom"]) .inner,
  :host([data-position="top"]) .inner {
    min-height: var(--wc-pushdrawer-minheight, 200px);
    height: 100%;
    position: relative;
  }
  :host([data-position="bottom"]) [data-content-panel],
  :host([data-position="top"]) [data-content-panel] {
    flex: 2 1 100%;
  }
  :host([data-position="bottom"]) [data-menu-panel],
  :host([data-position="top"]) [data-menu-panel] {
    width: 100%;
    flex: 2 1 0;
  }
  :host([data-open="true"][data-position="bottom"]) [data-menu-panel],
  :host([data-open="true"][data-position="top"]) [data-menu-panel] {
    flex-basis: var(--wc-pushdrawer-maxheight, 100%);
  }
  :host([data-open="true"][data-position="bottom"]) [data-content-panel],
  :host([data-open="true"][data-position="top"]) [data-content-panel] {
    flex-basis: calc(100% - var(--wc-pushdrawer-maxheight, 100%));
  }


  /* Other stuff */
  :host button.close {
    border: 0;
    font-size: 1rem;
    font-weight: bold;
    min-height: 30px;
    min-width: 30px;
    margin: 3px;
    color: var(--wc-txt-2, #333);
    border-radius: 100%;
    border: 2px solid transparent;
    transition: border 0.3s ease, background 0.5s ease;
    background: transparent;
  }
  :host([data-open]) button.close:hover {
    cursor: pointer;
    background: var(--wc-bg-2, #ddd);
  }
  :host([data-open]) button.close:focus {
    cursor: pointer;
    border: 2px solid var(--wc-txt-2, #333);
  }

  .topper {
    display: flex;
    justify-content: space-between;
  }

`;

const markup = values => `
  <style>${values.css}</style>
  <div data-content-panel>
    <div>
      <div class="inner">
        <slot name="content"></slot>  
      </div>
    </div>
  </div>

  <div data-menu-panel role="menu">
    <div>
      <div class="inner">
        <div class="topper">
          <div class="title">
            <slot name="menu-title"></slot> 
          </div>
          <button class="close" aria-label="close">
            ×
          </button>
        </div>
        <slot name="menu"></slot>  
      </div>
    </div>
  </div>
`;

class Component extends HTMLElement {
  constructor() {
    super(); // !required!
    this._hasShadow = true; // true or fals to disable or enable shadow dom
    this.dom = this._hasShadow ? this.attachShadow({ mode: "open" }) : this;

    // setup your template
    const template = document.createElement("template");

    // we're using innerHTML but you could manually create each element and add to this._elements for complex use-cases
    template.innerHTML = markup({ css });

    /* Style Polyfill Step 1 */
    if (window.ShadyCSS) ShadyCSS.prepareTemplate(template, Component.tag); // eslint-disable-line
    /* END Style Polyfill Step 1 */

    this.instance = document.importNode(template.content, true); // copy template contents into 'this'

    /* Style Polyfill Step 2 */
    if (window.ShadyCSS) ShadyCSS.styleElement(this); // eslint-disable-line
    /* END Style Polyfill Step 2 */

    this.dom.appendChild(this.instance);

    this._setElements();
    return this;
  }

  static get observedAttributes() {
    return ["data-open", "data-position"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return false; // if value hadn't changed do nothing
    if (name === "data-title") this.titleEl.innerHTML = newValue;
    //if (name === "data-position") this.resetHeight();
    this._dispatch("attribute-change");
    return this;
  }

  connectedCallback() {
    this.closeEl.addEventListener("click", () => this.close());
    this.dom.addEventListener("keydown", e => this._handleKeys(e));
    this.menuEl.addEventListener("transitionend", e => {
      if (e.propertyName === "width") this._dispatch("toggle-panel");
    });
    this.resetHeight();
  }

  disconnectedCallback() {
    this.closeEl.removeEventListener("click", () => this.close());
    this.dom.removeEventListener("keydown", e => this._handleKeys(e));
    this.menuEl.removeEventListener("transitionend", e => {
      if (e.propertyName === "width") this._dispatch("toggle-panel");
    });
  }

  _setElements() {
    this.closeEl = this.dom.querySelector("button.close");
    this.titleEl = this.dom.querySelector("div.title");
    this.menuEl = this.dom.querySelector("[data-menu-panel]");
    this.overlayEl = this.dom.querySelector("div.overlay");
    const focusables = this.querySelectorAll(
      "a, input, button, textarea, [tabindex='0'], [contenteditable='true']"
    );
    this.elements = [this.closeEl, ...[].slice.call(focusables)];
  }

  _dispatch(type = "dispatch") {
    const attributes = { type };
    [].slice.call(this.attributes).map(a => (attributes[a.name] = a.value));
    const event = new CustomEvent("tea-event", {
      detail: { ...attributes }
    });
    this.dispatchEvent(event);
  }

  _handleTrapFocus(e) {
    const target = e.target;
    const last = this.elements[this.elements.length - 1];
    const first = this.elements[0];
    const isLast = target === last && !e.shiftKey;
    const isFirst = target === first && e.shiftKey;

    if (isFirst || isLast) e.preventDefault();
    if (isLast) first.focus();
    if (isFirst) last.focus();
  }

  _handleKeys(e) {
    if (e.key.includes("Esc")) return this.close();
    // if (e.key === "Tab") return this._handleTrapFocus(e);
  }

  getDimensions() {
    const content = this.dom.querySelector("[data-content-panel] .inner");
    const menu = this.dom.querySelector("[data-menu-panel] .inner");
    return {
      hostHeight: this.getBoundingClientRect().height,
      contentHeight: content.getBoundingClientRect().height,
      menuHeight: menu.getBoundingClientRect().height,
      hostWidth: this.getBoundingClientRect().width,
      contentWidth: content.getBoundingClientRect().width,
      menuWidth: menu.getBoundingClientRect().width
    };
  }

  resetHeight() {
    // height must be defined for top/bottom transition
    if (this.getAttribute("data-transition") === "true") {
      this.style.height = `${this.getBoundingClientRect().height}px`;
    }
  }

  open(triggerEl = null) {
    if (triggerEl) this.triggerEl = triggerEl;
    this.resetHeight();
    this.setAttribute("data-open", "true");
    this.elements.map(i => i.setAttribute("tabindex", 0));
    this.closeEl.focus();
  }

  close() {
    if (this.triggerEl) {
      this.triggerEl.focus();
      this.triggerEl = null;
    }
    this.setAttribute("data-open", "false");
  }

  toggle(triggerEl = null) {
    const toOpen = this.getAttribute("data-open") !== "true";
    if (toOpen) return this.open(triggerEl);
    if (!toOpen) return this.close();
  }
}

const tag = "wc-pushdrawer";
if (window.customElements.get(tag) === undefined) {
  window.customElements.define(tag, Component);
}

// magic that registers the tag
export default Component;
