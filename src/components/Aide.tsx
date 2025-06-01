'use client';

import { useState } from 'react';
import Button from '@/components/ui/bouton';

interface AideProps {
  contenu: string;
  titre?: string;
}

export default function Aide({ contenu, titre = 'Aide' }: AideProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="mb-0">
      <Button onClick={() => setOuvert(!ouvert)} variant="outline" size="xs">
        {ouvert ? `❌ Fermer l’aide` : `ℹ️ ${titre}`}
      </Button>

      {ouvert && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm whitespace-pre-line leading-relaxed text-gray-800">
          {contenu}
        </div>
      )}
    </div>
  );
}
