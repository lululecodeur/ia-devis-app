"use client";

export const exporterPDF = async (element?: HTMLElement) => {
  const debug = (msg: string) => {
    const div = document.getElementById("debug-log");
    if (div) div.innerHTML += `\n${msg}`;
  };

  debug("📄 Lancement export PDF !");
  const html2pdf = (await import("html2pdf.js")).default;
  debug("📦 html2pdf importé !");

  if (!element) {
    debug("❌ Aucun élément transmis à exporterPDF");
    return;
  }

  if (element.innerText.trim() === "") {
    debug("⚠️ Le devis est vide.");
    return;
  }

  debug("🎯 Élément reçu : " + element.id);
  debug("📏 Dimensions: " + element.offsetWidth + " x " + element.offsetHeight);
  debug("🧾 innerText: " + element.innerText.slice(0, 100));

  const today = new Date();
  const filename = `devis_${today.toLocaleDateString("fr-FR").replace(/\//g, "-")}.pdf`;

  const oldTransform = element.style.transform;
  element.style.transform = "none";

  // ✅ Ajout de styles correcteurs pour mobile
  element.style.width = "794px";
  element.style.minHeight = "1123px";
  element.style.padding = "32px";
  element.style.backgroundColor = "#ffffff";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.fontSize = "14px";
  element.style.lineHeight = "1.5";

  try {
    await new Promise((res) => setTimeout(res, 100));
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" },
      })
      .from(element)
      .save();

    debug("✅ PDF généré avec succès");
  } catch (err) {
    console.error("❌ Erreur lors de la génération du PDF :", err);
    debug("❌ Erreur : " + err);
  } finally {
    element.style.transform = oldTransform;
  }
};
