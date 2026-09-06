import { NotFoundScreen } from "@/components/brand/NotFoundScreen";

export default function RootNotFound() {
  return (
    <NotFoundScreen
      locale="ar"
      kicker="كل الطرق"
      title="هذا الطريق لا يصل إلى هنا"
      lead="الصفحة غير موجودة أو لم تعد معروضة. عد إلى المعرض أو تصفح السيارات على الأرض."
      home="العودة إلى المعرض"
      inventory="سيارات المعرض"
    />
  );
}
