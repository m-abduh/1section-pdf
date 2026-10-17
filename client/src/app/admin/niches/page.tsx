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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Niches</h1>
          <p className="text-sm text-fg-muted">
            Each niche powers a subdomain landing page.
          </p>
        </div>
        <Button onClick={openCreate}>New niche</Button>
      </div>

      {niches.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading niches...
        </div>
      ) : null}

      {niches.data && niches.data.length === 0 ? (
        <p className="rounded-2xl bg-card p-8 text-center text-sm text-fg-muted ring-1 ring-border">
          No niches yet. Create your first one.
        </p>
      ) : null}

      {niches.data && niches.data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Niche</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Products</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {niches.data.map((niche) => (
                <tr key={niche.id} className="hover:bg-surface-muted">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg border border-border bg-surface-muted text-sm font-semibold text-fg">
                        {niche.name.charAt(0)}
                      </span>
                      <span className="font-medium text-fg">{niche.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-fg-muted">{niche.slug}</td>
                  <td className="px-5 py-3 text-fg-muted">
                    {niche._count?.products ?? 0}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        niche.active
                          ? "bg-accent text-accent-fg"
                          : "bg-surface-muted text-fg-muted"
                      }`}
                    >
                      {niche.active ? "active" : "hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
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
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
