import { ScanProgress } from '@/components/scan-progress';

export default function ScanProgressPage({ params }: { params: { scanId: string } }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <ScanProgress scanId={params.scanId} />
    </main>
  );
}
