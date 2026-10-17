import React, { useState } from "react";
import { Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { Row } from "../../components/common/Row.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles } from "../../theme/styles.js";
import { faLongDate, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";

/* ---------------------------------------------------------
   Recurring Manager
--------------------------------------------------------- */
export function RecurringManager({ recurring, setRecurring, categories, accounts }) {
  const st = useStyles();
  const emptyForm = {
    type: "expense",
    amount: "",
    categoryId: "",
    accountId: accounts[0]?.id || "",
    interval: "monthly",
    startDate: todayISO(),
    note: ""
  };
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  function resetForm() {
    setForm({ ...emptyForm, accountId: accounts[0]?.id || "" });
  }

  function add() {
    if (!form.amount || Number(form.amount) <= 0 || !form.categoryId || !form.accountId) return;
    setRecurring((p) => [
      ...p,
      {
        id: uid(),
        ...form,
        amount: Number(form.amount),
        nextDate: form.startDate,
        active: true,
        createdAt: new Date().toISOString()
      }
    ]);
    resetForm();
  }

  function startEdit(r) {
    setEditingId(r.id);
    setExpandedId(r.id);
    setEditForm({
      type: r.type || "expense",
      amount: String(r.amount ?? ""),
      categoryId: r.categoryId || "",
      accountId: r.accountId || accounts[0]?.id || "",
      interval: r.interval || "monthly",
      startDate: r.startDate || r.nextDate || todayISO(),
      note: r.note || ""
    });
  }

  function saveEdit() {
    if (!editingId || !editForm.amount || Number(editForm.amount) <= 0 || !editForm.categoryId || !editForm.accountId) return;
    setRecurring((p) => p.map((r) => {
      if (r.id !== editingId) return r;
      return {
        ...r,
        ...editForm,
        amount: Number(editForm.amount),
        startDate: editForm.startDate,
        nextDate: r.nextDate || editForm.startDate
      };
    }));
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function remove(id) {
    if (expandedId === id) setExpandedId(null);
    if (editingId === id) setEditingId(null);
    setRecurring((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>افزودن تراکنش تکرارشونده (مثل حقوق یا اجاره)</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setForm({ ...form, type: "expense", categoryId: "" })} style={pillStyle(form.type === "expense")}>هزینه</button>
          <button onClick={() => setForm({ ...form, type: "income", categoryId: "" })} style={pillStyle(form.type === "income")}>درآمد</button>
        </div>
        <AmountInput placeholder="مبلغ" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} style={st.input} />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={st.input}>
          <option value="">دسته را انتخاب کنید</option>
          {categories.filter((c) => c.kind === form.type).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={st.input}>
          <option value="">حساب را انتخاب کنید</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setForm({ ...form, interval: "monthly" })} style={pillStyle(form.interval === "monthly")}>ماهانه</button>
          <button onClick={() => setForm({ ...form, interval: "weekly" })} style={pillStyle(form.interval === "weekly")}>هفتگی</button>
        </div>
        <label style={st.label}>تاریخ شروع</label>
        <JalaliDateInput value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} style={st.input} />
        <input placeholder="یادداشت (اختیاری)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={st.input} />
        <button onClick={add} style={st.primaryBtn}>افزودن</button>
      </div>

      <div style={{ ...st.card, padding: "4px 12px" }}>
        {recurring.length === 0 && <EmptyRow text="موردی ثبت نشده" />}
        {recurring.map((r) => {
          const category = categories.find((c) => c.id === r.categoryId);
          const account = accounts.find((a) => a.id === r.accountId);
          const isExpanded = expandedId === r.id;
          const isEditing = editingId === r.id;
          return (
            <React.Fragment key={r.id}>
              <Row
                title={category?.name || "—"}
                subtitle={`${r.interval === "monthly" ? "ماهانه" : "هفتگی"} · تراکنش بعدی: ${faLongDate(new Date(r.nextDate || r.startDate))}`}
                value={`${toFaInt(r.amount)} ریال`}
                extra={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecurring((p) => p.map((x) => x.id === r.id ? { ...x, active: !x.active } : x));
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: r.active ? BRAND.green : "#aaa", fontSize: 11, fontWeight: 700 }}
                  >
                    {r.active ? "فعال" : "غیرفعال"}
                  </button>
                }
                leftIcon={<Trash2 size={15} />}
                leftColor={BRAND.crimson}
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                chevron={null}
              />

              {isExpanded && (
                <div style={{ padding: "4px 8px 14px", borderBottom: "1px solid #eee" }}>
                  {isEditing ? (
                    <div style={{ ...st.card, margin: 0, padding: 12, background: "#fafafa" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>ویرایش تراکنش تکرارشونده</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <button onClick={() => setEditForm({ ...editForm, type: "expense", categoryId: "" })} style={pillStyle(editForm.type === "expense")}>هزینه</button>
                        <button onClick={() => setEditForm({ ...editForm, type: "income", categoryId: "" })} style={pillStyle(editForm.type === "income")}>درآمد</button>
                      </div>
                      <AmountInput placeholder="مبلغ" value={editForm.amount} onChange={(v) => setEditForm({ ...editForm, amount: v })} style={st.input} />
                      <select value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })} style={st.input}>
                        <option value="">دسته را انتخاب کنید</option>
                        {categories.filter((c) => c.kind === editForm.type).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <select value={editForm.accountId} onChange={(e) => setEditForm({ ...editForm, accountId: e.target.value })} style={st.input}>
                        <option value="">حساب را انتخاب کنید</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <button onClick={() => setEditForm({ ...editForm, interval: "monthly" })} style={pillStyle(editForm.interval === "monthly")}>ماهانه</button>
                        <button onClick={() => setEditForm({ ...editForm, interval: "weekly" })} style={pillStyle(editForm.interval === "weekly")}>هفتگی</button>
                      </div>
                      <JalaliDateInput value={editForm.startDate} onChange={(v) => setEditForm({ ...editForm, startDate: v })} style={st.input} />
                      <input placeholder="یادداشت (اختیاری)" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} style={st.input} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveEdit} style={st.primaryBtn}>ذخیره تغییرات</button>
                        <button onClick={cancelEdit} style={{ ...st.secondaryBtn, flex: 1 }}>انصراف</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5 }}>
                        <div><b>نوع:</b> {r.type === "income" ? "درآمد" : "هزینه"}</div>
                        <div><b>مبلغ:</b> {toFaInt(r.amount)} ریال</div>
                        <div><b>دسته:</b> {category?.name || "—"}</div>
                        <div><b>حساب:</b> {account?.name || "—"}</div>
                        <div><b>دوره:</b> {r.interval === "monthly" ? "ماهانه" : "هفتگی"}</div>
                        <div><b>وضعیت:</b> {r.active ? "فعال" : "غیرفعال"}</div>
                        <div><b>تاریخ شروع:</b> {r.startDate ? faLongDate(new Date(r.startDate)) : "—"}</div>
                        <div><b>تراکنش بعدی:</b> {r.nextDate ? faLongDate(new Date(r.nextDate)) : "—"}</div>
                      </div>
                      {r.note && <div style={{ marginTop: 8, fontSize: 12.5 }}><b>یادداشت:</b> {r.note}</div>}
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => startEdit(r)} style={st.secondaryBtn}>ویرایش</button>
                        <button onClick={() => remove(r.id)} style={{ ...st.secondaryBtn, color: BRAND.crimson }}>حذف</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
