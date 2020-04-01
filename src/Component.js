/* global ShadyCSS */
const css = `
  :host {
    display: flex;
    flex-flow: row nowrap;
    min-height: 100vh;
    max-width: 100vw
    height: 100%;
    align-items: stretch;
    overflow: hidden;
  }

  :host > * {
    max-height: 100vh;
    height: 100%;
  }

  :host([data-transitions="true"]) > * {
    transition: width 0.5s ease; /* Only needed for ie11 */
    transition: width var(--tea-transition, 0.5s ease);
  }

  :host [data-content-panel] {
    flex: 2 0;
    overflow-x: hidden;
    position: relative;
    overflow: hidden;
  }


  :host [data-menu-panel] {
    position: relative;
    width: 0;
    background: var(--tea-bg-2, #ffffff);
  }

  :host([data-transitions="true"]) [data-menu-panel] {
    transition: width var(--tea-transition, 0.5s ease),
    box-shadow var(--tea-transition, 0.5s ease);
  }

  :host > [data-content-panel] > div,
  :host > [data-menu-panel] > div {
    width: 100%;
    height: auto;
    min-height: 100%;
    overflow-x: hidden;
  }

  :host > [data-content-panel] > div {
    min-width: 300px;
  }

  :host .inner {
    min-width: 200px;
    height: 100%;
    max-height: 100vh;
    overflow-y: auto;
  }

  :host .inner > div {
    text-align: right;    
    position: sticky;
    position: -webkit-sticky;
    top: 0px;
    background: #fff;
    background: rgba(255, 255, 255, 0.89);
    background: var(--tea-bg-1, rgba(255, 255, 255, 0.89)); 
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

 :host button.close {
  border: 0;
  font-size: 1rem;
  font-weight: bold;
  min-height: 30px;
  min-width: 30px;
  margin: 3px;
  color: var(--tea-txt-2, #333);
  border-radius: 100%;
  border: 2px solid transparent;
  transition: border 0.3s ease, background 0.5s ease;
  background: transparent;
}
:host([data-open]) button.close:hover {
  cursor: pointer;
  background: var(--tea-bg-2, #ddd);
}
:host([data-open]) button.close:focus {
  cursor: pointer;
  border: 2px solid var(--tea-txt-2, #333);
}

  :host([data-open="true"]) > [data-menu-panel] {
    width: 100%; /* Only needed for ie11 */
    width: var(--tea-menu-open-width, 100%);
    border-left: var(--tea-border, 1px solid var(--tea-bg-1, grey));
    box-shadow: var(--tea-shadow, none);    
  }

  /* Medium devices (tablets, 768px and up) */
  @media screen and (min-width: 768px) and (orientation: landscape) {
    :host {
      --tea-menu-open-width: 50%;
    }

    /* Only needed for ie11 */
    :host([data-open="true"]) > [data-menu-panel] {
      width: 50%;
      width: var(--tea-menu-open-width, 50%);
    }
  }

  /* Large devices (desktops, 992px and up) */
  @media screen and (min-width: 992px) and (orientation: landscape) {
    :host {
      --tea-menu-open-width: 25%;
    }

    /* Only needed for ie11 */
    :host([data-open="true"]) > [data-menu-panel] {
      width: 25%;
      width: var(--tea-menu-open-width, 25%);
    }
  }
`;

const markup = values => `
  <style>${values.css}</style>
  <div data-content-panel>
    <div>
      <div class="inner">
        <slot name="content"></slot>  
        <slot></slot>  
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
    return ["data-open", "data-title"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(name);
    if (oldValue === newValue) return false; // if value hadn't changed do nothing
    if (name === "data-title") this.titleEl.innerHTML = newValue;
    this._dispatch("attribute-change");
    return this;
  }

  connectedCallback() {
    this.closeEl.addEventListener("click", () => this.close());
    this.dom.addEventListener("keydown", e => this._handleKeys(e));
    this.menuEl.addEventListener("transitionend", e => {
      if (e.propertyName === "width") this._dispatch("toggle-panel");
    });
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

  open(triggerEl = null) {
    if (triggerEl) this.triggerEl = triggerEl;
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

const tag = "tea-pushlayout";
if (window.customElements.get(tag) === undefined) {
  window.customElements.define(tag, Component);
}

// magic that registers the tag
export default Component;
