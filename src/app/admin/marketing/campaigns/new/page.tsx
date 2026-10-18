"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Mail, CheckCircle2, AlertCircle, Eye } from "lucide-react";

const DEFAULT_TEMPLATE = `<div style="text-align: center; margin-bottom: 24px;">
  <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #ccff00; background: #1c1917; padding: 4px 10px; border-radius: 4px;">LIMITED RELEASE DROP</span>
  <h1 style="font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 16px 0 8px 0; color: #ffffff;">OVERSIZED STREETWEAR HOODIES</h1>
  <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 auto; max-width: 480px;">
    Crafted from 450 GSM ultra-heavyweight combed cotton with custom dropped shoulders. Available now in Midnight Black, Cyber Lime, and Concrete Grey.
  </p>
</div>

<div style="background: #18181b; border: 1px solid #27272a; padding: 20px; border-radius: 6px; text-align: center; margin: 24px 0;">
  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #a1a1aa; margin: 0 0 6px 0;">SUBSCRIBER EXCLUSIVE OFFER</p>
  <p style="font-size: 20px; font-weight: 900; color: #ccff00; margin: 0 0 4px 0;">USE CODE: DROP10</p>
  <p style="font-size: 12px; color: #71717a; margin: 0;">Get 10% off your entire order above ৳1,500.</p>
</div>

<div style="text-align: center; margin: 32px 0;">
  <a href="https://flashwear.store/shop" style="background: #ccff00; color: #000000; padding: 14px 32px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; display: inline-block;">Shop The New Drop &rarr;</a>
</div>`;

export default function NewCampaignPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Autumn Heavyweight Drop #3");
  const [subject, setSubject] = useState("NEW DROP: 450 GSM Oversized Streetwear Hoodies + 10% Off");
  const [previewText, setPreviewText] = useState("Exclusive subscriber access to our latest drop");
  const [targetSegment, setTargetSegment] = useState("all_subscribers");
  const [contentHtml, setContentHtml] = useState(DEFAULT_TEMPLATE);

  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setTestFeedback({ success: false, msg: "Enter a valid test email address" });
      return;
    }
    setSendingTest(true);
    setTestFeedback(null);

    try {
      // Create temporary or draft campaign first
      const draftRes = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          previewText,
          contentHtml,
          targetSegment,
        }),
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok || !draftData.campaign?.id) {
        throw new Error(draftData.error || "Failed to save draft for test");
      }

      // Send test email
      const testRes = await fetch(`/api/admin/marketing/campaigns/${draftData.campaign.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });

      const testData = await testRes.json();
      if (testRes.ok && testData.success) {
        setTestFeedback({ success: true, msg: `Test preview email successfully dispatched to ${testEmail}!` });
      } else {
        setTestFeedback({ success: false, msg: testData.error || "Test dispatch failed" });
      }
    } catch (err: any) {
      setTestFeedback({ success: false, msg: err.message || "Failed to send test email" });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          previewText,
          contentHtml,
          targetSegment,
        }),
      });

      if (res.ok) {
        router.push("/admin/marketing/campaigns");
      } else {
        const data = await res.json();
        setStatusMessage({ success: false, msg: data.error || "Failed to save campaign" });
      }
    } catch (err: any) {
      setStatusMessage({ success: false, msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchNow = async () => {
    if (!confirm("Are you sure you want to broadcast this campaign to all active consented subscribers now?")) {
      return;
    }

    setDispatching(true);
    setStatusMessage(null);

    try {
      // 1. Create campaign
      const createRes = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          previewText,
          contentHtml,
          targetSegment,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.campaign?.id) {
        throw new Error(createData.error || "Failed to save campaign");
      }

      // 2. Dispatch
      const dispatchRes = await fetch(`/api/admin/marketing/campaigns/${createData.campaign.id}/dispatch`, {
        method: "POST",
      });

      const dispatchData = await dispatchRes.json();
      if (dispatchRes.ok && dispatchData.success) {
        setStatusMessage({
          success: true,
          msg: `Broadcast completed! Sent: ${dispatchData.sentCount}, Failed: ${dispatchData.failedCount}`,
        });
        setTimeout(() => router.push("/admin/marketing/campaigns"), 2000);
      } else {
        setStatusMessage({ success: false, msg: dispatchData.error || "Dispatch failed" });
      }
    } catch (err: any) {
      setStatusMessage({ success: false, msg: err.message });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/marketing/campaigns"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white uppercase font-bold tracking-wider mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campaigns</span>
        </Link>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Create Marketing Campaign</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Compose HTML promotional emails with product spotlights, discount codes, and test previews.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 text-xs flex items-center gap-2 ${
            statusMessage.success
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {statusMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Editor Form */}
        <div className="bg-[#121214] border border-zinc-800 p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white pb-3 border-b border-zinc-800">
            Campaign Setup
          </h2>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Internal Campaign Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Subject Line</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Preview Text (Inbox Snippet)</label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Target Audience</label>
            <select
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            >
              <option value="all_subscribers">All Consented Subscribers</option>
              <option value="purchasers">Verified Past Customers</option>
              <option value="loyalty_members">Flash Club Loyalty Members</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono uppercase text-zinc-400">Email HTML Content</label>
              <button
                type="button"
                onClick={() => setContentHtml(DEFAULT_TEMPLATE)}
                className="text-[11px] text-[#ccff00] hover:underline"
              >
                Reset to Default Drop Template
              </button>
            </div>
            <textarea
              rows={12}
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 p-3 font-mono text-[11px] text-zinc-200 focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          {/* Test Dispatch Box */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">Send Test Preview</span>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sendingTest}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {sendingTest ? "Sending..." : "Send Test"}
              </button>
            </div>
            {testFeedback && (
              <p
                className={`text-[11px] ${
                  testFeedback.success ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {testFeedback.msg}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={handleDispatchNow}
              disabled={dispatching}
              className="px-6 py-2.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{dispatching ? "Broadcasting..." : "Dispatch Now"}</span>
            </button>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="bg-[#121214] border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Live Email Preview</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Responsive Container</span>
          </div>

          {/* Email Canvas Preview */}
          <div className="bg-[#0c0c0e] border border-zinc-800 p-6 rounded-md">
            <div className="border-b border-zinc-800 pb-3 mb-4 text-xs text-zinc-400">
              <p><strong>From:</strong> FLASHWEAR &lt;orders@flashwear.store&gt;</p>
              <p><strong>Subject:</strong> {subject || "(No subject)"}</p>
              {previewText && <p><strong>Snippet:</strong> {previewText}</p>}
            </div>

            <div className="text-center mb-6">
              <span className="text-2xl font-black tracking-widest text-[#ccff00]">FLASHWEAR</span>
            </div>

            <div
              className="email-content-preview text-zinc-200"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center text-[10px] text-zinc-500">
              <p>FLASHWEAR Bangladesh • Dhaka 1205</p>
              <p className="mt-1 text-zinc-400 underline cursor-pointer">Unsubscribe from marketing emails</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
