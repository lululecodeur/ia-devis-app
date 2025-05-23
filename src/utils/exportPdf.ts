"use client";

export const exporterPDF = async () => {
  console.log("📄 Lancement export PDF !");
  const html2pdf = (await import("html2pdf.js")).default;
  console.log("📦 html2pdf importé !");

  const element = document.getElementById("devis-final");

  if (!element) {
    console.warn("❌ Élément #devis-final introuvable !");
    return;
  }

  if (element.innerText.trim() === "") {
    console.warn("⚠️ Rien à exporter : le contenu est vide.");
    alert("Le devis est vide. Veuillez remplir au moins une ligne.");
    return;
  }

  const today = new Date();
  const filename = `devis_${today.toLocaleDateString("fr-FR").replace(/\//g, "-")}.pdf`;

  // 🔧 Sauvegarder et désactiver transform temporairement pour l’export
  const oldTransform = element.style.transform;
  element.style.transform = "none";

  try {
    await html2pdf()
      .set({
        margin: 0, // Aucune marge : ton conteneur est déjà format A4
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 }, // haute qualité sans zoom faussé
        jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" } // dimensions exactes A4
      })
      .from(element)
      .save();
  } catch (err) {
    console.error("❌ Erreur lors de la génération du PDF :", err);
    alert("Une erreur est survenue lors de la génération du PDF.");
  } finally {
    // ✅ Restaurer le transform
    element.style.transform = oldTransform;
  }
};
