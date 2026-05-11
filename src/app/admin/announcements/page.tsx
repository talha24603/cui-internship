"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/student/StudentUi";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { authFetch, authJson } from "@/utils/authClient";
import type { AdminPagination } from "@/utils/adminPagination";
import { AdminPaginationBar } from "@/components/admin/AdminPaginationBar";

type Announcement = {
  id: string;
  title?: string | null;
  message: string;
  link?: string | null;
  pinned: boolean;
};

const PAGE_SIZE = 10;

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const res = await authJson<{ data: Announcement[]; pagination?: AdminPagination }>(
      `/api/admin/announcements?page=${page}&pageSize=${PAGE_SIZE}`,
    );
    setItems(res.data ?? []);
    setPagination(res.pagination ?? null);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load announcements"));
  }, [page]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPublishing(true);
    try {
      await authJson<{ message: string }>("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ title, message, link, pinned }),
      });
      setTitle("");
      setMessage("");
      setLink("");
      setPinned(false);
      if (page !== 1) {
        setPage(1);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish announcement");
    } finally {
      setPublishing(false);
    }
  }

  async function remove(id: string) {
    setError("");
    setDeletingId(id);
    try {
      const res = await authFetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete announcement");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminShell title="Announcements" description="Publish system-wide notifications for all users.">
      <Card>
        <form onSubmit={publish} className="space-y-3">
          <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Message" required value={message} onChange={(e) => setMessage(e.target.value)} />
          <Input placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin announcement
          </label>
          <Button type="submit" loading={publishing} loadingText="Publishing…">
            Publish
          </Button>
        </form>
      </Card>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <AdminPaginationBar pagination={pagination} onPageChange={setPage} className="mt-4" />

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title || "Announcement"}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{item.message}</p>
            {item.link ? (
              <a className="text-xs text-[#2541b2] hover:underline" href={item.link} target="_blank" rel="noreferrer">
                {item.link}
              </a>
            ) : null}
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => remove(item.id)}
                loading={deletingId === item.id}
                loadingText="Deleting…"
                disabled={deletingId !== null}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {items.length === 0 ? <p className="text-sm text-slate-600">No announcements found.</p> : null}
      </div>
    </AdminShell>
  );
}
