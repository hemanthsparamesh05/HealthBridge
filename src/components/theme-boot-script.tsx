/** Runs before React paint to avoid dark-mode flash from persisted zustand state. */
export function ThemeBootScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(()=>{try{var r=localStorage.getItem("hb-theme");if(!r)return;var p=JSON.parse(r);if(p&&p.state&&p.state.dark===true)document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");}catch(e){}})();`,
      }}
    />
  );
}
