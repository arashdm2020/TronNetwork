import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#080b12", panel: "#111722", line: "#263243", mint: "#6ee7b7", cyan: "#67e8f9" }, boxShadow: { glow: "0 0 40px rgba(103,232,249,.1)" } } },
  plugins: []
};
export default config;
