import { Step } from '../primitives/step';

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
      <div className="mb-12">
        <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          كيف يشتغل
        </h2>
      </div>
      <div className="rule mb-12" />

      <ol className="grid gap-10 md:grid-cols-3">
        <Step
          num="١"
          icon="💬"
          title="جاوب على الأسئلة"
          body="أسئلة محددة عن محلك — تواريخ الرخص، عدد الطفايات، مخرج الطوارئ، تواريخ الفحوصات."
        />
        <Step
          num="٢"
          icon="⚙️"
          title="١٠ ايجنتات Claude يفحصون"
          body="كل ايجنت متخصّص في جهة حكومية، يستدعي tools deterministic، ويولّد تفسير عربي."
        />
        <Step
          num="٣"
          icon="📅"
          title="تذكيرات تجديد آلية"
          body="بنرسل لك إيميل قبل كل انتهاء رخصة — مافي تجديد بيفوتك."
        />
      </ol>
    </section>
  );
}
