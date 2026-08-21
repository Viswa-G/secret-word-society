import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useGame } from "@/lib/game-store";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus, Save, RotateCcw, AlertCircle, Box } from "lucide-react";
import type { Category, WordEntry } from "@/data/categories";

export const Route = createFileRoute("/word-box")({
  component: WordBoxComponent,
});

function WordBoxComponent() {
  const g = useGame();
  const navigate = useNavigate();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Temporary local state for editing a category's words
  const [editingWords, setEditingWords] = useState<WordEntry[]>([]);
  const [selectedRowIndexes, setSelectedRowIndexes] = useState<number[]>([]);

  const selectedCategory = g.customCategories.find((c) => c.id === selectedCatId);

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
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground/80">
              SELECT A CATEGORY TO EDIT
            </h2>
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
        )}

        {/* STATE 2: Category Words Table Editor */}
        {selectedCatId && selectedCategory && (
          <div className="space-y-4">
            {/* Editor Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl card-shadow border border-border/80">
              <div className="flex items-center gap-3">
                <span className="text-3xl bg-secondary h-12 w-12 rounded-xl flex items-center justify-center">
                  {selectedCategory.emoji}
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-foreground">
                    {selectedCategory.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">Editing words & hints</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAddRow}
                  className="flex-1 sm:flex-none rounded-xl bg-secondary hover:bg-secondary-foreground/10 px-3.5 py-2.5 font-display text-xs font-extrabold text-foreground flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> ADD WORD
                </button>

                {selectedRowIndexes.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="flex-1 sm:flex-none rounded-xl bg-destructive hover:bg-destructive/95 text-destructive-foreground px-3.5 py-2.5 font-display text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" /> DELETE ({selectedRowIndexes.length})
                  </button>
                )}

                <button
                  onClick={handleSaveChanges}
                  className="flex-1 sm:flex-none rounded-xl bg-yellow hover:bg-yellow/90 px-4 py-2.5 font-display text-xs font-extrabold text-foreground flex items-center justify-center gap-1.5 btn-3d active:scale-95 transition cursor-pointer"
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
                      <th className="py-4 px-4">Word</th>
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

                      // Show validation highlights if they started typing something in the row, but didn't finish required fields
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
                                placeholder="Word name"
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
                          <p className="font-bold">No words in this category</p>
                          <p className="text-xs">
                            Click "Add Word" to enter custom words and clues.
                          </p>
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
                    Each row must have a valid Word name and at least two hints (Hint 1 & Hint 2).
                  </li>
                  <li>
                    Clues/hints should be alternative tricky tags or hints that refer to the word.
                    In Imposter Who, these hints are given to imposters to help them blend in.
                  </li>
                  <li>Hint 3 is optional. If left blank, it won't be used.</li>
                  <li>
                    Click <strong>Save Changes</strong> at the top right to load the modified
                    wordlist into the game.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
