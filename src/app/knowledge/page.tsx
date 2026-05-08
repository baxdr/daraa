import { KnowledgeCatalogPage } from '@/presentation/knowledge-catalog/page-shell';

export const metadata = {
  title: 'قاعدة المعرفة — درع',
  description: 'الجهات الحكومية اللي يحتاجها محلك — متطلبات، تواريخ تجديد، رسوم تقديرية.',
};

export default function KnowledgePage() {
  return <KnowledgeCatalogPage />;
}
