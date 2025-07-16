export function ThemeScript() {
  const codeToRunOnClient = `
    (function() {
      function getTheme() {
        const theme = localStorage.getItem('theme');
        if (theme === 'light' || theme === 'dark') return theme;
        if (theme === 'system' || !theme) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
      }
      
      const theme = getTheme();
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: codeToRunOnClient }} />;
}