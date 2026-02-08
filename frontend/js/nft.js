window.AC = window.AC || {};

AC.getCerts = AC.getCerts || function () {
  try { return JSON.parse(localStorage.getItem(AC.LS.certs) || "null") ?? []; }
  catch { return []; }
};

AC.setCerts = AC.setCerts || function (v) {
  localStorage.setItem(AC.LS.certs, JSON.stringify(v));
};

AC.hasCertificate = function (courseId) {
  return AC.getCerts().some(c => c.courseId === courseId);
};

AC.claimCertificate = function (courseId) {
  const course = (AC.COURSES || []).find(c => c.id === courseId);
  const myEntry = (AC.getMyCourses ? AC.getMyCourses() : []).find(x => x.id === courseId);

  if (!myEntry || !myEntry.purchasedAt) {
    AC.toast?.("Please buy the course first.");
    return;
  }

  if ((myEntry.progress ?? 0) < 1) {
    AC.toast?.("Certificate is available only after 100% progress.");
    return;
  }

  if (AC.hasCertificate(courseId)) {
    AC.toast?.("Certificate already claimed.");
    return;
  }

  const certs = AC.getCerts();

  certs.unshift({
    id: "cert-" + Date.now(),
    courseId,
    title: `${course?.title ?? courseId} — NFT Certificate`,
    owner: AC.state?.account || "—",
    issuedAt: new Date().toISOString().slice(0, 10),
    txHashMock: "0x" + Math.random().toString(16).slice(2).padEnd(64, "0")
  });

  AC.setCerts(certs);

  AC.toast?.("Certificate claimed and added to My Certificates.");
  location.hash = "#/certificates";
};

AC.renderCertificates = function () {
  AC.setPage?.("My Certificates", "Certificates you claimed after completing courses (demo).");

  const certs = AC.getCerts();
  if (certs.length === 0) {
    document.getElementById("page").innerHTML = `
      <div class="card block">
        <div class="h2">No certificates yet</div>
        <div class="muted">Buy a course → reach 100% progress → claim certificate.</div>
      </div>
    `;
    return;
  }

  const rows = certs.map(c => {
    const course = (AC.COURSES || []).find(k => k.id === c.courseId);
    return `
      <tr>
        <td><b>${c.title}</b><div class="small">course: ${course?.title || c.courseId}</div></td>
        <td>
          <span class="tag ok">owner: <span class="mono">${AC.shortAddr ? AC.shortAddr(c.owner) : c.owner}</span></span>
          <span class="tag">date: ${c.issuedAt}</span>
        </td>
        <td><span class="tag">proof (demo): <span class="mono">${String(c.txHashMock).slice(0, 10)}…</span></span></td>
      </tr>
    `;
  }).join("");

  document.getElementById("page").innerHTML = `
    <div class="grid">
      <div class="card block col12">
        <table class="table">
          <thead><tr><th>Certificate</th><th>Owner</th><th>Proof</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
};
