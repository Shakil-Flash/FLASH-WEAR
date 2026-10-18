"use client";

import { useState } from "react";
import { CustomerAddress } from "@/lib/types";
import { MapPin, Plus, Trash2 } from "lucide-react";

interface Props {
  initialAddresses: CustomerAddress[];
}

export function AddressesClient({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    division: "Dhaka",
    district: "Dhaka",
    address_line: "",
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "usr-demo", ...formData }),
      });
      const data = await res.json();
      if (res.ok && data.address) {
        setAddresses([data.address, ...addresses]);
        setShowAddForm(false);
        setFormData({
          label: "Home",
          full_name: "",
          phone: "",
          division: "Dhaka",
          district: "Dhaka",
          address_line: "",
          is_default: false,
        });
      }
    } catch (err) {
      console.error("Save address error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this address?")) return;
    try {
      await fetch(`/api/account/addresses/${id}?userId=usr-demo`, { method: "DELETE" });
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete address error:", err);
    }
  };

  return (
    <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#E7E3DC]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Delivery Address Book</h2>
          <p className="text-xs text-[#74716D] mt-0.5">Manage saved shipping addresses for express checkout</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? "Cancel" : "Add New Address"}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-[#F7F5F0] border border-[#E7E3DC] rounded-xl p-5 mb-6 space-y-4">
          <h3 className="text-xs font-bold uppercase text-[#FF5938] tracking-wider mb-2">New Address Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#74716D] mb-1">Address Label</label>
              <input
                type="text"
                required
                placeholder="e.g. Home, Office, Studio"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full bg-white border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#74716D] mb-1">Recipient Name</label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-white border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#74716D] mb-1">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="01712345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#74716D] mb-1">Division</label>
              <select
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="w-full bg-white border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15"
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Khulna">Khulna</option>
                <option value="Barishal">Barishal</option>
                <option value="Rangpur">Rangpur</option>
                <option value="Mymensingh">Mymensingh</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#74716D] mb-1">District</label>
              <input
                type="text"
                required
                placeholder="District (e.g. Dhaka, Gazipur, Narayanganj)"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-white border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#74716D] mb-1">Street Address</label>
              <textarea
                rows={2}
                required
                placeholder="House, Road, Area details"
                value={formData.address_line}
                onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                className="w-full bg-white border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#181818]">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="accent-[#FF5938]"
              />
              <span>Set as default shipping address</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 text-[#74716D]">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#181818]" />
          <p className="text-sm font-medium text-[#181818]">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-4 rounded-xl border bg-white relative flex flex-col justify-between transition-all ${
                addr.is_default ? "border-[#FF5938] bg-[#FFF5F3]/30" : "border-[#E7E3DC]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#181818] bg-[#F7F5F0] border border-[#E7E3DC] px-2 py-0.5 rounded">
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="text-[10px] text-white bg-[#FF5938] font-semibold px-2 py-0.5 uppercase rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#181818] space-y-1 leading-relaxed">
                  <p className="font-semibold text-sm">{addr.full_name}</p>
                  <p>{addr.address_line}</p>
                  <p>{addr.district}, {addr.division}</p>
                  <p className="text-[#74716D]">Phone: {addr.phone}</p>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-[#E7E3DC] flex justify-end">
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs text-[#74716D] hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
