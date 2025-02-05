import { Link } from "react-router-dom";
import BottomNav from "../../components/BottomNav";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-100 to-white p-4">
      <h1 className="mb-4 text-2xl font-bold">Aprende el Alfabeto Español</h1>
      <Link
        to="/menu"
        className="inline-block rounded-xl bg-blue-500 px-8 py-4 font-semibold text-white uppercase hover:bg-blue-600"
      >
        Empezar
      </Link>
      <BottomNav />
    </div>
  );
}
