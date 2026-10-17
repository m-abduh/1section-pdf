"use client";

import { useState } from "react";
import type { Niche } from "@/lib/types";
import {
  useAdminNiches,
  useCreateNiche,
  useDeleteNiche,
  useUpdateNiche,
  type NicheInput,
} from "@/hooks/use-admin-niches";
import { getApiErrorMessage } from "@/lib/api";
import { NicheForm } from "@/components/admin/niche-form";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function AdminNichesPage() {
  const niches = useAdminNiches();
  const createNiche = useCreateNiche();
  const updateNiche = useUpdateNiche();
  const deleteNiche = useDeleteNiche();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Niche | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (niche: Niche) => {
    setEditing(niche);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (input: NicheInput) => {
    setError(null);
    try {
      if (editing) {
        await updateNiche.mutateAsync({ id: editing.id, input });
      } else {
        await createNiche.mutateAsync(input);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  };

  const handleDelete = async (niche: Niche) => {
    if (!window.confirm(`Delete niche "${niche.name}" and all its products?`)) {
      return;
    }
    await deleteNiche.mutateAsync(niche.id);
  };

  const isSaving = createNiche.isPending || updateNiche.isPending;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="cinema-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="cinema-spotlight pointer-events-none absolute inset-0" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Catalog
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg">Niches</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Each niche powers a subdomain landing page.
            </p>
          </div>
          <Button onClick={openCreate}>+ New niche</Button>
        </div>
      </div>

      {niches.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading niches...
        </div>
      ) : null}

      {niches.data && niches.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-2xl">
            ◆
          </span>
          <p className="mt-4 text-sm font-medium text-fg">No niches yet</p>
          <p className="mt-1 text-xs text-fg-muted">
            Create your first niche to start building your catalog.
          </p>
          <Button className="mt-5" onClick={openCreate}>
            + New niche
          </Button>
        </div>
      ) : null}

      {niches.data && niches.data.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Niche</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Products</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {niches.data.map((niche) => (
                <tr key={niche.id} className="transition hover:bg-surface-muted/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-9 place-items-center rounded-xl text-sm font-bold text-white shadow-sm"
                        style={{ backgroundColor: niche.accentColor }}
                      >
                        {niche.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-fg">{niche.name}</p>
                        {niche.tagline ? (
                          <p className="truncate text-xs text-fg-muted">{niche.tagline}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-surface-muted px-2 py-0.5 font-mono text-xs text-fg-muted">
                      {niche.slug}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-fg-muted">
                    <span className="font-medium text-fg">{niche._count?.products ?? 0}</span>{" "}
                    bundles
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        niche.active
                          ? "bg-fg text-surface"
                          : "bg-surface-muted text-fg-muted ring-1 ring-inset ring-border"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          niche.active ? "bg-surface" : "bg-fg-muted"
                        }`}
                      />
                      {niche.active ? "active" : "hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(niche)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(niche)}
                        disabled={deleteNiche.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        title={editing ? `Edit ${editing.name}` : "New niche"}
        onClose={() => setModalOpen(false)}
      >
        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <NicheForm
          niche={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          isSubmitting={isSaving}
        />
      </Modal>
    </div>
  );
}
