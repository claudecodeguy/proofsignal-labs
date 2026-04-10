// The login page doesn't need the admin sidebar layout
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas" style={{ marginLeft: 0 }}>
      {children}
    </div>
  );
}
