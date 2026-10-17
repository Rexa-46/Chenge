import { useState } from "react";
import { Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { Row } from "../../components/common/Row.jsx";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles } from "../../theme/styles.js";
import { uid } from "../../utils/id.js";

/* ---------------------------------------------------------
   Members / Events / Projects Manager (تگ‌گذاری اعضای خانواده، رویداد و پروژه)
--------------------------------------------------------- */
export function MembersEventsProjectsManager({ members, setMembers, events, setEvents, projects, setProjects }) {
  const st = useStyles();
  const [tab, setTab] = useState("members");
  const [name, setName] = useState("");
  const map = {
    members: { list: members, setList: setMembers, label: "عضو خانواده", color: BRAND.violet },
    events: { list: events, setList: setEvents, label: "رویداد", color: BRAND.teal },
    projects: { list: projects, setList: setProjects, label: "پروژه", color: BRAND.gold },
  };
  const cur = map[tab];
  function add() {
    if (!name.trim()) return;
    cur.setList((p) => [...p, { id: uid(), name: name.trim() }]);
    setName("");
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("members")} style={pillStyle(tab === "members")}>اعضای خانواده</button>
        <button onClick={() => setTab("events")} style={pillStyle(tab === "events")}>رویدادها</button>
        <button onClick={() => setTab("projects")} style={pillStyle(tab === "projects")}>پروژه‌ها</button>
      </div>
      <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>افزودن {cur.label}</div>
        <input placeholder={`نام ${cur.label}`} value={name} onChange={(e) => setName(e.target.value)} style={st.input} />
        <button onClick={add} style={st.primaryBtn}>افزودن</button>
      </div>
      <div style={{ ...st.card, padding: "4px 12px" }}>
        {cur.list.length === 0 && <EmptyRow text={`${cur.label}ی ثبت نشده`} />}
        {cur.list.map((m) => (
          <Row key={m.id} title={m.name} leftIcon={<Trash2 size={15} />} leftColor={BRAND.crimson}
            onClick={() => cur.setList((p) => p.filter((x) => x.id !== m.id))} chevron={null} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#8a8194", marginTop: 12 }}>
        این موارد را می‌توانید هنگام ثبت تراکنش (بخش «بیشتر») به هر پرداخت یا دریافت نسبت دهید تا در گزارش‌ها به‌تفکیک عضو، رویداد یا پروژه ببینید.
      </div>
    </div>
  );
}
