"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DIETARY_TAGS,
  formatPrice,
  MENU_CATEGORIES,
  type MenuItem,
  type SpiceLevel,
} from "@/lib/menu";
import SignOutButton from "./SignOutButton";

type StoredItem = MenuItem & { id: string };

type Props = {
  initialItems: StoredItem[];
};

type Draft = {
  name: string;
  nameZh: string;
  price: string;
  category: string;
  description: string;
  descriptionZh: string;
  spiceLevel: SpiceLevel;
  tags: string[];
  image: string;
};

function emptyDraft(): Draft {
  return {
    name: "",
    nameZh: "",
    price: "0",
    category: MENU_CATEGORIES[0],
    description: "",
    descriptionZh: "",
    spiceLevel: 0,
    tags: [],
    image: "",
  };
}

function draftFromItem(item: StoredItem): Draft {
  return {
    name: item.name,
    nameZh: item.nameZh ?? "",
    price: String(item.price),
    category: item.category,
    description: item.description,
    descriptionZh: item.descriptionZh ?? "",
    spiceLevel: item.spiceLevel,
    tags: item.tags,
    image: item.image,
  };
}

export default function MenuAdmin({ initialItems }: Props) {
  const [items, setItems] = useState<StoredItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, StoredItem[]>();
    for (const cat of MENU_CATEGORIES) map.set(cat, []);
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  function openNew() {
    setEditingId("new");
    setDraft(emptyDraft());
    setError(null);
  }

  function openEdit(item: StoredItem) {
    setEditingId(item.id);
    setDraft(draftFromItem(item));
    setError(null);
  }

  function closeEditor() {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
  }

  function toggleTag(tag: string) {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag)
        ? d.tags.filter((t) => t !== tag)
        : [...d.tags, tag],
    }));
  }

  async function save() {
    setError(null);
    const price = Number(draft.price);
    if (!draft.name.trim()) return setError("Name is required.");
    if (!draft.description.trim()) return setError("Description is required.");
    if (!Number.isFinite(price) || price < 0)
      return setError("Price must be a non-negative number.");

    const payload = {
      name: draft.name,
      nameZh: draft.nameZh || undefined,
      description: draft.description,
      descriptionZh: draft.descriptionZh || undefined,
      price,
      category: draft.category,
      spiceLevel: draft.spiceLevel,
      tags: draft.tags,
      image: draft.image,
    };

    setSubmitting(true);
    try {
      if (editingId === "new") {
        const res = await fetch("/api/menu/items", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? "Save failed.");
          return;
        }
        const { item } = (await res.json()) as { item: StoredItem };
        setItems((prev) => [...prev, item]);
        closeEditor();
      } else if (editingId) {
        const res = await fetch(
          `/api/menu/items/${encodeURIComponent(editingId)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? "Save failed.");
          return;
        }
        const { item } = (await res.json()) as { item: StoredItem };
        setItems((prev) => prev.map((p) => (p.id === item.id ? item : p)));
        closeEditor();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/menu/items/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Delete failed.");
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-neutral-200 bg-cream/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="font-serif text-2xl text-neutral-900 sm:text-3xl">
              Menu editor
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Edits go live for customers immediately. The chatbot also uses
              this menu.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/kitchen"
              className="text-xs text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
            >
              Kitchen
            </Link>
            <Link
              href="/admin/qr"
              className="text-xs text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
            >
              QR codes
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={openNew}
            className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-cream hover:bg-neutral-800"
          >
            + Add new item
          </button>
        </div>

        {MENU_CATEGORIES.map((cat) => {
          const list = grouped.get(cat) ?? [];
          if (list.length === 0) return null;
          return (
            <section key={cat} className="mb-6">
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                {cat}
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatPrice(item.price)}
                        {item.spiceLevel > 0 && ` · spice ${item.spiceLevel}`}
                      </p>
                      {item.tags.length > 0 && (
                        <p className="mt-1 truncate text-[11px] text-neutral-500">
                          {item.tags.join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-none gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const next = item.available === false ? true : false;
                          const res = await fetch(`/api/menu/items/${encodeURIComponent(item.id)}`, {
                            method: "PATCH",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ available: next }),
                          });
                          if (res.ok) {
                            const { item: updated } = (await res.json()) as { item: StoredItem };
                            setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                          }
                        }}
                        className={[
                          "rounded-full border px-3 py-1 text-xs",
                          item.available === false
                            ? "border-neutral-400 bg-neutral-100 text-neutral-600 hover:bg-white"
                            : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100",
                        ].join(" ")}
                      >
                        {item.available === false ? "86'd" : "In stock"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>

      {editingId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6"
          onClick={closeEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit menu item"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-cream p-6 shadow-xl"
          >
            <h2 className="font-serif text-xl text-neutral-900">
              {editingId === "new" ? "New item" : "Edit item"}
            </h2>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Name (English)
                  </span>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Name (中文, optional)
                  </span>
                  <input
                    type="text"
                    value={draft.nameZh}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, nameZh: e.target.value }))
                    }
                    className="mt-1 w-full rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Description (English)
                </span>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Description (中文, optional)
                </span>
                <textarea
                  rows={3}
                  value={draft.descriptionZh}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, descriptionZh: e.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Price ($)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={draft.price}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, price: e.target.value }))
                    }
                    className="mt-1 w-full rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm tabular-nums focus:border-neutral-900 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Category
                  </span>
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, category: e.target.value }))
                    }
                    className="mt-1 w-full rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                  >
                    {MENU_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Spice (0–3)
                  </span>
                  <select
                    value={draft.spiceLevel}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        spiceLevel: Number(e.target.value) as SpiceLevel,
                      }))
                    }
                    className="mt-1 w-full rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                  >
                    <option value={0}>0 — not spicy</option>
                    <option value={1}>1 — mildly spicy</option>
                    <option value={2}>2 — spicy</option>
                    <option value={3}>3 — very spicy</option>
                  </select>
                </label>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Dietary tags
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIETARY_TAGS.map((tag) => {
                    const on = draft.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={[
                          "rounded-full px-3 py-1 text-xs",
                          on
                            ? "bg-neutral-900 text-cream"
                            : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100",
                        ].join(" ")}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Image URL
                </span>
                <input
                  type="text"
                  value={draft.image}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, image: e.target.value }))
                  }
                  placeholder="/menu/yourdish.jpg or https://..."
                  className="mt-1 w-full rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-neutral-500">
                  Leave blank to use a placeholder; paste a URL to use an
                  external image.
                </span>
              </label>

              {error && (
                <p className="text-xs text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={submitting}
                  className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-cream hover:bg-neutral-800 disabled:opacity-60"
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-cream p-5 shadow-xl"
          >
            <h2 className="font-serif text-lg text-neutral-900">
              Delete this item?
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Customers won't see it anymore. This can't be undone from here —
              you'd need to re-add it.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => remove(confirmDeleteId)}
                disabled={submitting}
                className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
              >
                {submitting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
