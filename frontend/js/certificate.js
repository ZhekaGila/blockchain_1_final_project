window.AC = window.AC || {};

(function () {
  let pendingCert = null;

  function openCertModal(certPayload) {
    pendingCert = certPayload;

    const safe = (v) => (v === null || v === undefined || v === "") ? "—" : String(v);

    document.getElementById("certDate").textContent = safe(certPayload.issuedAt);

    document.getElementById("certId").textContent =
      safe(certPayload.id || (certPayload.tokenId ? ("NFT #" + certPayload.tokenId) : ""));

    document.getElementById("certFullName").textContent =
      safe(certPayload.fullName || (AC.shortAddr ? AC.shortAddr(certPayload.owner) : certPayload.owner));

    document.getElementById("certCourseTitle").textContent =
      safe(certPayload.courseTitle || certPayload.title || certPayload.courseId);

    document.getElementById("certIssuer").textContent =
      safe(certPayload.issuer || "Course Platform");

    document.getElementById("certWallet").textContent =
      safe(certPayload.owner);

    document.getElementById("certProof").textContent =
      safe(certPayload.txHash || certPayload.proof || certPayload.txHashMock);

    document.getElementById("certModal").classList.add("show");
  }

  function closeCertModal() {
    document.getElementById("certModal").classList.remove("show");
  }

async function downloadCertificatePNG() {
  const node = document.getElementById("certificateView");
  try {
    const canvas = await html2canvas(node, {
      backgroundColor: "#000000", 
      scale: 10
    });

    const url = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = url;
    a.download = `${pendingCert?.id || "certificate"}.png`;
    a.click();

    AC.toast?.("PNG downloaded.");
  } catch (err) {
    console.error(err);
    AC.toast?.("Failed to export certificate.");
  }
}

  function wireCertificateUI() {
    const closeBtn = document.getElementById("closeCertBtn");
    const downloadBtn = document.getElementById("downloadCertBtn");
    const backdrop = document.getElementById("certModal");

    if (closeBtn) closeBtn.addEventListener("click", closeCertModal);
    if (downloadBtn) downloadBtn.addEventListener("click", downloadCertificatePNG);

    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeCertModal();
      });
    }
  }

  AC.Cert = {
    wireCertificateUI,
    viewCertificate: openCertModal
  };
})();
