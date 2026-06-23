import AdminNav from '@/components/AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0E11]">
      {/* Injection automatique du menu global sur toutes les pages enfants */}
      <AdminNav />
      
      {/* Contenu spécifique de chaque épreuve */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}