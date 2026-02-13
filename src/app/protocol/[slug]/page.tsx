import { protocols } from "@/lib/protocols";
import Link from "next/link";
import ProtocolDashboard from "@/components/ProtocolDashboard";

export default async function ProtocolPage({
  params,
}: {
  params: { slug: string };
}) {
  const protocol = protocols[params.slug];

  if (!protocol) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="font-heading text-4xl font-bold text-gray-100 mb-4">
          Protocol Not Found
        </h1>
        <p className="text-gray-500 mb-8">
          The protocol you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="bg-cyber-500 hover:bg-cyber-600 text-dark-bg font-heading font-bold tracking-wider px-6 py-3 rounded-lg transition-colors uppercase text-sm"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return <ProtocolDashboard protocol={protocol} />;
}
