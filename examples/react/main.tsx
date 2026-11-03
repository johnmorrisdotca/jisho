import { createRoot } from "react-dom/client";
import { Lookup } from "./WordList";

createRoot(document.getElementById("root")!).render(<Lookup text="かみ" />);
