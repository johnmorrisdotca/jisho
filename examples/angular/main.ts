import "@angular/compiler";
import { provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { WordListComponent } from "./word-list.component";

void bootstrapApplication(WordListComponent, { providers: [provideZonelessChangeDetection()] });
