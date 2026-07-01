"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getApiBaseUrl } from "@/utils/apiBase";
import Button from "@/components/Button";
import TemplateForm from "@/components/admin/TemplateForm";
import TestSendPanel from "@/components/admin/TestSendPanel";
import TemplateImage from "@/components/admin/TemplateImage";
import {
  useAdminTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useUpdateTemplate,
} from "@/hooks/useAdminTemplates";

function AdminContent() {
  const router = useRouter();
  const { user, loading, refetch, logout } = useUser();
  const [access, setAccess] = useState("checking");
  const [profile, setProfile] = useState(null);

  const isAdmin = profile?.role === "admin";
  const { data: templates = [], isLoading } = useAdminTemplates(isAdmin);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    (async () => {
      if (!user) {
        router.replace(`/login?returnTo=${encodeURIComponent("/admin")}`);
        return;
      }

      const latest = user.role === "admin" ? user : await refetch();
      if (cancelled) return;

      if (!latest) {
        router.replace(`/login?returnTo=${encodeURIComponent("/admin")}`);
        return;
      }

      setProfile(latest);
      setAccess(latest.role === "admin" ? "allowed" : "denied");
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading, router, refetch]);

  const handleGoogleLogin = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new URLSearchParams({ timezone, returnTo: "/admin" });
    window.location.href = `${getApiBaseUrl()}/auth/google/login?${params}`;
  };

  if (loading || access === "checking") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
        Checking access...
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-red-400 font-medium mb-2">Admin access required</p>
          <p className="text-gray-400 text-sm mb-6">
            Signed in as <span className="text-white">{profile?.email}</span>. This account does not
            have the admin role.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Sign in with Google (admin account)
            </Button>
            <Button
              onClick={async () => {
                await logout();
                router.push(`/login?returnTo=${encodeURIComponent("/admin")}`);
              }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg"
            >
              Log out and try another account
            </Button>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
              Back to app
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-400">Admin</p>
            <h1 className="text-xl font-semibold">Notification templates</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              Back to app
            </Link>
            <Button
              onClick={() => {
                setCreating(true);
                setEditing(null);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              New template
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <TestSendPanel templates={templates} />

        {(creating || editing) && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium mb-4">
              {editing ? `Edit: ${editing.name}` : "Create template"}
            </h2>
            <TemplateForm
              initial={editing}
              saving={createTemplate.isPending || updateTemplate.isPending}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
              onSubmit={async (payload) => {
                if (editing) {
                  await updateTemplate.mutateAsync({ id: editing.id, payload });
                } else {
                  await createTemplate.mutateAsync(payload);
                }
                setCreating(false);
                setEditing(null);
              }}
            />
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Templates</h2>
          {isLoading ? (
            <p className="text-gray-400">Loading templates...</p>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-gray-400">
              <p>No templates yet. Create one to use for scheduled nudges.</p>
              <p className="text-sm mt-2 text-gray-500">
                When no template exists for a type, hardcoded copy is used as fallback.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row gap-4"
                >
                  <div className="shrink-0 flex items-start">
                    {template.image_url ? (
                      <TemplateImage
                        src={template.image_url}
                        alt={template.name}
                        maxHeightClass="max-h-24"
                      />
                    ) : (
                      <span className="text-xs text-gray-500 px-2 py-1">No image</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{template.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {template.type}
                      </span>
                      {!template.active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                          inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 font-medium">{template.title}</p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{template.body}</p>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => {
                        setEditing(template);
                        setCreating(false);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!confirm(`Delete "${template.name}"?`)) return;
                        try {
                          await deleteTemplate.mutateAsync(template.id);
                          if (editing?.id === template.id) setEditing(null);
                        } catch (err) {
                          alert(err?.response?.data?.message || "Failed to delete");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
