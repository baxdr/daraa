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
          title="تكلّم بالعربي"
          body="قل ودي أفتح كوفي بجدة — Claude يفهم قصدك ويسألك بس اللي يحتاجه."
        />
        <Step
          num="٢"
          icon="⚙️"
          title="الوكلاء يشتغلون"
          body="١٩ وكيل متخصص يحلل وضعك بالتوازي — تشوف الحوار بينهم مباشرة."
        />
        <Step
          num="٣"
          icon="📋"
          title="خارطة طريق جاهزة"
          body="تسلسل · تكاليف · وثائق · تحذيرات — كل شي في مكان واحد."
        />
      </ol>
    </section>
  );
}
