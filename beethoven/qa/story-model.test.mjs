import assert from "node:assert/strict";
import { chapters, sources } from "../story.mjs";

assert.equal(chapters.length, 9, "There must be nine chapters");
assert.equal(new Set(chapters.map(({ id }) => id)).size, 9, "Chapter IDs must be unique");
assert.deepEqual(chapters.map(({ id }) => id), Array.from({ length: 9 }, (_, i) => `s${String(i + 1).padStart(2, "0")}`));
assert.deepEqual(chapters.filter(({ track }) => track).map(({ track }) => track), ["moonlight-1.mp3", "moonlight-2.mp3", "moonlight-3.mp3"]);
assert.equal(new Set(sources.map(({ url }) => url)).size, sources.length, "Source URLs must be unique");
console.log("Beethoven story model: all assertions passed");
