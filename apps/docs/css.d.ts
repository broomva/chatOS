// Global stylesheets are imported for their side effect. TypeScript 6 checks side-effect
// imports (noUncheckedSideEffectImports) and Next only declares *.module.css.
declare module "*.css";
