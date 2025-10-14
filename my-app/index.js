// index.js (в КОРНЕ проекта, рядом с package.json)
import { registerRootComponent } from "expo";
import App from "./App"; // если App лежит в корне; иначе "./src/App"

registerRootComponent(App);
