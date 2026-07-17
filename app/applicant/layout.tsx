import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Applicant Portal | Phil-Apex",
  description: "Track your application status and upload missing documents.",
};

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col">
        {/* We'll handle the header inside the individual pages since login doesn't need a logout button */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}