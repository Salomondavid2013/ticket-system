import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement réussi !
        </h1>
        <p className="text-gray-600 mb-6">
          Vos billets ont été générés. Vous recevrez un email de confirmation
          sous peu avec vos billets PDF et QR codes.
        </p>
        <Link
          href="/"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
