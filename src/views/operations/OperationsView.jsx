import {
  Bell, BellRing, Bitcoin, CalendarDays, DollarSign, FileSpreadsheet, Landmark, Landmark as Bank, Plus,
  Receipt, Repeat, Save, ShieldCheck, Tag, Target, Type, Users,
} from "lucide-react";

import { Row } from "../../components/common/Row.jsx";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";

/* ---------------------------------------------------------
   Operations View
--------------------------------------------------------- */
export function OperationsView({ setSubView, onAdd }) {
  const st = useStyles();
  const items = [
    { title: "اهداف مالی و پس‌انداز", icon: <Target size={17} />, color: BRAND.green, key: "goals" },
    { title: "واحدهای پولی", icon: <DollarSign size={17} />, color: BRAND.gold, key: "currencies" },
    { title: "ماشین حساب", icon: <Type size={17} />, color: BRAND.teal, key: "calculator" },
    { title: "پشتیبانی و تیکت", icon: <Bell size={17} />, color: BRAND.header, key: "support" },
    { title: "حساب‌ها و کارت‌ها", icon: <Landmark size={17} />, color: BRAND.violet, key: "accounts" },
    { title: "دسته‌بندی‌ها و برچسب‌ها", icon: <Tag size={17} />, color: BRAND.mauve, key: "categories" },
    { title: "بودجه‌بندی", icon: <Save size={17} />, color: BRAND.green, key: "budgets" },
    { title: "تراکنش‌های تکرارشونده", icon: <Repeat size={17} />, color: BRAND.teal, key: "recurring" },
    { title: "چک‌ها", icon: <FileSpreadsheet size={17} />, color: BRAND.gold, key: "checks" },
    { title: "وام و اقساط", icon: <Bank size={17} />, color: BRAND.crimson, key: "loans" },
    { title: "یادآوری قبض‌ها", icon: <BellRing size={17} />, color: BRAND.orange, key: "bills" },
    { title: "دارایی‌ها (ارز دیجیتال / بورس)", icon: <Bitcoin size={17} />, color: "#7a5cff", key: "assets" },
    { title: "اعضای منزل، رویداد و پروژه", icon: <Users size={17} />, color: BRAND.violet, key: "tags" },
    { title: "دوره مالی", icon: <CalendarDays size={17} />, color: BRAND.darkgreen, key: "periods" },
    { title: "اسکن برگه پوز (دوربین)", icon: <Receipt size={17} />, color: BRAND.fab, key: "slip" },
    { title: "پیامک بانکی (افزودن نیمه‌خودکار)", icon: <BellRing size={17} />, color: "#666", key: "sms" },
    { title: "تقویم شمسی", icon: <CalendarDays size={17} />, color: BRAND.header, key: "calendar" },
    { title: "اطلاعات کاربری", icon: <Users size={17} />, color: "#444", key: "profile" },
    { title: "تنظیمات و پشتیبان‌گیری", icon: <ShieldCheck size={17} />, color: "#555", key: "settings" },
  ];
  return (
    <div style={{ padding: "10px 16px" }}>
      <div style={{ ...st.card, padding: "4px 12px" }}>
        {items.map((it) => <Row key={it.key} title={it.title} leftIcon={it.icon} leftColor={it.color} onClick={() => setSubView(it.key)} />)}
        <Row title="ثبت تراکنش جدید" leftIcon={<Plus size={17} />} leftColor={BRAND.fab} onClick={onAdd} />
      </div>
    </div>
  );
}
