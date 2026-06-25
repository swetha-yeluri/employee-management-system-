import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// PostCSS is configured inline here (instead of a separate postcss.config.js)
// so newer Node versions don't choke on loading the standalone config file.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  server: { port: 5173 },
});
