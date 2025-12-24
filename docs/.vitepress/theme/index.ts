import DefaultTheme from "vitepress/theme";
import Home from "./Home.vue";
import "./custom.css";

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component("Home", Home);
  },
};
