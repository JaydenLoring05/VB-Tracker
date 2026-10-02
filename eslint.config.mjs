import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/sw.js"]
  },
  {
    rules: {
      // New React Compiler rules in eslint-plugin-react-hooks 7. The hooks
      // here load data with the fetch-in-useEffect pattern, which these rules
      // flag on every hook. Rewriting all of them is a separate change, so
      // they stay visible as warnings instead of failing the build.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      // Allow `_name` for parameters that are required by a signature but unused.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }
      ]
    }
  }
];

export default config;
