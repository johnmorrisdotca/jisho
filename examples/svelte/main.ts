import { mount } from "svelte";
import WordList from "./WordList.svelte";

mount(WordList, { target: document.getElementById("app")!, props: { text: "かみ" } });
