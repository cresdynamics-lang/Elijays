export const metadata = {
  title: { default: "Admin", template: "%s · ELIJAYS Admin" },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-ivory">
      {children}
    </div>
  );
}
