import "./css/mini-reset.css";
import "./css/index.css";
import "./css/helper-classes.css";

import "./css/themes/dark.css";
import "./css/themes/light.css";

/* Theme switcher */
// (() => {
//   if (!window.matchMedia) return false;
//   const media = window.matchMedia("(prefers-color-scheme: dark)");
//   const theme = media.matches ? "dark" : "light";
//   document.body.setAttribute("data-theme", theme);
// })();

(() => {
  const selector = document.querySelector('[name="theme"]');
  if (selector) {
    selector.addEventListener("change", e => {
      document.body.setAttribute("data-theme", e.target.value);
    });
  }
  /* end theme switcher */

  const toggler = document.querySelector("#toggle");
  const pushlayout = document.querySelector("wc-pushdrawer");

  toggler.addEventListener("click", e => {
    console.log(12);
    pushlayout.toggle(toggler);
  });
})();
