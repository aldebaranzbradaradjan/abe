import Editor from "./routes/Editor/Editor.svelte";
import Dashboard from "./routes/Dashboard.svelte";

const routes = {
  "/": Dashboard,
  "/editor/:id?": Editor,
};

export default routes;
