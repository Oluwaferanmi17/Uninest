import Sidebar from "@/components/ui/Sidebar";

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <div className="flex-1 bg-background">
        <div className="p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
