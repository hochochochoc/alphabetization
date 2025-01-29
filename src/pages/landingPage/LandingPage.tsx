import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-white p-4">
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
        <h1 className="mb-4 text-2xl font-bold">Aprende el alfabeto español</h1>
        <Link
          to="/test"
          className="inline-block rounded-xl bg-blue-500 px-8 py-4 font-semibold text-white hover:bg-blue-600"
        >
          Empezar
        </Link>
      </div>
    </div>
  );
}
