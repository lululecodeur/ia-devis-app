export default function TestSticky() {
  return (
    <main className="min-h-screen bg-gray-100 p-8 font-sans text-black">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Colonne gauche avec contenu long pour scroller */}
        <div className="lg:w-1/2 space-y-6">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded shadow p-6 border border-gray-200"
            >
              Bloc #{i + 1}
            </div>
          ))}
        </div>

        {/* Colonne droite sticky */}
        <div className="lg:w-1/2 flex justify-end">
          <div className="sticky top-8 w-full max-w-[500px] bg-white border p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Je suis sticky !</h2>
            <p>Je reste collé en haut pendant que tu scrolles 👇</p>
          </div>
        </div>
      </div>
    </main>
  );
}
