import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useGame } from "@/lib/game-store";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  AlertCircle,
  Box,
  Upload,
  Copy,
  Check,
  Sparkles,
  X,
  FileUp,
  Info,
} from "lucide-react";
import type { WordEntry } from "@/data/categories";

export const Route = createFileRoute("/word-box")({
  component: WordBoxComponent,
});

const AI_PROMPT_TEMPLATE = `Generate the json format of the following words which has a main word and its clue seperated by commas, the first word will be the game word and rest of the words behind it will be the clue or hint words for impostors, the clue words can be upto 3 optional.

Format requirements:
- "word": The main game word (the first word in each line)
- "clues": Array of 2 to 3 clue/hint words that follow it
- Output ONLY valid raw JSON array of objects (no markdown wrapping, no intro, no outro).

Example Output Format:
[
  {
    "word": "Maharaja",
    "clues": ["trashcan", "barber", "shoes"]
  },
  {
    "word": "7 aam arivu",
    "clues": ["monkey", "phone parts"]
  },
  {
    "word": "Dragon",
    "clues": ["exam", "break up"]
  }
]

Words to convert:
[PASTE YOUR WORDS HERE, FOR EXAMPLE:]
Maharaja, trashcan, barber, shoes`;

// Tolerant JSON Parser supporting various AI formats, wrappers, and keys
function parseWordsJson(input: string): { words: WordEntry[]; error?: string } {
  if (!input || !input.trim()) {
    return { words: [], error: "Input is empty" };
  }

  let text = input.trim();

  // Strip markdown code fences if user copied ```json ... ```
  if (text.startsWith("```")) {
    text = text
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  }

  // Attempt standard JSON parse, with auto-fix for trailing commas
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err: unknown) {
    try {
      const sanitized = text
        .replace(/,\s*([}\]])/g, "$1") // strip trailing commas
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // quote bare keys
      parsed = JSON.parse(sanitized);
    } catch {
      const msg = err instanceof Error ? err.message : "Syntax error";
      return { words: [], error: `Invalid JSON syntax: ${msg}` };
    }
  }

  // Extract raw array from root array or wrapped object ({ words: [] }, { movies: [] }, etc.)
  let rawList: unknown[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.words)) {
      rawList = record.words;
    } else if (Array.isArray(record.movies)) {
      rawList = record.movies;
    } else if (Array.isArray(record.data)) {
      rawList = record.data;
    } else if (Array.isArray(record.items)) {
      rawList = record.items;
    } else {
      const firstArrayProp = Object.values(record).find((v) => Array.isArray(v));
      if (firstArrayProp && Array.isArray(firstArrayProp)) {
        rawList = firstArrayProp;
      } else {
        return {
          words: [],
          error: "JSON must be an array of objects or contain a words/movies array property.",
        };
      }
    }
  } else {
    return { words: [], error: "JSON must be an array or object." };
  }

  if (rawList.length === 0) {
    return { words: [], error: "No items found in the array." };
  }

  const resultWords: WordEntry[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== "object") continue;

    const record = item as Record<string, unknown>;

    // Support word / movie / title / name / film / movie_name
    const wordVal = (
      record.word ||
      record.movie ||
      record.title ||
      record.name ||
      record.film ||
      record.movie_name ||
      ""
    )
      .toString()
      .trim();

    if (!wordVal) {
      errors.push(`Item #${i + 1} is missing a word/movie title.`);
      continue;
    }

    // Support clues array or hints array or tags or hint1, hint2, hint3
    let cluesVal: string[] = [];
    if (Array.isArray(record.clues)) {
      cluesVal = record.clues.map((c) => String(c).trim()).filter(Boolean);
    } else if (Array.isArray(record.hints)) {
      cluesVal = record.hints.map((c) => String(c).trim()).filter(Boolean);
    } else if (Array.isArray(record.tags)) {
      cluesVal = record.tags.map((c) => String(c).trim()).filter(Boolean);
    } else {
      const h1 = String(record.hint1 || record.clue1 || "").trim();
      const h2 = String(record.hint2 || record.clue2 || "").trim();
      const h3 = String(record.hint3 || record.clue3 || "").trim();
      cluesVal = [h1, h2, h3].filter(Boolean);
    }

    if (cluesVal.length < 2) {
      errors.push(
        `"${wordVal}" has only ${cluesVal.length} clue(s). Each item needs at least 2 clues/hints.`,
      );
      continue;
    }

    resultWords.push({
      word: wordVal,
      clues: cluesVal,
    });
  }

  if (resultWords.length === 0) {
    return {
      words: [],
      error: errors[0] || "No valid words with at least 2 clues found in the JSON.",
    };
  }

  return { words: resultWords };
}

function WordBoxComponent() {
  const g = useGame();
  const navigate = useNavigate();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Temporary local state for editing a category's words
  const [editingWords, setEditingWords] = useState<WordEntry[]>([]);
  const [selectedRowIndexes, setSelectedRowIndexes] = useState<number[]>([]);

  // Bulk import modal state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = g.customCategories.find((c) => c.id === selectedCatId);

  // Parse status for the import modal in real time
  const parseStatus = useMemo(() => {
    if (!importJsonText.trim()) return null;
    return parseWordsJson(importJsonText);
  }, [importJsonText]);

  // Transition to edit a specific category
  const handleSelectCategory = (catId: string) => {
    const cat = g.customCategories.find((c) => c.id === catId);
    if (cat) {
      setSelectedCatId(catId);
      // Create a deep copy of words so editing doesn't affect main state immediately
      setEditingWords(
        cat.words.map((w) => ({
          word: w.word,
          clues: [...w.clues],
        })),
      );
      setSelectedRowIndexes([]);
    }
  };

  // Add a new row to the table
  const handleAddRow = () => {
    setEditingWords((prev) => [...prev, { word: "", clues: ["", "", ""] }]);
  };

  // Update a specific cell in the table
  const handleCellChange = (
    rowIndex: number,
    field: "word" | "clue1" | "clue2" | "clue3",
    value: string,
  ) => {
    setEditingWords((prev) =>
      prev.map((row, idx) => {
        if (idx !== rowIndex) return row;
        const newClues = [...row.clues];
        if (field === "word") {
          return { ...row, word: value };
        } else if (field === "clue1") {
          newClues[0] = value;
        } else if (field === "clue2") {
          newClues[1] = value;
        } else if (field === "clue3") {
          newClues[2] = value;
        }
        return { ...row, clues: newClues };
      }),
    );
  };

  // Toggle row selection for deletion
  const handleToggleSelectRow = (rowIndex: number) => {
    setSelectedRowIndexes((prev) =>
      prev.includes(rowIndex) ? prev.filter((i) => i !== rowIndex) : [...prev, rowIndex],
    );
  };

  // Toggle select all rows
  const handleToggleSelectAll = () => {
    if (selectedRowIndexes.length === editingWords.length) {
      setSelectedRowIndexes([]);
    } else {
      setSelectedRowIndexes(editingWords.map((_, idx) => idx));
    }
  };

  // Delete selected rows
  const handleDeleteSelected = () => {
    if (selectedRowIndexes.length === 0) return;
    setEditingWords((prev) => prev.filter((_, idx) => !selectedRowIndexes.includes(idx)));
    setSelectedRowIndexes([]);
    toast.success("Selected words removed from list");
  };

  // Delete a single row
  const handleDeleteSingle = (rowIndex: number) => {
    setEditingWords((prev) => prev.filter((_, idx) => idx !== rowIndex));
    setSelectedRowIndexes((prev) =>
      prev.filter((i) => i !== rowIndex).map((i) => (i > rowIndex ? i - 1 : i)),
    );
    toast.success("Word removed");
  };

  // Reset current category to default words
  const handleResetToDefaults = () => {
    if (
      confirm(
        "Are you sure you want to reset ALL categories and words to their original default lists?",
      )
    ) {
      g.resetCustomCategories();
      setSelectedCatId(null);
      toast.success("All categories restored to factory defaults");
    }
  };

  // Save changes
  const handleSaveChanges = () => {
    if (!selectedCatId || !selectedCategory) return;

    // Filter out completely empty rows
    const cleanedWords = editingWords.filter(
      (row) => row.word.trim() || row.clues.some((c) => c && c.trim()),
    );

    // Form Validation: Check if there are incomplete rows
    const invalidRows = cleanedWords.filter(
      (row) => !row.word.trim() || !row.clues[0]?.trim() || !row.clues[1]?.trim(),
    );

    if (invalidRows.length > 0) {
      toast.error("All active words must have at least a word and 2 clues (Hint 1 & Hint 2).");
      return;
    }

    if (cleanedWords.length === 0) {
      toast.error("Category must have at least one word.");
      return;
    }

    // Map and save
    const finalWords: WordEntry[] = cleanedWords.map((row) => {
      // Clean empty clues (e.g. Hint 3 if it was not entered or is empty)
      const clues = row.clues.map((c) => c.trim()).filter(Boolean);
      return {
        word: row.word.trim(),
        clues,
      };
    });

    const updatedCategories = g.customCategories.map((cat) => {
      if (cat.id === selectedCatId) {
        return { ...cat, words: finalWords };
      }
      return cat;
    });

    g.setCustomCategories(updatedCategories);
    toast.success(`Successfully saved words for ${selectedCategory.name}!`);
    setSelectedCatId(null);
  };

  // Copy helper
  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success(`${label} copied to clipboard!`);
      return true;
    } catch {
      toast.error("Failed to copy to clipboard.");
      return false;
    }
  };

  const handleCopyPrompt = async () => {
    const ok = await copyToClipboard(AI_PROMPT_TEMPLATE, "AI Prompt Template");
    if (ok) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };

  // Handle file upload (.json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
        toast.success(`Loaded "${file.name}"!`);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
    // Reset file input value so re-selecting same file triggers onChange
    e.target.value = "";
  };

  // Execute bulk import
  const handleExecuteImport = () => {
    if (!parseStatus || !parseStatus.words || parseStatus.words.length === 0) {
      toast.error("Please enter valid JSON with at least one word.");
      return;
    }

    const imported = parseStatus.words.map((w) => ({
      word: w.word,
      clues: [w.clues[0] || "", w.clues[1] || "", w.clues[2] || ""],
    }));

    if (importMode === "append") {
      setEditingWords((prev) => [...prev, ...imported]);
      toast.success(`Added ${imported.length} words to list! Click 'Save Changes' to update game.`);
    } else {
      setEditingWords(imported);
      toast.success(
        `Replaced category with ${imported.length} imported words! Click 'Save Changes' to update game.`,
      );
    }

    setShowImportModal(false);
    setImportJsonText("");
  };

  return (
    <div className="min-h-dvh bg-background pb-12 animate-in fade-in duration-200">
      <div className="mx-auto max-w-4xl px-4 pt-4">
        {/* Navigation/Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            {selectedCatId ? (
              <button
                onClick={() => setSelectedCatId(null)}
                className="rounded-full p-2 hover:bg-secondary transition active:scale-95 text-foreground/80 cursor-pointer"
                aria-label="Back to categories"
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
              </button>
            ) : (
              <Link
                to="/"
                className="rounded-full p-2 hover:bg-secondary transition active:scale-95 text-foreground/80 flex items-center justify-center cursor-pointer"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
              </Link>
            )}
            <div>
              <h1 className="font-display text-2xl font-extrabold flex items-center gap-2 text-foreground">
                <Box className="h-6 w-6 text-pink" /> WORD BOX
              </h1>
              <p className="text-xs text-muted-foreground">
                Customize words and clues for your games
              </p>
            </div>
          </div>

          {!selectedCatId && (
            <button
              onClick={handleResetToDefaults}
              className="rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> RESET ALL DEFAULTS
            </button>
          )}
        </div>

        {/* STATE 1: Select Category */}
        {!selectedCatId && (
          <div className="space-y-6">
            {/* AI Generator Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-card via-card to-secondary/30 p-5 sm:p-6 card-shadow border-2 border-primary/20 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-pink/10 px-3 py-1 text-xs font-extrabold text-pink">
                    <Sparkles className="h-3.5 w-3.5" /> AI WORDLIST ASSISTANT
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
                    Bulk Generate Custom Movies & Clues
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Copy our formatted AI prompt and give it to ChatGPT, Claude, or Gemini to
                    convert your comma-separated movie words into game JSON!
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleCopyPrompt}
                    className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-3 font-display text-xs font-extrabold flex items-center justify-center gap-2 btn-3d active:scale-95 transition cursor-pointer"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="h-4 w-4" /> COPIED PROMPT!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> COPY AI PROMPT
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground/80">
                  SELECT A CATEGORY TO EDIT
                </h2>
                <span className="text-xs text-muted-foreground">
                  {g.customCategories.length} categories available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {g.customCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCategory(c.id)}
                    className="flex items-center justify-between rounded-2xl bg-card p-5 card-shadow border border-border/60 hover:border-primary/30 hover:scale-[1.01] active:scale-[0.99] transition text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl bg-secondary rounded-2xl h-14 w-14 flex items-center justify-center shrink-0">
                        {c.emoji}
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition">
                          {c.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {c.words.length} words configured
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary p-1.5 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <Plus className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: Category Words Table Editor */}
        {selectedCatId && selectedCategory && (
          <div className="space-y-4">
            {/* Editor Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl card-shadow border border-border/80">
              <div className="flex items-center gap-3">
                <span className="text-3xl bg-secondary h-12 w-12 rounded-xl flex items-center justify-center">
                  {selectedCategory.emoji}
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-foreground">
                    {selectedCategory.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {editingWords.length} words & hints in list
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAddRow}
                  className="rounded-xl bg-secondary hover:bg-secondary-foreground/10 px-3.5 py-2.5 font-display text-xs font-extrabold text-foreground flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> ADD WORD
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3.5 py-2.5 font-display text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                  title="Bulk import words from JSON or file"
                >
                  <Upload className="h-4 w-4" /> IMPORT JSON
                </button>

                <button
                  onClick={handleCopyPrompt}
                  className="rounded-xl bg-secondary hover:bg-secondary-foreground/10 px-3.5 py-2.5 font-display text-xs font-extrabold text-pink flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer border border-border/60"
                  title="Copy AI Prompt to convert words and clues"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" /> COPIED!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> COPY PROMPT
                    </>
                  )}
                </button>

                {selectedRowIndexes.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="rounded-xl bg-destructive hover:bg-destructive/95 text-destructive-foreground px-3.5 py-2.5 font-display text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" /> DELETE ({selectedRowIndexes.length})
                  </button>
                )}

                <button
                  onClick={handleSaveChanges}
                  className="rounded-xl bg-yellow hover:bg-yellow/90 px-4 py-2.5 font-display text-xs font-extrabold text-foreground flex items-center justify-center gap-1.5 btn-3d active:scale-95 transition cursor-pointer"
                >
                  <Save className="h-4 w-4" /> SAVE CHANGES
                </button>
              </div>
            </div>

            {/* Table Spreadsheet */}
            <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-secondary/60 text-muted-foreground text-xs font-extrabold uppercase tracking-wider border-b border-border">
                      <th className="py-4 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            editingWords.length > 0 &&
                            selectedRowIndexes.length === editingWords.length
                          }
                          onChange={handleToggleSelectAll}
                          className="h-4.5 w-4.5 rounded border-border cursor-pointer accent-primary"
                        />
                      </th>
                      <th className="py-4 px-4">Word / Movie</th>
                      <th className="py-4 px-4">Hint 1</th>
                      <th className="py-4 px-4">Hint 2</th>
                      <th className="py-4 px-4">Hint 3 (Optional)</th>
                      <th className="py-4 px-4 w-14 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {editingWords.map((w, idx) => {
                      const isSelected = selectedRowIndexes.includes(idx);
                      const isWordEmpty = !w.word.trim();
                      const isClue1Empty = !w.clues[0]?.trim();
                      const isClue2Empty = !w.clues[1]?.trim();
                      const hasInputs = w.word.trim() || w.clues.some((c) => c && c.trim());

                      const showValidationError =
                        hasInputs && (isWordEmpty || isClue1Empty || isClue2Empty);

                      return (
                        <tr
                          key={idx}
                          className={`transition ${
                            isSelected
                              ? "bg-primary/5"
                              : showValidationError
                                ? "bg-destructive/5"
                                : "hover:bg-secondary/20"
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(idx)}
                              className="h-4.5 w-4.5 rounded border-border cursor-pointer accent-primary"
                            />
                          </td>

                          {/* Word Input */}
                          <td className="py-3 px-4">
                            <div className="relative">
                              <input
                                value={w.word}
                                onChange={(e) => handleCellChange(idx, "word", e.target.value)}
                                placeholder="Word / Movie title"
                                className={`w-full bg-background/50 rounded-xl px-3 py-2 text-sm font-semibold outline-none border focus:border-primary focus:bg-background transition ${
                                  showValidationError && isWordEmpty
                                    ? "border-destructive focus:border-destructive ring-1 ring-destructive/20"
                                    : "border-border/80"
                                }`}
                              />
                            </div>
                          </td>

                          {/* Clue 1 Input */}
                          <td className="py-3 px-4">
                            <input
                              value={w.clues[0] || ""}
                              onChange={(e) => handleCellChange(idx, "clue1", e.target.value)}
                              placeholder="Hint 1"
                              className={`w-full bg-background/50 rounded-xl px-3 py-2 text-sm outline-none border focus:border-primary focus:bg-background transition ${
                                showValidationError && isClue1Empty
                                  ? "border-destructive focus:border-destructive ring-1 ring-destructive/20"
                                  : "border-border/80"
                              }`}
                            />
                          </td>

                          {/* Clue 2 Input */}
                          <td className="py-3 px-4">
                            <input
                              value={w.clues[1] || ""}
                              onChange={(e) => handleCellChange(idx, "clue2", e.target.value)}
                              placeholder="Hint 2"
                              className={`w-full bg-background/50 rounded-xl px-3 py-2 text-sm outline-none border focus:border-primary focus:bg-background transition ${
                                showValidationError && isClue2Empty
                                  ? "border-destructive focus:border-destructive ring-1 ring-destructive/20"
                                  : "border-border/80"
                              }`}
                            />
                          </td>

                          {/* Clue 3 Input (Optional) */}
                          <td className="py-3 px-4">
                            <input
                              value={w.clues[2] || ""}
                              onChange={(e) => handleCellChange(idx, "clue3", e.target.value)}
                              placeholder="Hint 3 (Optional)"
                              className="w-full bg-background/50 rounded-xl px-3 py-2 text-sm outline-none border border-border/80 focus:border-primary focus:bg-background transition"
                            />
                          </td>

                          {/* Action Trash Button */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteSingle(idx)}
                              className="p-2 text-muted-foreground/60 hover:text-destructive transition active:scale-90 cursor-pointer"
                              aria-label="Delete word"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {editingWords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="font-bold text-foreground">No words in this category</p>
                          <p className="text-xs mb-4">
                            Add words manually or use Bulk JSON Import to add dozens in seconds.
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleAddRow}
                              className="rounded-xl bg-secondary hover:bg-secondary/80 px-3.5 py-2 text-xs font-bold text-foreground cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5 inline mr-1" /> Add Word
                            </button>
                            <button
                              onClick={() => setShowImportModal(true)}
                              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-3.5 py-2 text-xs font-bold cursor-pointer"
                            >
                              <Upload className="h-3.5 w-3.5 inline mr-1" /> Import JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation Tips Alert */}
            <div className="rounded-2xl border-2 border-dashed border-primary/10 bg-card p-4 text-xs text-muted-foreground flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-pink mt-0.5" />
              <div>
                <p className="font-bold text-foreground/80 mb-0.5">Editing Guidelines</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Each row must have a valid Word/Movie title and at least two hints (Hint 1 &
                    Hint 2).
                  </li>
                  <li>
                    Clues/hints should be alternative tricky tags or hints that refer to the word.
                    In Imposter Who, these hints are given to imposters to help them blend in.
                  </li>
                  <li>Hint 3 is optional. If left blank, it won't be used.</li>
                  <li>
                    Click <strong>COPY PROMPT</strong> to copy the prompt for AI to format your
                    words & hints into JSON, then click <strong>IMPORT JSON</strong> to import them.
                  </li>
                  <li>
                    Click <strong>Save Changes</strong> at the top right to store the updated
                    wordlist.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* BULK JSON IMPORT MODAL                                   */}
      {/* ========================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-card rounded-3xl border-2 border-border card-shadow p-6 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Upload className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-extrabold text-foreground">
                    Bulk Import Words & Hints
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Target:{" "}
                    <strong className="text-foreground">
                      {selectedCategory?.emoji} {selectedCategory?.name}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-full p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Close import dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json,application/json"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer border border-border"
                  >
                    <FileUp className="h-3.5 w-3.5 text-pink" /> Upload .json File
                  </button>
                </div>

                {importJsonText && (
                  <button
                    onClick={() => setImportJsonText("")}
                    className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* JSON Textarea */}
              <div className="relative">
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "word": "Movie Name",\n    "clues": ["hint 1", "hint 2"]\n  }\n]`}
                  rows={10}
                  className="w-full font-mono text-xs p-4 rounded-2xl bg-background border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Live Validation & Preview Box */}
              {!importJsonText.trim() ? (
                <div className="rounded-2xl bg-secondary/50 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5 border border-border/60">
                  <Info className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                  <span>Paste JSON generated from ChatGPT/Gemini, or upload a .json file.</span>
                </div>
              ) : parseStatus?.error ? (
                <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Format Error: </span>
                    {parseStatus.error}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      ✓ Valid Format: {parseStatus?.words.length} words detected!
                    </p>
                    <p className="text-[11px] opacity-90 line-clamp-1">
                      Preview:{" "}
                      {parseStatus?.words
                        .slice(0, 4)
                        .map((w) => w.word)
                        .join(", ")}
                      {(parseStatus?.words.length ?? 0) > 4
                        ? ` and ${(parseStatus?.words.length ?? 0) - 4} more`
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Import Mode Radio Group */}
              <div className="pt-2">
                <label className="text-xs font-bold text-foreground block mb-2">
                  IMPORT DESTINATION MODE:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                      importMode === "append"
                        ? "bg-primary/5 border-primary font-bold text-foreground"
                        : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === "append"}
                      onChange={() => setImportMode("append")}
                      className="accent-primary"
                    />
                    <div className="text-xs">
                      <div>Append to existing words</div>
                      <div className="text-[10px] font-normal opacity-80">
                        Keeps current {editingWords.length} words and adds new ones
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                      importMode === "replace"
                        ? "bg-primary/5 border-primary font-bold text-foreground"
                        : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="accent-primary"
                    />
                    <div className="text-xs">
                      <div>Replace all words</div>
                      <div className="text-[10px] font-normal opacity-80">
                        Overwrites all words in this category
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={!parseStatus || !parseStatus.words || parseStatus.words.length === 0}
                className="rounded-xl bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed text-foreground px-5 py-2.5 font-display text-xs font-extrabold flex items-center gap-1.5 btn-3d active:scale-95 transition cursor-pointer"
              >
                <Upload className="h-4 w-4" /> IMPORT{" "}
                {parseStatus?.words?.length ? `(${parseStatus.words.length})` : ""} WORDS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
