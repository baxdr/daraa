import Link from 'next/link';

export function ComplianceWithoutUrlNotice() {
  return (
    <section className="mb-12 border-s-2 border-accent bg-accent-soft/60 px-6 py-6">
      <div className="flex items-baseline gap-3">
        <span aria-hidden className="text-lg">
          ℹ️
        </span>
        <h3 className="font-display text-xl font-extrabold tracking-tight text-accent-strong">
          هذا التقرير مبني على إجاباتك فقط
        </h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">
        ما فحصنا موقعك — يعني ممكن يكون فيه فجوات إضافية ما نعرف عنها (سياسة الخصوصية، رؤوس الأمان،
        أدوات التتبع، النماذج). عطنا رابط موقعك عشان نعطيك تقرير أدق.
      </p>
      <Link href="/chat" className="btn-outline mt-5 inline-flex text-sm">
        أضف رابط الموقع وأعد الفحص
        <span aria-hidden className="ms-2">
          ←
        </span>
      </Link>
    </section>
  );
}

export function EstablishmentToComplianceHandoff({ projectId }: { projectId: string }) {
  return (
    <section className="mb-12 border-s-2 border-ink bg-paper-2 px-6 py-7">
      <div className="flex items-baseline gap-3">
        <span aria-hidden className="text-lg">
          🔄
        </span>
        <h3 className="font-display text-2xl font-extrabold tracking-tight">فتحت مشروعك؟</h3>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
        درع يقدر يفحص وضعك الحالي ويتأكد إنك ملتزم بكل الأنظمة — نفس الجهات اللي جهّزناها لك فوق.
        بنسألك بعض أسئلة إضافية عن وضعك (موظفين، بيانات، رخص سارية) وبنعطيك تقرير شامل بنسبة
        الامتثال والفجوات.
      </p>
      <Link href={`/chat?continueFrom=${projectId}`} className="btn-ink mt-6 inline-flex text-sm">
        ابدأ فحص الامتثال
        <span aria-hidden className="ms-2">
          ←
        </span>
      </Link>
      <p className="mt-3 text-xs text-muted">
        اسم الشركة، نوع النشاط، والمدينة محفوظين — ما نعيد سؤالك عنهم.
      </p>
    </section>
  );
}
